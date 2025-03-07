// context/CharacterContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types for our data structures
type Stat = {
    name: string;
    value: number;
};

// StatCategory type for customizable categories
export type StatCategory = {
    id: string;
    name: string;
    description: string;
    score: number;
    icon: string;
    gradient: [string, string];
    stats: Stat[];
};

// Simplified CharacterSheet with just categories map
type CharacterSheet = {
    categories: Record<string, StatCategory>;
};

export type ActivityLog = {
    id: string;
    date: string;
    activity: string;
    category: string;
    stat: string | string[];
    points: number;
};

// Updated context type with category management functions and loading state
type CharacterContextType = {
    characterSheet: CharacterSheet;
    activityLog: ActivityLog[];
    isLoading: boolean;
    updateStat: (categoryId: string, statName: string, points: number) => void;
    logActivity: (activity: string, categoryId: string, stat: string | string[], points: number) => void;
    // Category management
    addCategory: (category: Omit<StatCategory, 'id'>) => string;
    updateCategory: (id: string, updates: Partial<StatCategory>) => void;
    deleteCategory: (id: string) => void;
    // Activity management
    editActivity: (id: string, updates: Partial<Omit<ActivityLog, 'stat'> & { stat?: string | string[] }>) => void;
    deleteActivity: (id: string) => void;
};

