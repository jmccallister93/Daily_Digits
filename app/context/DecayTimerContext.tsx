// app/context/DecayTimerContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCharacter } from './CharacterContext';

// Define the structure for decay settings
export type DecaySetting = {
    categoryId: string;
    statName: string;
    points: number; // How many points to decrease
    days: number; // Frequency in days
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
    resetTimer: (categoryId: string, statName: string) => void;
    getSettingKey: (categoryId: string, statName: string) => string;
    getDecaySettingForStat: (categoryId: string, statName: string) => DecaySetting | null;
};

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

    // Check for decays that need to be applied (run daily)
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
    useEffect(() => {
        if (isLoading || activityLog.length === 0) return;

        // Get the most recent activity
        const latestActivity = activityLog[activityLog.length - 1];

        // If it's a new activity AND the points are positive, reset the timer
        if (latestActivity && latestActivity.points > 0) {
            const stats = Array.isArray(latestActivity.stat)
                ? latestActivity.stat
                : [latestActivity.stat];

            stats.forEach(statName => {
                resetTimer(latestActivity.category, statName);
            });
        }
    }, [activityLog, isLoading]);

    // Apply decays for attributes that haven't been updated in the specified timeframe
    const applyDecays = () => {
        const now = new Date();
        const updatedSettings: Record<string, DecaySetting> = { ...decaySettings };
        let hasChanges = false;

        // Check each decay setting
        Object.entries(decaySettings).forEach(([key, setting]) => {
            if (!setting.enabled) return;

            const lastUpdate = new Date(setting.lastUpdate);
            const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

            // If enough days have passed, apply decay
            if (daysSinceUpdate >= setting.days) {
                // Calculate how many decay cycles have passed
                const decayCycles = Math.floor(daysSinceUpdate / setting.days);
                const pointsToDeduct = setting.points * decayCycles;

                // Apply the stat change
                updateStat(setting.categoryId, setting.statName, -pointsToDeduct);

                // Update the last update time
                updatedSettings[key] = {
                    ...setting,
                    lastUpdate: now.toISOString()
                };

                hasChanges = true;

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
    const resetTimer = (categoryId: string, statName: string) => {
        const key = getSettingKey(categoryId, statName);

        setDecaySettings(prev => {
            if (!prev[key]) return prev;

            // Simply use the current time without resetting to midnight
            const now = new Date();

            return {
                ...prev,
                [key]: {
                    ...prev[key],
                    lastUpdate: now.toISOString()
                }
            };
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
            getDecaySettingForStat
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