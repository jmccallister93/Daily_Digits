// app/context/DecayTimerContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCharacter } from './CharacterContext';
import * as Notifications from 'expo-notifications';

// Define the structure for decay settings
// Update DecaySetting type
export type DecaySetting = {
    categoryId: string;
    statName: string;
    points: number; // How many points to decrease
    timeValue: number; // Numeric value for timer
    timeUnit: 'minutes' | 'hours' | 'days'; // Time unit
    lastUpdate: string; // ISO date string of last activity or decay
    enabled: boolean; // Whether this decay timer is active
};
// Type for our context
type DecayTimerContextType = {
    decaySettings: Record<string, DecaySetting>; // Key is `${categoryId}-${statName}`
    isLoading: boolean;

    // Methods
    addDecaySetting: (setting: Omit<DecaySetting, 'lastUpdate'>) => void;
    updateDecaySetting: (key: string, updates: Partial<DecaySetting>) => void;
    removeDecaySetting: (key: string) => void;
    resetTimer: (categoryId: string, statName: string, pointsAdded: number) => void;
    getSettingKey: (categoryId: string, statName: string) => string;
    getDecaySettingForStat: (categoryId: string, statName: string) => DecaySetting | null;
    getTimeUntilNextDecay: (categoryId: string, statName: string) => { days: number, hours: number, minutes: number } | null;
};

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const DecayTimerContext = createContext<DecayTimerContextType | undefined>(undefined);

