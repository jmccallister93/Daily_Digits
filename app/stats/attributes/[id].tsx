// app/stats/attribute/[id].tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    FlatList
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { theme } from '../../../theme';
import { useCharacter } from '../../context/CharacterContext';
import { useDecayTimer } from '../../context/DecayTimerContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function AttributeDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { characterSheet, activityLog } = useCharacter();
    const { getDecaySettingForStat } = useDecayTimer();

    // Parse URL params
    const categoryId = typeof params.categoryId === 'string' ? params.categoryId : '';
    const statName = typeof params.statName === 'string' ? params.statName : '';

    // State for the component
    const [category, setCategory] = useState<any>(null);
    const [stat, setStat] = useState<any>(null);
    const [attributeLogs, setAttributeLogs] = useState<any[]>([]);
    const [decaySetting, setDecaySetting] = useState<any>(null);
    const [timeUntilDecay, setTimeUntilDecay] = useState<string>('');

    // Load data on component mount
    useEffect(() => {
        if (categoryId && statName && characterSheet.categories) {
            const categoryData = characterSheet.categories[categoryId];
            if (categoryData) {
                setCategory(categoryData);

                const statData = categoryData.stats.find((s: any) => s.name === statName);
                if (statData) {
                    setStat(statData);
                } else {
                    console.warn(`Stat ${statName} not found`);
                    router.back();
                }
            } else {
                console.warn(`Category ${categoryId} not found`);
                router.back();
            }

            // Get decay setting if it exists
            const decaySetting = getDecaySettingForStat(categoryId, statName);
            setDecaySetting(decaySetting);

            // Filter activity logs for this specific attribute
            const filteredLogs = activityLog.filter(log => {
                // Check if the log is for this category
                if (log.category !== categoryId) return false;

                // Check if the log affects this specific stat
                if (Array.isArray(log.stat)) {
                    return log.stat.includes(statName);
                } else {
                    return log.stat === statName;
                }
            });

            // Sort logs from newest to oldest
            filteredLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setAttributeLogs(filteredLogs);
        }
    }, [categoryId, statName, characterSheet, activityLog]);

    // Update countdown timer
    useEffect(() => {
        if (!decaySetting || !decaySetting.enabled) {
            setTimeUntilDecay('');
            return;
        }

        const calculateTimeRemaining = () => {
            const now = new Date();
            const lastUpdate = new Date(decaySetting.lastUpdate);

            // Add decay days to last update to get next decay time
            const nextDecay = new Date(lastUpdate);
            nextDecay.setDate(nextDecay.getDate() + decaySetting.days);

            // Calculate time difference
            const timeDiff = nextDecay.getTime() - now.getTime();

            if (timeDiff <= 0) {
                return 'Due now';
            }

            // Calculate days, hours, minutes
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                return `${days}d ${hours}h ${minutes}m remaining`;
            } else if (hours > 0) {
                return `${hours}h ${minutes}m remaining`;
            } else {
                return `${minutes}m remaining`;
            }
        };

        // Initial calculation
        setTimeUntilDecay(calculateTimeRemaining());

        // Update timer every minute
        const interval = setInterval(() => {
            setTimeUntilDecay(calculateTimeRemaining());
        }, 60000);

        return () => clearInterval(interval);
    }, [decaySetting]);

    const handleBackPress = () => {
        router.back();
    };

    const handleAddActivity = () => {
        // Navigate to activity log with pre-selected attribute
        router.push({
            pathname: "/activities/activity-log",
            params: {
                category: categoryId,
                from: `/stats/attribute/${categoryId}?categoryId=${categoryId}&statName=${statName}`,
                preSelectedStat: statName
            }
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!category || !stat) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading attribute data...</Text>
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
                        <View style={styles.headerLeft}>
                            <Text style={styles.categoryName}>{category.name}</Text>
                            <Text style={styles.attributeName}>{stat.name}</Text>
                        </View>

                        <View style={styles.scoreContainer}>
                            <Text style={styles.scoreLabel}>Value</Text>
                            <Text style={styles.scoreValue}>+{stat.value}</Text>
                        </View>
                    </View>

                    {decaySetting && decaySetting.enabled && (
                        <View style={styles.decayBanner}>
                            <MaterialIcons name="timer" size={18} color="white" />
                            <Text style={styles.decayBannerText}>
                                Decays by {decaySetting.points} point{decaySetting.points !== 1 ? 's' : ''} • {timeUntilDecay}
                            </Text>
                        </View>
                    )}
                </LinearGradient>

                <View style={styles.content}>
                    <View style={styles.progressSection}>
                        <View style={styles.progressLabelRow}>
                            <Text style={styles.progressLabel}>Progress</Text>
                            <Text style={styles.progressValue}>{stat.value} points</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${Math.min(100, (stat.value * 10) + 5)}%` }
                                ]}
                            />
                        </View>
                    </View>

                    <View style={styles.activitySection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Activity History</Text>
                            <TouchableOpacity
                                style={styles.addActivityButton}
                                onPress={handleAddActivity}
                            >
                                <MaterialIcons name="add" size={18} color={theme.colorPrimary} />
                                <Text style={styles.addActivityText}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        {attributeLogs.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialIcons name="history" size={48} color={theme.colorTextLight} />
                                <Text style={styles.emptyStateText}>No activities logged for this attribute yet</Text>
                                <TouchableOpacity
                                    style={styles.emptyStateButton}
                                    onPress={handleAddActivity}
                                >
                                    <Text style={styles.emptyStateButtonText}>Log Your First Activity</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <FlatList
                                data={attributeLogs}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <View style={styles.activityItem}>
                                        <View style={styles.activityHeader}>
                                            <Text style={styles.activityDate}>{formatDate(item.date)}</Text>
                                            <View style={[
                                                styles.pointsBadge,
                                                item.points > 0 ? styles.positivePoints : styles.negativePoints
                                            ]}>
                                                <Text style={styles.pointsText}>
                                                    {item.points > 0 ? '+' : ''}{item.points}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.activityDescription}>{item.activity}</Text>
                                    </View>
                                )}
                                ListFooterComponent={<View style={{ height: 80 }} />}
                            />
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.floatingButton}
                    onPress={handleAddActivity}
                >
                    <MaterialIcons name="add" size={24} color="white" />
                </TouchableOpacity>
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
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colorBackground,
    },
    loadingText: {
        fontSize: 16,
        color: theme.colorTextSecondary,
    },
    headerGradient: {
        paddingTop: 30, // For status bar
        paddingBottom: 16,
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flex: 1,
    },
    categoryName: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 4,
    },
    attributeName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
    },
    scoreContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
        minWidth: 80,
    },
    scoreLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 2,
    },
    scoreValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    decayBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: theme.borderRadius.md,
        marginTop: 12,
    },
    decayBannerText: {
        color: 'white',
        marginLeft: 8,
        fontSize: 14,
    },
    content: {
        flex: 1,
        padding: theme.spacing.lg,
    },
    progressSection: {
        marginBottom: theme.spacing.lg,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colorText,
    },
    progressValue: {
        fontSize: 14,
        color: theme.colorPrimary,
        fontWeight: '500',
    },
    progressBar: {
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colorPrimary,
    },
    activitySection: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colorText,
    },
    addActivityButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    addActivityText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colorPrimary,
        marginLeft: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    emptyStateText: {
        fontSize: 16,
        color: theme.colorTextSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    emptyStateButton: {
        backgroundColor: theme.colorPrimary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: theme.borderRadius.md,
    },
    emptyStateButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    activityItem: {
        backgroundColor: theme.colorCard,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.shadow.sm,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    activityDate: {
        fontSize: 12,
        color: theme.colorTextSecondary,
    },
    pointsBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    positivePoints: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    negativePoints: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    pointsText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colorPrimary,
    },
    activityDescription: {
        fontSize: 14,
        color: theme.colorText,
        lineHeight: 20,
    },
    floatingButton: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colorPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadow.lg,
    },
});