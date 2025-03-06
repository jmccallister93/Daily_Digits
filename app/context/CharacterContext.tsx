// context/CharacterContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types for our data structures
type Stat = {
    name: string;
    value: number;
};

// New StatCategory type to support customizable categories
export type StatCategory = {
    id: string;
    name: string;
    description: string;
    score: number;
    icon: string;
    gradient: [string, string];
    stats: Stat[];
};

// Updated CharacterSheet with categories map
type CharacterSheet = {
    categories: Record<string, StatCategory>;
    // Keep these for backward compatibility
    physical: StatCategory;
    mind: StatCategory;
    social: StatCategory;
};

type ActivityLog = {
    id: string;
    date: string;
    activity: string;
    category: string;
    stat: string;
    points: number;
};

// Updated context type with category management functions and loading state
type CharacterContextType = {
    characterSheet: CharacterSheet;
    activityLog: ActivityLog[];
    isLoading: boolean;  // New loading state
    updateStat: (categoryId: string, statName: string, points: number) => void;
    logActivity: (activity: string, categoryId: string, stat: string, points: number) => void;
    // New functions for category management
    addCategory: (category: Omit<StatCategory, 'id'>) => void;
    updateCategory: (id: string, updates: Partial<StatCategory>) => void;
    deleteCategory: (id: string) => void;
    // Activity management
    editActivity: (id: string, updates: Partial<ActivityLog>) => void;
    deleteActivity: (id: string) => void;
};

// Default categories with IDs
const DEFAULT_CATEGORIES: Record<string, StatCategory> = {
    physical: {
        id: 'physical',
        name: 'Physical',
        description: 'Strength, dexterity, and endurance',
        score: 10,
        icon: '💪',
        gradient: ['#6366F1', '#8B5CF6'],
        stats: [
            { name: "Strength", value: 0 },
            { name: "Endurance", value: 0 },
            { name: "Flexibility", value: 0 },
            { name: "Nutrition", value: 0 },
            { name: "Sleep Quality", value: 0 }
        ]
    },
    mind: {
        id: 'mind',
        name: 'Mind',
        description: 'Intelligence, wisdom, and focus',
        score: 10,
        icon: '🧠',
        gradient: ['#3B82F6', '#06B6D4'],
        stats: [
            { name: "Knowledge", value: 0 },
            { name: "Creativity", value: 0 },
            { name: "Problem Solving", value: 0 },
            { name: "Focus", value: 0 },
            { name: "Learning", value: 0 }
        ]
    },
    social: {
        id: 'social',
        name: 'Social',
        description: 'Faith, willpower, and mindfulness',
        score: 10,
        icon: '✨',
        gradient: ['#EC4899', '#8B5CF6'],
        stats: [
            { name: "Relationships", value: 0 },
            { name: "Self-Awareness", value: 0 },
            { name: "Gratitude", value: 0 },
            { name: "Purpose", value: 0 },
            { name: "Happiness", value: 0 }
        ]
    }
};

// Updated default character sheet structure
const DEFAULT_CHARACTER_SHEET: CharacterSheet = {
    categories: DEFAULT_CATEGORIES,
    // For backward compatibility, we maintain references
    physical: DEFAULT_CATEGORIES.physical,
    mind: DEFAULT_CATEGORIES.mind,
    social: DEFAULT_CATEGORIES.social,
};

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export const CharacterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [characterSheet, setCharacterSheet] = useState<CharacterSheet>({
        ...DEFAULT_CHARACTER_SHEET,
        categories: { ...DEFAULT_CATEGORIES }, // Ensure categories is explicitly initialized
        physical: DEFAULT_CATEGORIES.physical,
        mind: DEFAULT_CATEGORIES.mind,
        social: DEFAULT_CATEGORIES.social
    });
    const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Initialize loading state as true

    // Load saved data on app start
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true); // Set loading to true before fetching data
            try {
                const savedCharacterSheet = await AsyncStorage.getItem('characterSheet');
                const savedActivityLog = await AsyncStorage.getItem('activityLog');

                if (savedCharacterSheet) {
                    const parsedSheet = JSON.parse(savedCharacterSheet) as CharacterSheet;

                    // Ensure the sheet has all required properties
                    // If loading an older format, migrate it to the new format
                    const updatedSheet: CharacterSheet = {
                        categories: parsedSheet.categories || {},
                        physical: parsedSheet.physical || DEFAULT_CHARACTER_SHEET.physical,
                        mind: parsedSheet.mind || DEFAULT_CHARACTER_SHEET.mind,
                        social: parsedSheet.social || DEFAULT_CHARACTER_SHEET.social,
                    };

                    // If no categories exist yet (old format), create them from the existing data
                    if (!parsedSheet.categories || Object.keys(parsedSheet.categories).length === 0) {
                        updatedSheet.categories = {
                            physical: updatedSheet.physical,
                            mind: updatedSheet.mind,
                            social: updatedSheet.social,
                        };
                    }

                    setCharacterSheet(updatedSheet);
                }

                if (savedActivityLog) {
                    setActivityLog(JSON.parse(savedActivityLog));
                }
            } catch (error) {
                console.error('Error loading saved data:', error);
            } finally {
                // Simulate a brief delay to ensure splash screen is visible
                // Remove this setTimeout in production if not needed
                setTimeout(() => {
                    setIsLoading(false); // Set loading to false after data is loaded
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

            // Update the direct category reference if it's one of the main three
            if (categoryId === 'physical') {
                newSheet.physical = categoryObj;
            } else if (categoryId === 'mind') {
                newSheet.mind = categoryObj;
            } else if (categoryId === 'social') {
                newSheet.social = categoryObj;
            }

            return newSheet;
        });
    };

    // Log a new activity
    const logActivity = (activity: string, categoryId: string, stat: string, points: number) => {
        // Create a new activity log entry
        const newActivity: ActivityLog = {
            id: Date.now().toString(), // Simple ID for now
            date: new Date().toISOString(),
            activity,
            category: categoryId,
            stat,
            points
        };

        // Add to activity log
        setActivityLog(prevLog => [...prevLog, newActivity]);

        // Update the corresponding stat
        updateStat(categoryId, stat, points);
    };

    // Add a new category
    const addCategory = (category: Omit<StatCategory, 'id'>) => {
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

            // Update reference properties if this is one of the default categories
            const updatedSheet = {
                ...prevSheet,
                categories: updatedCategories,
            };

            if (id === 'physical') {
                updatedSheet.physical = updatedCategory;
            } else if (id === 'mind') {
                updatedSheet.mind = updatedCategory;
            } else if (id === 'social') {
                updatedSheet.social = updatedCategory;
            }

            return updatedSheet;
        });
    };

    // Delete a category
    const deleteCategory = (id: string) => {
        // Prevent deletion of the three main categories
        if (id === 'physical' || id === 'mind' || id === 'social') {
            console.warn('Cannot delete default categories');
            return;
        }

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
            updatedLog[activityIndex] = {
                ...updatedLog[activityIndex],
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
            isLoading, // Add isLoading to the context
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