export const DecayTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { updateStat, activityLog } = useCharacter();
    const [decaySettings, setDecaySettings] = useState<Record<string, DecaySetting>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Helper function to create a unique key for each stat's decay setting
    const getSettingKey = (categoryId: string, statName: string): string => {
        return `${categoryId}-${statName}`;
    };

    // Load saved decay settings on app start
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedSettings = await AsyncStorage.getItem('decaySettings');
                if (savedSettings) {
                    setDecaySettings(JSON.parse(savedSettings));
                }
            } catch (error) {
                console.error('Error loading decay settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, []);

    // Save settings whenever they change
    useEffect(() => {
        // Don't save during initial loading
        if (isLoading) return;

        const saveSettings = async () => {
            try {
                await AsyncStorage.setItem('decaySettings', JSON.stringify(decaySettings));
            } catch (error) {
                console.error('Error saving decay settings:', error);
            }
        };

        saveSettings();
    }, [decaySettings, isLoading]);

    // Check for decays that need to be applied (run hourly)
    useEffect(() => {
        if (isLoading) return;

        // Set up a timer to check decays
        const checkInterval = setInterval(() => {
            applyDecays();
        }, 60 * 60 * 1000); // Check every hour

        // Also check on initial load
        applyDecays();

        return () => clearInterval(checkInterval);
    }, [decaySettings, isLoading]);


    // Reset timer when a new activity is logged
    // Reset timer when a new activity is logged (in useEffect)
    useEffect(() => {
        if (isLoading || activityLog.length === 0) return;

        // Get the most recent activity
        const latestActivity = activityLog[activityLog.length - 1];

        // If it's a new activity (using a timestamp check)
        if (latestActivity && new Date(latestActivity.date).getTime() > Date.now() - 5000) {
            const stats = Array.isArray(latestActivity.stat)
                ? latestActivity.stat
                : [latestActivity.stat];

            stats.forEach(statName => {
                resetTimer(latestActivity.category, statName, latestActivity.points);
                console.log(`Timer reset for ${latestActivity.category}-${statName} due to new activity`);
            });
        }
    }, [activityLog, isLoading]);

    // Add this to your app's main component or initialization code
    useEffect(() => {
        const requestPermissions = async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                console.log('Notification permissions not granted');
            }
        };

        requestPermissions();
    }, []);

    // Function to send decay notification
    const sendDecayNotification = async (setting: DecaySetting, pointsDeducted: number) => {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Skill Decay Occurred',
                    body: `Your ${setting.statName} skill in ${setting.categoryId} category decreased by ${pointsDeducted} points due to inactivity.`,
                    data: { categoryId: setting.categoryId, statName: setting.statName },
                },
                trigger: null, // Send immediately
            });
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    };

    // Calculate time until next decay
    const getTimeUntilNextDecay = (categoryId: string, statName: string): { days: number, hours: number, minutes: number } | null => {
        const key = getSettingKey(categoryId, statName);
        const setting = decaySettings[key];

        if (!setting || !setting.enabled) return null;

        const now = new Date();
        const lastUpdate = new Date(setting.lastUpdate);

        // Calculate milliseconds based on the time unit
        let msToAdd;
        switch (setting.timeUnit) {
            case 'minutes':
                msToAdd = setting.timeValue * 60 * 1000;
                break;
            case 'hours':
                msToAdd = setting.timeValue * 60 * 60 * 1000;
                break;
            case 'days':
            default:
                msToAdd = setting.timeValue * 24 * 60 * 60 * 1000;
                break;
        }

        // Calculate when the next decay will happen
        const nextDecayTime = new Date(lastUpdate.getTime() + msToAdd);

        // If the next decay time is in the past, return zero
        if (nextDecayTime <= now) {
            return { days: 0, hours: 0, minutes: 0 };
        }

        // Calculate the time difference
        const diffMs = nextDecayTime.getTime() - now.getTime();

        // Convert to days, hours, minutes
        const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        return { days, hours, minutes };
    };
    // Apply decays for attributes that haven't been updated in the specified timeframe
    const applyDecays = () => {
        const now = new Date();
        const updatedSettings: Record<string, DecaySetting> = { ...decaySettings };
        let hasChanges = false;

        // Check each decay setting
        Object.entries(decaySettings).forEach(([key, setting]) => {
            if (!setting.enabled) return;

            const lastUpdate = new Date(setting.lastUpdate);

            // Calculate milliseconds based on the time unit
            let msPerUnit;
            switch (setting.timeUnit) {
                case 'minutes':
                    msPerUnit = 60 * 1000;
                    break;
                case 'hours':
                    msPerUnit = 60 * 60 * 1000;
                    break;
                case 'days':
                default:
                    msPerUnit = 24 * 60 * 60 * 1000;
                    break;
            }

            // Calculate time since last update in the appropriate unit
            const msSinceUpdate = now.getTime() - lastUpdate.getTime();
            const unitsSinceUpdate = msSinceUpdate / msPerUnit;

            // If enough time has passed, apply decay
            if (unitsSinceUpdate >= setting.timeValue) {
                // Calculate how many decay cycles have passed
                const decayCycles = Math.floor(unitsSinceUpdate / setting.timeValue);
                const pointsToDeduct = setting.points * decayCycles;

                // Apply the stat change
                updateStat(setting.categoryId, setting.statName, -pointsToDeduct);

                // Calculate the new lastUpdate time by adding the exact units that were "consumed"
                const consumedMilliseconds = decayCycles * setting.timeValue * msPerUnit;
                const newLastUpdate = new Date(lastUpdate.getTime() + consumedMilliseconds);

                // Update the last update time
                updatedSettings[key] = {
                    ...setting,
                    lastUpdate: newLastUpdate.toISOString()
                };

                hasChanges = true;

                // Send notification (to be implemented in part 2)
                sendDecayNotification(setting, pointsToDeduct);

                console.log(`Decay applied to ${setting.statName}: -${pointsToDeduct} points`);
            }
        });

        // If any changes were made, update the state
        if (hasChanges) {
            setDecaySettings(updatedSettings);
        }
    };

    // Add a new decay setting
    const addDecaySetting = (setting: Omit<DecaySetting, 'lastUpdate'>) => {
        const key = getSettingKey(setting.categoryId, setting.statName);

        setDecaySettings(prev => ({
            ...prev,
            [key]: {
                ...setting,
                lastUpdate: new Date().toISOString() // Set initial last update to now
            }
        }));

        // console.log(`Decay setting added for ${setting.categoryId}-${setting.statName}: ${setting.points} points every ${setting.days} days`);
    };

    // Update an existing decay setting
    const updateDecaySetting = (key: string, updates: Partial<DecaySetting>) => {
        setDecaySettings(prev => {
            if (!prev[key]) return prev;

            return {
                ...prev,
                [key]: {
                    ...prev[key],
                    ...updates
                }
            };
        });
    };

    // Remove a decay setting
    const removeDecaySetting = (key: string) => {
        setDecaySettings(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    };

    // Reset a timer when an activity is logged
    // Reset a timer when an activity is logged
    const resetTimer = (categoryId: string, statName: string, pointsAdded: number) => {
        const key = getSettingKey(categoryId, statName);

        setDecaySettings(prev => {
            if (!prev[key]) return prev;

            // Use the exact current time for precise timing
            const now = new Date();

            // Only reset timer if positive points were added (for activity logging)
            // or if negative points were applied (for decay)
            if (pointsAdded > 0 || pointsAdded < 0) {
                return {
                    ...prev,
                    [key]: {
                        ...prev[key],
                        lastUpdate: now.toISOString()
                    }
                };
            }

            return prev;
        });
    };

    // Get the decay setting for a specific stat
    const getDecaySettingForStat = (categoryId: string, statName: string): DecaySetting | null => {
        const key = getSettingKey(categoryId, statName);
        return decaySettings[key] || null;
    };

    return (
        <DecayTimerContext.Provider value={{
            decaySettings,
            isLoading,
            addDecaySetting,
            updateDecaySetting,
            removeDecaySetting,
            resetTimer,
            getSettingKey,
            getDecaySettingForStat,
            getTimeUntilNextDecay
        }}>
            {children}
        </DecayTimerContext.Provider>
    );
};

export const useDecayTimer = () => {
    const context = useContext(DecayTimerContext);
    if (context === undefined) {
        throw new Error('useDecayTimer must be used within a DecayTimerProvider');
    }
    return context;
};