// Create completely empty default character sheet
const DEFAULT_CHARACTER_SHEET: CharacterSheet = {
    categories: {}
};

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export const CharacterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [characterSheet, setCharacterSheet] = useState<CharacterSheet>({
        ...DEFAULT_CHARACTER_SHEET
    });
    const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved data on app start
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const savedCharacterSheet = await AsyncStorage.getItem('characterSheet');
                const savedActivityLog = await AsyncStorage.getItem('activityLog');

                if (savedCharacterSheet) {
                    const parsedSheet = JSON.parse(savedCharacterSheet);
                    // If loading from old format, migrate to new format
                    if (parsedSheet.physical || parsedSheet.mind || parsedSheet.social) {
                        // Extract categories from old format and create new sheet
                        const newCategories: Record<string, StatCategory> = {};

                        // Only add old categories if they exist
                        if (parsedSheet.categories) {
                            Object.assign(newCategories, parsedSheet.categories);
                        }

                        setCharacterSheet({
                            categories: newCategories
                        });
                    } else {
                        // Already in the new format
                        setCharacterSheet(parsedSheet);
                    }
                }

                if (savedActivityLog) {
                    setActivityLog(JSON.parse(savedActivityLog));
                }
            } catch (error) {
                console.error('Error loading saved data:', error);
            } finally {
                setTimeout(() => {
                    setIsLoading(false);
                }, 1000);
            }
        };

        loadData();
    }, []);

    // Save data whenever it changes
    useEffect(() => {
        // Don't save during initial loading
        if (isLoading) return;

        const saveData = async () => {
            try {
                await AsyncStorage.setItem('characterSheet', JSON.stringify(characterSheet));
                await AsyncStorage.setItem('activityLog', JSON.stringify(activityLog));
            } catch (error) {
                console.error('Error saving data:', error);
            }
        };

        saveData();
    }, [characterSheet, activityLog, isLoading]);

    // Update a specific stat
    const updateStat = (categoryId: string, statName: string, points: number) => {
        setCharacterSheet(prevSheet => {
            // Create a deep copy of the character sheet
            const newSheet = JSON.parse(JSON.stringify(prevSheet)) as CharacterSheet;

            // Get the category object
            const categoryObj = newSheet.categories[categoryId];
            if (!categoryObj) return prevSheet;

            // Find and update the specific stat
            const statIndex = categoryObj.stats.findIndex(s => s.name === statName);
            if (statIndex === -1) return prevSheet;

            // Update the stat value
            categoryObj.stats[statIndex].value += points;

            // Recalculate the category score (base 10 + sum of all stat values)
            categoryObj.score = 10 + categoryObj.stats.reduce((sum, stat) => sum + stat.value, 0);

            return newSheet;
        });
    };

    // Log a new activity
    // Log a new activity
    const logActivity = (activity: string, categoryId: string, stats: string | string[], points: number) => {
        // Create a new activity log entry
        const timestamp = new Date().toISOString();
        const activityId = Date.now().toString();

        // Create the activity object (works for both single stat and array of stats)
        const newActivity = {
            id: activityId,
            date: timestamp,
            activity,
            category: categoryId,
            stat: stats, // This can be a string or string[] 
            points
        };

        // Add the new activity to the log
        setActivityLog((prev: any) => [...prev, newActivity]);

        // Update each affected stat's value in the character sheet
        if (Array.isArray(stats)) {
            // Update multiple stats
            stats.forEach(statName => {
                // Update stat using the existing updateStat function
                updateStat(categoryId, statName, points);
            });
        } else {
            // Handle single stat (for backward compatibility)
            updateStat(categoryId, stats, points);
        }
    };


    // Add a new category
    const addCategory = (category: Omit<StatCategory, 'id'>): string => {
        const id = Date.now().toString(); // Use timestamp as a simple unique ID

        const newCategory: StatCategory = {
            ...category,
            id,
            stats: category.stats || [] // Ensure stats array exists
        };

        setCharacterSheet(prevSheet => {
            const updatedCategories = {
                ...prevSheet.categories,
                [id]: newCategory
            };

            return {
                ...prevSheet,
                categories: updatedCategories,
            };
        });

        return id; // Return the new ID
    };

    // Update an existing category
    const updateCategory = (id: string, updates: Partial<StatCategory>) => {
        setCharacterSheet(prevSheet => {
            if (!prevSheet.categories[id]) return prevSheet;

            const updatedCategory = {
                ...prevSheet.categories[id],
                ...updates
            };

            const updatedCategories = {
                ...prevSheet.categories,
                [id]: updatedCategory
            };

            return {
                ...prevSheet,
                categories: updatedCategories,
            };
        });
    };

    // Delete a category
    const deleteCategory = (id: string) => {
        setCharacterSheet(prevSheet => {
            const updatedCategories = { ...prevSheet.categories };
            delete updatedCategories[id];

            return {
                ...prevSheet,
                categories: updatedCategories
            };
        });
    };

    // Edit an existing activity
    const editActivity = (id: string, updates: Partial<ActivityLog>) => {
        setActivityLog(prevLog => {
            const activityIndex = prevLog.findIndex(a => a.id === id);
            if (activityIndex === -1) return prevLog;

            const updatedLog = [...prevLog];
            const originalActivity = updatedLog[activityIndex];

            // If we're updating the stat field, handle removing/adding stat points appropriately
            if (updates.stat !== undefined || updates.points !== undefined) {
                const oldStats = Array.isArray(originalActivity.stat)
                    ? originalActivity.stat
                    : [originalActivity.stat];
                const oldPoints = originalActivity.points;

                // Remove old stat points
                oldStats.forEach(statName => {
                    updateStat(originalActivity.category, statName, -oldPoints);
                });

                // Add new stat points if we have them
                const newStats = updates.stat !== undefined
                    ? (Array.isArray(updates.stat) ? updates.stat : [updates.stat])
                    : oldStats;
                const newPoints = updates.points !== undefined ? updates.points : oldPoints;

                newStats.forEach(statName => {
                    updateStat(originalActivity.category, statName, newPoints);
                });
            }

            // Update the activity with the new data
            updatedLog[activityIndex] = {
                ...originalActivity,
                ...updates
            };

            return updatedLog;
        });
    };

    // Delete an activity
    const deleteActivity = (id: string) => {
        setActivityLog(prevLog => prevLog.filter(activity => activity.id !== id));
    };

    return (
        <CharacterContext.Provider value={{
            characterSheet,
            activityLog,
            isLoading,
            updateStat,
            logActivity,
            addCategory,
            updateCategory,
            deleteCategory,
            editActivity,
            deleteActivity
        }}>
            {children}
        </CharacterContext.Provider>
    );
};

export const useCharacter = () => {
    const context = useContext(CharacterContext);
    if (context === undefined) {
        throw new Error('useCharacter must be used within a CharacterProvider');
    }
    return context;
};