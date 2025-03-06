import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { theme } from "../../theme";
import { useState, useEffect } from "react";
import { useCharacter } from "../context/CharacterContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Define category types and their properties
type CategoryType = "physical" | "mind" | "social";

interface CategoryConfig {
    title: string;
    emoji: string;
    subtitle: string;
    colors: [string, string];
    descriptions: { [key: string]: string };
}

const categoryConfigs: Record<CategoryType, CategoryConfig> = {
    physical: {
        title: "Physical",
        emoji: "💪",
        subtitle: "Strength, endurance, and physical wellness",
        colors: ['#6366F1', '#8B5CF6'],
        descriptions: {
            "Strength": "Physical power and muscle development.",
            "Endurance": "Stamina and ability to sustain physical effort.",
            "Flexibility": "Range of motion and muscle elasticity.",
            "Nutrition": "Quality of diet and food choices.",
            "Sleep Quality": "Consistent, restful sleep patterns.",
        }
    },
    mind: {
        title: "Mind",
        emoji: "🧠",
        subtitle: "Knowledge, creativity, and mental skills",
        colors: ['#3B82F6', '#06B6D4'],
        descriptions: {
            "Knowledge": "Facts, information, and skills acquired through experience or education.",
            "Creativity": "Use of imagination to create original ideas or solutions.",
            "Problem Solving": "Ability to find solutions to difficult or complex issues.",
            "Focus": "Ability to concentrate attention on a task without distraction.",
            "Learning": "Acquisition of new skills, concepts, or understanding.",
        }
    },
    social: {
        title: "Social",
        emoji: "✨",
        subtitle: "Relationships, purpose, and emotional health",
        colors: ['#EC4899', '#8B5CF6'],
        descriptions: {
            "Relationships": "Quality of connections with friends, family, and partners.",
            "Self-Awareness": "Understanding of one's own character, feelings, motives, and desires.",
            "Gratitude": "Appreciation for the positive aspects of life.",
            "Purpose": "Sense of meaning and direction in life.",
            "Happiness": "Overall subjective well-being and life satisfaction."
        }
    }
};

export default function DynamicStatsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { characterSheet } = useCharacter();

    // Get category from URL params
    const rawCategory = typeof params.category === 'string' ? params.category : 'physical';

    // Validate and set the category
    const isCategoryValid = (cat: string): cat is CategoryType => {
        return cat === 'physical' || cat === 'mind' || cat === 'social';
    };

    const category: CategoryType = isCategoryValid(rawCategory) ? rawCategory : 'physical';

    // Get the config for this category
    const config = categoryConfigs[category];

    const [stats, setStats] = useState<{ name: string; value: number }[]>([]);
    const [totalScore, setTotalScore] = useState(0);

    useEffect(() => {
        if (characterSheet[category]) {
            setStats(characterSheet[category].stats);
            setTotalScore(characterSheet[category].score);
        }
    }, [characterSheet, category]);

    const handleBackPress = () => {
        router.navigate("/");
    };

    const handleAddActivity = () => {
        // Navigate to activity log with the current category
        const currentPath = `/stats/${category}`;
        router.push({
            pathname: "/activities/activity-log",
            params: {
                category: category,
                from: currentPath
            }
        });
    };

    // Get description for the attribute
    const getAttributeDescription = (statName: string) => {
        return config.descriptions[statName] ||
            "Improve this attribute through consistent practice and dedication.";
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />

                <LinearGradient
                    colors={config.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                >
                    <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>


                    <View style={styles.headerContent}>
                        <View style={styles.headerTitle}>
                            <Text style={styles.emoji}>{config.emoji}</Text>
                            <Text style={styles.title}>{config.title}</Text>
                        </View>
                        <Text style={styles.subtitle}>{config.subtitle}</Text>

                        <View style={styles.scoreContainer}>
                            <Text style={styles.scoreLabel}>Total Score</Text>
                            <Text style={styles.scoreValue}>{totalScore}</Text>
                        </View>
                    </View>
                </LinearGradient>


                <View style={styles.statsContainer}>

                    <Text style={styles.sectionTitle}>Attributes</Text>

                    <ScrollView style={styles.statsList}>
                        {stats.map((stat, index) => (
                            <View key={index} style={styles.statCard}>
                                <View style={styles.statHeader}>
                                    <Text style={styles.statName}>{stat.name}</Text>
                                    <View style={styles.statValueContainer}>
                                        <Text style={styles.statValue}>+{stat.value}</Text>
                                    </View>
                                </View>

                                <Text style={styles.statDescription}>
                                    {getAttributeDescription(stat.name)}
                                </Text>

                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            { width: `${Math.min(100, (stat.value * 10) + 5)}%` }
                                        ]}
                                    />
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <TouchableOpacity style={styles.addButton} onPress={handleAddActivity}>
                        <Text style={styles.addButtonText}>Log Activity</Text>
                    </TouchableOpacity>

                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colorBackground,
    },
    headerGradient: {
        paddingTop: 50, // For status bar
        paddingBottom: 30,
        paddingHorizontal: theme.spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...theme.shadow.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    headerContent: {
        marginBottom: theme.spacing.md,
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    emoji: {
        fontSize: 24,
        marginRight: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: theme.spacing.md,
    },
    scoreContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    scoreLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 4,
    },
    scoreValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
    },
    statsContainer: {
        flex: 1,
        padding: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.colorText,
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
    statsList: {
        flex: 1,
        marginBottom: theme.spacing.md,
    },
    statCard: {
        backgroundColor: theme.colorCard,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.shadow.sm,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    statName: {
        fontSize: 18,
        fontWeight: '500',
        color: theme.colorText,
    },
    statDescription: {
        fontSize: 14,
        color: theme.colorTextSecondary,
        marginBottom: theme.spacing.sm,
        lineHeight: 20,
    },
    statValueContainer: {
        backgroundColor: theme.colorPrimaryLight,
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colorPrimaryDark,
    },
    progressBar: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 3,
        overflow: 'hidden',
        marginTop: theme.spacing.xs,
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colorPrimary,
    },
    addButton: {
        backgroundColor: theme.colorPrimary,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
        ...theme.shadow.sm,
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});