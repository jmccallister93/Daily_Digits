// app/context/DecayTimerContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCharacter } from './CharacterContext';
import * as Notifications from 'expo-notifications';

// Define the structure for decay settings
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
    forceAddDecaySetting: (setting: Omit<DecaySetting, 'lastUpdate'>) => void
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
    const { updateStat, activityLog, characterSheet } = useCharacter();
    const [decaySettings, setDecaySettings] = useState<Record<string, DecaySetting>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [decayTimers, setDecayTimers] = useState<Record<string, NodeJS.Timeout>>({});

    // Helper function to create a unique key for each stat's decay setting
    const getSettingKey = (categoryId: string, statName: string): string => {
        return `${categoryId}-${statName}`;
    };

    // Function to check if a stat exists in the character data
    const statExists = (categoryId: string, statName: string): boolean => {
        const category = characterSheet.categories[categoryId];
        if (!category) return false;

        return category.stats.some(stat => stat.name === statName);
    };

    // Function to schedule a decay timer for a specific setting
    const scheduleDecayTimer = (settingKey: string, setting: DecaySetting) => {
        // Cancel any existing timer for this setting
        if (decayTimers[settingKey]) {
            clearTimeout(decayTimers[settingKey]);
        }

        if (!setting.enabled) return;

        // Calculate when the next decay should happen
        const lastUpdate = new Date(setting.lastUpdate);
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

        // Validate the timeValue to ensure it's a positive number
        if (isNaN(msToAdd) || msToAdd <= 0) {
            console.error(`Invalid time value for ${setting.statName}: ${setting.timeValue} ${setting.timeUnit}`);
            return; // Exit early to prevent setting an invalid timer
        }

        // Calculate the next decay time
        const nextDecayTime = new Date(lastUpdate.getTime() + msToAdd);

        // Calculate milliseconds until next decay
        const now = new Date();
        const msUntilDecay = Math.max(0, nextDecayTime.getTime() - now.getTime());

        console.log(`Scheduling decay for ${setting.statName}: next decay in ${msUntilDecay / 1000} seconds`);

        // Only schedule if we have a valid time (greater than 1 second to avoid immediate triggers)
        if (msUntilDecay > 1000) {
            // Schedule the timer
            const timerId = setTimeout(() => {
                console.log(`Decay timer fired for ${setting.statName}`);

                // Check if the stat still exists in the character data before applying decay
                if (statExists(setting.categoryId, setting.statName)) {
                    // Apply the decay only if the stat still exists
                    updateStat(setting.categoryId, setting.statName, -setting.points);

                    // Update the last update time to reset the timer
                    const newSetting = {
                        ...setting,
                        lastUpdate: new Date().toISOString()
                    };

                    // Update the setting in context
                    setDecaySettings(prev => ({
                        ...prev,
                        [settingKey]: newSetting
                    }));

                    // Send notification with more user-friendly names
                    sendDecayNotification(setting, setting.points);

                    // Schedule the next decay
                    scheduleDecayTimer(settingKey, newSetting);
                } else {
                    console.log(`Stat ${setting.statName} in ${setting.categoryId} no longer exists. Removing decay timer.`);
                    removeDecaySetting(settingKey);
                }
            }, msUntilDecay);

            // Save the timer ID
            setDecayTimers(prev => ({
                ...prev,
                [settingKey]: timerId
            }));
        } else {
            console.warn(`Decay time too small for ${setting.statName}, skipping timer setup`);
        }
    };

    // Load saved decay settings on app start
    // Load saved decay settings on app start
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedSettings = await AsyncStorage.getItem('decaySettings');
                if (savedSettings) {
                    // Parse the saved settings
                    const loadedSettings = JSON.parse(savedSettings);
                    console.log(`Loaded ${Object.keys(loadedSettings).length} decay settings from AsyncStorage`);

                    // Store the settings
                    setDecaySettings(loadedSettings);
                } else {
                    console.log("No decay settings found in AsyncStorage");
                }
            } catch (error) {
                console.error('Error loading decay settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, []);

    // Process missed decays after both character data and decay settings are loaded
    useEffect(() => {
        if (isLoading || Object.keys(decaySettings).length === 0 ||
            !characterSheet || Object.keys(characterSheet.categories).length === 0) {
            return;
        }

        console.log("Checking for missed decays after both data sources loaded");
        const now = new Date();
        let hasChanges = false;
        const updatedSettings = { ...decaySettings };

        // Process all settings
        Object.entries(decaySettings).forEach(([key, setting]) => {
            // First verify the stat still exists - but only if not during initial app load
            const appJustStarted = now.getTime() - new Date(setting.lastUpdate).getTime() < 5000;

            if (!appJustStarted && !statExists(setting.categoryId, setting.statName)) {
                // Remove this setting since the stat no longer exists
                delete updatedSettings[key];
                hasChanges = true;
                console.log(`Removing decay setting for non-existent stat: ${setting.statName} in ${setting.categoryId}`);
                return;
            }

            if (setting.enabled) {
                const lastUpdate = new Date(setting.lastUpdate);
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

                // Skip if timeValue is invalid
                if (isNaN(setting.timeValue) || setting.timeValue <= 0) {
                    console.warn(`Skipping decay check for ${setting.statName} - invalid time value: ${setting.timeValue}`);
                    return;
                }

                const msSinceUpdate = now.getTime() - lastUpdate.getTime();
                const unitsSinceUpdate = msSinceUpdate / msPerUnit;

                if (unitsSinceUpdate >= setting.timeValue) {
                    const decayCycles = Math.floor(unitsSinceUpdate / setting.timeValue);
                    const pointsToDeduct = setting.points * decayCycles;

                    // Apply stat change
                    updateStat(setting.categoryId, setting.statName, -pointsToDeduct);

                    // Update last update time
                    const consumedMs = decayCycles * setting.timeValue * msPerUnit;
                    const newLastUpdate = new Date(lastUpdate.getTime() + consumedMs);

                    updatedSettings[key] = {
                        ...setting,
                        lastUpdate: newLastUpdate.toISOString()
                    };

                    hasChanges = true;
                    sendDecayNotification(setting, pointsToDeduct);
                }
            }
        });

        // Update settings if changes were made
        if (hasChanges) {
            setDecaySettings(updatedSettings);
        }
    }, [isLoading, decaySettings, characterSheet, updateStat]);

    // Save settings whenever they change
    useEffect(() => {
        // Don't save during initial loading
        if (isLoading) return;

        console.log("Saving decay settings to AsyncStorage, count:", Object.keys(decaySettings).length);

        const saveSettings = async () => {
            try {
                await AsyncStorage.setItem('decaySettings', JSON.stringify(decaySettings));
            } catch (error) {
                console.error('Error saving decay settings:', error);
            }
        };

        saveSettings();
    }, [decaySettings, isLoading]);

    // Set up decay timers and check for removed stats
    useEffect(() => {
        if (isLoading) return;

        // Don't remove settings if characterSheet is still being loaded
        const characterSheetLoaded = characterSheet && Object.keys(characterSheet.categories).length > 0;

        console.log("Setting up decay timers for all settings", {
            decaySettingsCount: Object.keys(decaySettings).length,
            characterSheetLoaded
        });

        const timerIds: Record<string, NodeJS.Timeout> = {};
        const validSettings: Record<string, DecaySetting> = {};
        let removedAny = false;

        // Check each setting and set up timers for valid ones
        Object.entries(decaySettings).forEach(([key, setting]) => {
            // Only try to validate stats if character sheet is loaded
            const statValid = !characterSheetLoaded || statExists(setting.categoryId, setting.statName);

            if (statValid) {
                validSettings[key] = setting;

                if (setting.enabled) {
                    // Timer setup code remains the same...
                    // ...
                }
            } else {
                console.log(`Removing decay timer for removed stat: ${setting.statName} in ${setting.categoryId}`);
                removedAny = true;
            }
        });

        // Only update decay settings if character sheet is loaded AND we found invalid settings
        if (characterSheetLoaded && removedAny) {
            console.log(`Removing ${Object.keys(decaySettings).length - Object.keys(validSettings).length} invalid decay settings`);
            setDecaySettings(validSettings);
        }

        // Update all timers at once
        if (Object.keys(timerIds).length > 0) {
            setDecayTimers(prev => ({
                ...prev,
                ...timerIds
            }));
        }

        // Clean up all timers when unmounting
        return () => {
            Object.values(timerIds).forEach(timerId => clearTimeout(timerId));
        };
    }, [decaySettings, isLoading, characterSheet]);

    // Reset timer when a new activity is logged
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

    // Request notification permissions
    useEffect(() => {
        const requestPermissions = async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                console.log('Notification permissions not granted');
            }
        };

        requestPermissions();
    }, []);

    // Function to send decay notification with better formatting
    const sendDecayNotification = async (setting: DecaySetting, pointsDeducted: number) => {
        try {
            // Get a more readable category name by removing hyphens and capitalizing words
            const formatCategoryName = (categoryId: string) => {
                return categoryId
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            };

            const categoryName = formatCategoryName(setting.categoryId);

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Skill Decay Occurred',
                    body: `Your "${setting.statName}" decreased by ${pointsDeducted} points due to inactivity.`,
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

    // Add a new decay setting
    // Add to the DecayTimerProvider component
    const addDecaySetting = (setting: Omit<DecaySetting, 'lastUpdate'>, retryCount = 0) => {
        // Validate timeValue to prevent NaN issues
        if (isNaN(setting.timeValue) || setting.timeValue <= 0) {
            console.error(`Cannot add decay setting with invalid time value: ${setting.timeValue}`);
            return; // Don't add the setting if timeValue is invalid
        }

        // Check if the stat exists
        if (!statExists(setting.categoryId, setting.statName)) {
            console.error(`Cannot add decay setting for non-existent stat: ${setting.statName} in ${setting.categoryId}`);

            // If we haven't retried too many times, schedule a retry after a delay
            if (retryCount < 5) { // Try up to 5 times
                console.log(`Scheduling retry #${retryCount + 1} for decay setting: ${setting.statName} in ${setting.categoryId}`);
                setTimeout(() => {
                    addDecaySetting(setting, retryCount + 1);
                }, 1000); // Retry after 1 second
            }
            return;
        }

        // If we get here, the stat exists and we can add the setting
        console.log(`Successfully adding decay setting for ${setting.statName} in ${setting.categoryId} (attempt #${retryCount + 1})`);

        const key = getSettingKey(setting.categoryId, setting.statName);
        const newSetting = {
            ...setting,
            lastUpdate: new Date().toISOString()
        };

        setDecaySettings(prev => ({
            ...prev,
            [key]: newSetting
        }));

        // Schedule a decay timer for the new setting
        scheduleDecayTimer(key, newSetting as DecaySetting);
    };

    // Update an existing decay setting
    const updateDecaySetting = (key: string, updates: Partial<DecaySetting>) => {
        setDecaySettings(prev => {
            if (!prev[key]) return prev;

            const updatedSetting = {
                ...prev[key],
                ...updates
            };

            // Restart timer if necessary values changed
            if (
                updates.timeValue !== undefined ||
                updates.timeUnit !== undefined ||
                updates.enabled !== undefined
            ) {
                // Schedule will happen in the useEffect that watches decaySettings
            }

            return {
                ...prev,
                [key]: updatedSetting
            };
        });
    };

    // Remove a decay setting
    const removeDecaySetting = (key: string) => {
        // Clear the timer if it exists
        if (decayTimers[key]) {
            clearTimeout(decayTimers[key]);
        }

        setDecaySettings(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });

        setDecayTimers(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    };

    // Reset a timer when an activity is logged
    const resetTimer = (categoryId: string, statName: string, pointsAdded: number) => {
        const key = getSettingKey(categoryId, statName);
        const setting = decaySettings[key];

        if (!setting || !setting.enabled) return;

        // Only reset timer if positive points were added (for activity logging)
        // or if negative points were applied (for decay)
        if (pointsAdded > 0 || pointsAdded < 0) {
            const updatedSetting = {
                ...setting,
                lastUpdate: new Date().toISOString()
            };

            setDecaySettings(prev => ({
                ...prev,
                [key]: updatedSetting
            }));

            // Reschedule the timer
            scheduleDecayTimer(key, updatedSetting);
        }
    };

    // Get the decay setting for a specific stat
    const getDecaySettingForStat = (categoryId: string, statName: string): DecaySetting | null => {
        const key = getSettingKey(categoryId, statName);
        return decaySettings[key] || null;
    };

    const forceAddDecaySetting = (setting: Omit<DecaySetting, 'lastUpdate'>) => {
        const key = getSettingKey(setting.categoryId, setting.statName);
        const newSetting = {
            ...setting,
            lastUpdate: new Date().toISOString()
        };

        console.log(`Force adding decay setting for ${setting.statName} in ${setting.categoryId}`);

        // Directly update the settings state, bypassing validation
        setDecaySettings(prev => {
            const updated = {
                ...prev,
                [key]: newSetting as DecaySetting
            };

            // Save to AsyncStorage immediately to ensure persistence
            AsyncStorage.setItem('decaySettings', JSON.stringify(updated))
                .then(() => console.log(`Saved decay setting for ${setting.statName} to AsyncStorage`))
                .catch(error => console.error('Error saving decay settings:', error));

            return updated;
        });

        // Try to schedule the timer immediately if possible
        setTimeout(() => {
            if (decaySettings[key] && characterSheet.categories[setting.categoryId]) {
                scheduleDecayTimer(key, newSetting as DecaySetting);
            }
        }, 2000);
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
            getTimeUntilNextDecay,
            forceAddDecaySetting
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