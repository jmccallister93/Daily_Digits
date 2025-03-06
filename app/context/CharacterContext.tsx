// context/CharacterContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Stat = {
    name: string;
    value: number;
};

type Category = {
    score: number;
    stats: Stat[];
};

type CharacterSheet = {
    physical: Category;
    mind: Category;
    social: Category;
};

type ActivityLog = {
    id: string;
    date: string;
    activity: string;
    category: string;
    stat: string;
    points: number;
};

type CharacterContextType = {
    characterSheet: CharacterSheet;
    activityLog: ActivityLog[];
    updateStat: (category: string, statName: string, points: number) => void;
    logActivity: (activity: string, category: string, stat: string, points: number) => void;
};

const defaultCharacterSheet: CharacterSheet = {
    physical: {
        score: 10,
        stats: [
            { name: "Strength", value: 0 },
            { name: "Endurance", value: 0 },
            { name: "Flexibility", value: 0 },
            { name: "Nutrition", value: 0 },
            { name: "Sleep Quality", value: 0 }
        ]
    },
    mind: {
        score: 10,
        stats: [
            { name: "Knowledge", value: 0 },
            { name: "Creativity", value: 0 },
            { name: "Problem Solving", value: 0 },
            { name: "Focus", value: 0 },
            { name: "Learning", value: 0 }
        ]
    },
    social: {
        score: 10,
        stats: [
            { name: "Relationships", value: 0 },
            { name: "Self-Awareness", value: 0 },
            { name: "Gratitude", value: 0 },
            { name: "Purpose", value: 0 },
            { name: "Happiness", value: 0 }
        ]
    },
};

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export const CharacterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [characterSheet, setCharacterSheet] = useState<CharacterSheet>(defaultCharacterSheet);
    const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);

    // Load saved data on app start
    useEffect(() => {
        const loadData = async () => {
            try {
                const savedCharacterSheet = await AsyncStorage.getItem('characterSheet');
                const savedActivityLog = await AsyncStorage.getItem('activityLog');

                if (savedCharacterSheet) {
                    setCharacterSheet(JSON.parse(savedCharacterSheet));
                }

                if (savedActivityLog) {
                    setActivityLog(JSON.parse(savedActivityLog));
                }
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        };

        loadData();
    }, []);

    // Save data whenever it changes
    useEffect(() => {
        const saveData = async () => {
            try {
                await AsyncStorage.setItem('characterSheet', JSON.stringify(characterSheet));
                await AsyncStorage.setItem('activityLog', JSON.stringify(activityLog));
            } catch (error) {
                console.error('Error saving data:', error);
            }
        };

        saveData();
    }, [characterSheet, activityLog]);

    const updateStat = (category: string, statName: string, points: number) => {
        setCharacterSheet(prevSheet => {
            // Create a deep copy of the character sheet
            const newSheet = JSON.parse(JSON.stringify(prevSheet)) as CharacterSheet;

            // Get the category object
            const categoryObj = newSheet[category as keyof CharacterSheet];
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

    const logActivity = (activity: string, category: string, stat: string, points: number) => {
        // Create a new activity log entry
        const newActivity: ActivityLog = {
            id: Date.now().toString(), // Simple ID for now
            date: new Date().toISOString(),
            activity,
            category,
            stat,
            points
        };

        // Add to activity log
        setActivityLog(prevLog => [...prevLog, newActivity]);

        // Update the corresponding stat
        updateStat(category, stat, points);
    };

    return (
        <CharacterContext.Provider value={{ characterSheet, activityLog, updateStat, logActivity }}>
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