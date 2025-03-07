import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { theme } from "../../theme";
import { useState, useEffect } from "react";
import { useCharacter } from "../context/CharacterContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Import the StatCategory type from your context
type Stat = {
    name: string;
    value: number;
};

type StatCategory = {
    id: string;
    name: string;
    description: string;
    score: number;
    icon: string;
    gradient: [string, string];
    stats: Stat[];
};

export default function DynamicStatsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { characterSheet, isLoading } = useCharacter();

    // Get category ID from URL params
    const categoryId = typeof params.category === 'string' ? params.category : 'physical';

    // Get all category details from context
    const [category, setCategory] = useState<StatCategory | null>(null);
    const [stats, setStats] = useState<Stat[]>([]);
    const [totalScore, setTotalScore] = useState(0);

    useEffect(() => {
        if (!isLoading && characterSheet.categories) {
            // Find the category that matches the ID from params
            const categoryData = characterSheet.categories[categoryId];

            if (categoryData) {
                setCategory(categoryData);
                setStats(categoryData.stats);
                setTotalScore(categoryData.score);
            } else {
                // If category doesn't exist, redirect to home or default category
                console.warn(`Category ${categoryId} not found`);
                router.replace("/");
            }
        }
    }, [characterSheet, categoryId, isLoading]);

    const handleBackPress = () => {
        router.navigate("/");
    };

    const handleAddActivity = () => {
        // Navigate to activity log with the current category
        const currentPath = `/stats/${categoryId}`;
        router.push({
            pathname: "/activities/activity-log",
            params: {
                category: categoryId,
                from: currentPath
            }
        });
    };

    // Show loading or empty state if category data isn't available yet
    if (!category) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <Text style={styles.loadingText}>Loading category data...</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />

                <LinearGradient
                    colors={category.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                >
                    <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <View style={styles.leftContent}>
                            <View style={styles.headerTitle}>
                                <Text style={styles.emoji}>{category.icon}</Text>
                                <Text style={styles.title}>{category.name}</Text>
                                <TouchableOpacity
                                    style={styles.headerEditButton}
                                    onPress={() => router.push({
                                        pathname: '/category-manager',
                                        params: { categoryId: categoryId }
                                    })}
                                >
                                    <MaterialCommunityIcons name="pencil" size={18} color="white" />
                                </TouchableOpacity>
                            </View>
                            <Text
                                style={styles.subtitle}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {category.description}
                            </Text>
                        </View>


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
                                    Improve this attribute through consistent practice and dedication.
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

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.addButton} onPress={handleAddActivity}>
                            <Text style={styles.addButtonText}>Log Activity</Text>
                        </TouchableOpacity>


                    </View>
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
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: theme.colorTextSecondary,
    },
    headerGradient: {
        paddingTop: 30, // For status bar
        paddingBottom: 30,
        paddingHorizontal: theme.spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...theme.shadow.md,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    leftContent: {
        flex: 1,
        marginRight: theme.spacing.lg,
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    headerEditButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        // marginRight: theme.spacing.md,
        marginLeft: theme.spacing.sm,
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
        width: '100%',
    },
    scoreContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
        minWidth: 100,
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
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
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
    buttonContainer: {
        // flexDirection: "row",
        // justifyContent: "space-between",
        marginTop: theme.spacing.md,
    },
    addButton: {
        backgroundColor: theme.colorPrimary,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
        ...theme.shadow.sm,
        marginBottom: theme.spacing.md,
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    editCategoryButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colorPrimaryLight,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.shadow.sm,
    },
    editCategoryButtonText: {
        color: theme.colorPrimaryDark,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: theme.spacing.xs,
    },
});