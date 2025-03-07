import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ScrollView, TextInput } from "react-native";
import { theme } from "../theme";
import { useCharacter } from "./context/CharacterContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState, useMemo, useEffect } from "react";

// Define the types for your data structures
interface Activity {
    id: string;
    date: string;
    activity: string;
    category: string;
    stat: string;
    points: number;
}

interface DayGrouping {
    date: string;
    activities: Activity[];
    totals: {
        [categoryId: string]: number;
    };
    totalPoints: number;
}

interface FilterState {
    category: string; // changed from enum to string
    stat: string;
    searchQuery: string;
}

export default function ActivityHistoryScreen(): JSX.Element {
    const { activityLog, characterSheet } = useCharacter();
    const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
    const [filters, setFilters] = useState<FilterState>({
        category: "all",
        stat: "all",
        searchQuery: "",
    });
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
    const [categoryMap, setCategoryMap] = useState<Record<string, { name: string, gradient: [string, string], icon: string }>>({});

    // Create a map of category IDs to their display information
    useEffect(() => {
        const categories = characterSheet.categories;
        const map: Record<string, { name: string, gradient: [string, string], icon: string }> = {};

        Object.entries(categories).forEach(([id, category]) => {
            map[id] = {
                name: category.name,
                gradient: category.gradient,
                icon: category.icon
            };
        });

        setCategoryMap(map);
    }, [characterSheet]);

    // Get all available categories for filters
    const availableCategories = useMemo(() => {
        return Object.keys(characterSheet.categories);
    }, [characterSheet]);

    // Highlight search terms in text
    const highlightSearchTerms = (text: string, query: string): JSX.Element => {
        if (!query.trim()) return <Text>{text}</Text>;

        const parts = text.split(new RegExp(`(${query.trim()})`, 'gi'));

        return (
            <>
                {parts.map((part, index) => {
                    const matches = part.toLowerCase() === query.toLowerCase();
                    return (
                        <Text
                            key={index}
                            style={matches ? styles.highlightedText : undefined}
                        >
                            {part}
                        </Text>
                    );
                })}
            </>
        );
    };

    // Group activities by day
    const groupedActivities = useMemo((): DayGrouping[] => {
        if (activityLog.length === 0) return [];

        // Apply filters
        let filteredActivities = [...activityLog];
        if (filters.category !== "all") {
            filteredActivities = filteredActivities.filter(
                (activity: Activity) => activity.category === filters.category
            );
        }
        if (filters.stat !== "all") {
            filteredActivities = filteredActivities.filter(
                (activity: Activity) => activity.stat === filters.stat
            );
        }
        // Apply search query
        if (filters.searchQuery.trim() !== "") {
            const searchTerms = filters.searchQuery.toLowerCase().trim().split(/\s+/);
            filteredActivities = filteredActivities.filter((activity: Activity) => {
                const activityText = activity.activity.toLowerCase();
                const statText = activity.stat.toLowerCase();
                const categoryId = activity.category;

                // Get category name if available
                const categoryName = categoryMap[categoryId]?.name?.toLowerCase() || '';

                // Check if any search term is found in activity description, stat name, or category
                return searchTerms.some(term =>
                    activityText.includes(term) ||
                    statText.includes(term) ||
                    categoryName.includes(term)
                );
            });
        }

        // Group by date
        const groups: { [key: string]: Activity[] } = filteredActivities.reduce((acc: { [key: string]: Activity[] }, activity: Activity) => {
            const dateString = new Date(activity.date).toLocaleDateString("en-US");
            if (!acc[dateString]) {
                acc[dateString] = [];
            }
            acc[dateString].push(activity);
            return acc;
        }, {});

        // Calculate totals and format for FlatList
        const result: DayGrouping[] = Object.keys(groups).map((dateString: string) => {
            const dayActivities = groups[dateString];
            const totals: Record<string, number> = {};

            // Initialize totals for all categories
            availableCategories.forEach(categoryId => {
                totals[categoryId] = 0;
            });

            // Calculate totals for each category
            dayActivities.forEach((activity: Activity) => {
                const categoryId = activity.category;
                if (totals[categoryId] !== undefined) {
                    totals[categoryId] += activity.points;
                } else {
                    // If this is a category we haven't seen before, initialize it
                    totals[categoryId] = activity.points;
                }
            });

            return {
                date: dateString,
                activities: dayActivities,
                totals,
                totalPoints: dayActivities.reduce((sum: number, act: Activity) => sum + act.points, 0),
            };
        });

        // Sort by date
        return result.sort((a: DayGrouping, b: DayGrouping) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sortOrder === "newest"
                ? dateB.getTime() - dateA.getTime()
                : dateA.getTime() - dateB.getTime();
        });
    }, [activityLog, filters, sortOrder, categoryMap, availableCategories]);

    // Toggle expansion of a day card
    const toggleDayExpansion = (date: string): void => {
        setExpandedDays((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(date)) {
                newSet.delete(date);
            } else {
                newSet.add(date);
            }
            return newSet;
        });
    };

    // Format date for display
    // Fixed formatDate function
    const formatDate = (dateString: string): string => {
        // First check if it's already in locale format
        if (dateString.includes('/')) {
            // It's already in locale format, parse carefully
            const [month, day, year] = dateString.split('/');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        } else {
            // It's in ISO format
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        }
    };

    // Get all unique stats for filter options
    const allStats = useMemo((): string[] => {
        const stats = new Set<string>();
        activityLog.forEach((activity: Activity) => {
            stats.add(activity.stat);
        });
        return Array.from(stats);
    }, [activityLog]);

    // Get category color from gradient
    const getCategoryColor = (categoryId: string): string => {
        const category = categoryMap[categoryId];
        if (category) {
            // Return the first color of the gradient
            return category.gradient[0];
        }
        return theme.colorPrimary; // Default color if category not found
    };

    // Get category icon
    const getCategoryIcon = (categoryId: string, size: number = 18): JSX.Element => {
        const category = categoryMap[categoryId];

        if (category) {
            return <Text style={{ fontSize: size }}>{category.icon}</Text>;
        }

        // Fallback icon if category not found
        return <MaterialCommunityIcons name="star" size={size} color="white" />;
    };

    // Get category name for display
    const getCategoryName = (categoryId: string): string => {
        return categoryMap[categoryId]?.name || 'Unknown';
    };

    // If no activities logged yet
    if (activityLog.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                    name="notebook-outline"
                    size={80}
                    color={theme.colorTextLight}
                />
                <Text style={styles.emptyTitle}>No Activities Yet</Text>
                <Text style={styles.emptySubtitle}>
                    Your logged activities will appear here. Start by adding an activity from the Character Sheet.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colorBackground} />

            <View style={styles.header}>
                <Text style={styles.title}>Activity Log</Text>
                <Text style={styles.subtitle}>Review your personal development journey</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={20} color={theme.colorTextLight} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search activities..."
                        placeholderTextColor={theme.colorTextLight}
                        value={filters.searchQuery}
                        onChangeText={(text: string) => setFilters({ ...filters, searchQuery: text })}
                    />
                    {filters.searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setFilters({ ...filters, searchQuery: "" })}
                        >
                            <MaterialCommunityIcons name="close-circle" size={20} color={theme.colorTextLight} />
                        </TouchableOpacity>
                    )}
                </View>
                {groupedActivities.length === 0 && filters.searchQuery.length > 0 && (
                    <View style={styles.searchResultsInfo}>
                        <Text style={styles.searchNoResults}>
                            No activities match your search "{filters.searchQuery}"
                        </Text>
                    </View>
                )}
            </View>

            {/* Filter and Sort Controls */}
            <View style={styles.filterContainer}>
                <View style={styles.filterRow}>
                    <Text style={styles.filterLabel}>Category:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                filters.category === "all" && styles.filterChipActive,
                            ]}
                            onPress={() => setFilters({ ...filters, category: "all" })}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    filters.category === "all" && styles.filterChipTextActive,
                                ]}
                            >
                                All
                            </Text>
                        </TouchableOpacity>
                        {Object.entries(categoryMap).map(([id, category]) => (
                            <TouchableOpacity
                                key={id}
                                style={[
                                    styles.filterChip,
                                    filters.category === id && styles.filterChipActive,
                                    { backgroundColor: filters.category === id ? getCategoryColor(id) : "transparent" }
                                ]}
                                onPress={() => setFilters({ ...filters, category: id })}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        filters.category === id && styles.filterChipTextActive,
                                    ]}
                                >
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.filterRow}>
                    <Text style={styles.filterLabel}>Stat:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                filters.stat === "all" && styles.filterChipActive,
                            ]}
                            onPress={() => setFilters({ ...filters, stat: "all" })}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    filters.stat === "all" && styles.filterChipTextActive,
                                ]}
                            >
                                All
                            </Text>
                        </TouchableOpacity>
                        {allStats.map((stat: string) => (
                            <TouchableOpacity
                                key={stat}
                                style={[
                                    styles.filterChip,
                                    filters.stat === stat && styles.filterChipActive,
                                ]}
                                onPress={() => setFilters({ ...filters, stat: stat })}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        filters.stat === stat && styles.filterChipTextActive,
                                    ]}
                                >
                                    {stat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.filterRow}>
                    <Text style={styles.filterLabel}>Sort:</Text>
                    <View style={styles.sortToggle}>
                        <TouchableOpacity
                            style={[
                                styles.sortButton,
                                sortOrder === "newest" && styles.sortButtonActive,
                            ]}
                            onPress={() => setSortOrder("newest")}
                        >
                            <Text
                                style={[
                                    styles.sortButtonText,
                                    sortOrder === "newest" && styles.sortButtonTextActive,
                                ]}
                            >
                                Newest
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.sortButton,
                                sortOrder === "oldest" && styles.sortButtonActive,
                            ]}
                            onPress={() => setSortOrder("oldest")}
                        >
                            <Text
                                style={[
                                    styles.sortButtonText,
                                    sortOrder === "oldest" && styles.sortButtonTextActive,
                                ]}
                            >
                                Oldest
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Search Results Stats */}
            {filters.searchQuery.trim() !== "" && groupedActivities.length > 0 && (
                <View style={styles.searchResultsInfo}>
                    <Text style={styles.searchResultsText}>
                        Found {groupedActivities.reduce((total, day) => total + day.activities.length, 0)} activities across {groupedActivities.length} days
                    </Text>
                </View>
            )}

            {/* Activity List Grouped by Day */}
            <FlatList
                data={groupedActivities}
                keyExtractor={(item: DayGrouping) => item.date}
                renderItem={({ item }: { item: DayGrouping }) => (
                    <View style={styles.dayCard}>
                        <TouchableOpacity
                            style={styles.dayHeader}
                            onPress={() => toggleDayExpansion(item.date)}
                        >
                            <View style={styles.dayHeaderLeft}>
                                <Text style={styles.dayDate}>{formatDate(item.date)}</Text>
                                <Text style={styles.dayTotal}>+{item.totalPoints} points</Text>
                            </View>

                            <View style={styles.dayStats}>
                                {Object.entries(item.totals).map(([categoryId, points]) => (
                                    points > 0 && (
                                        <View
                                            key={categoryId}
                                            style={[
                                                styles.dayStatBadge,
                                                { backgroundColor: getCategoryColor(categoryId) }
                                            ]}
                                        >
                                            {getCategoryIcon(categoryId, 14)}
                                            <Text style={styles.dayStatText}>+{points}</Text>
                                        </View>
                                    )
                                ))}
                                <MaterialCommunityIcons
                                    name={expandedDays.has(item.date) ? "chevron-up" : "chevron-down"}
                                    size={24}
                                    color={theme.colorTextLight}
                                />
                            </View>
                        </TouchableOpacity>

                        {expandedDays.has(item.date) && (
                            <View style={styles.dayActivitiesList}>
                                {item.activities.map((activity: Activity) => (
                                    <View key={activity.id} style={styles.activityCard}>
                                        <View style={styles.cardHeader}>
                                            <View
                                                style={[
                                                    styles.categoryBadge,
                                                    { backgroundColor: getCategoryColor(activity.category) },
                                                ]}
                                            >
                                                {getCategoryIcon(activity.category)}
                                                <Text style={styles.categoryText}>
                                                    {getCategoryName(activity.category)}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={styles.activityText}>
                                            {filters.searchQuery.trim() !== ""
                                                ? highlightSearchTerms(activity.activity, filters.searchQuery)
                                                : activity.activity
                                            }
                                        </Text>

                                        <View style={styles.statsRow}>
                                            <View style={styles.statBadge}>
                                                <Text style={styles.statName}>{activity.stat}</Text>
                                                <Text style={styles.statPoints}>
                                                    {activity.points > 0 ? '+' : ''}{activity.points}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colorBackground,
        padding: theme.spacing.lg,
    },
    header: {
        marginBottom: theme.spacing.md,
    },
    // Search styles
    searchContainer: {
        marginBottom: theme.spacing.md,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colorCard,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        ...theme.shadow.sm,
    },
    searchInput: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        fontSize: 16,
        color: theme.colorText,
        paddingVertical: 8,
    },
    searchResultsInfo: {
        marginTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
    },
    searchResultsText: {
        fontSize: 14,
        color: theme.colorPrimary,
        fontWeight: '500',
    },
    searchNoResults: {
        fontSize: 14,
        color: theme.colorTextSecondary,
        fontStyle: 'italic',
    },
    highlightedText: {
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        fontWeight: '600',
        color: theme.colorPrimaryDark,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colorText,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colorTextSecondary,
    },
    // Filter styles
    filterContainer: {
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colorCard,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        ...theme.shadow.sm,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    filterLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.colorText,
        width: 70,
    },
    filterScrollView: {
        flexGrow: 1,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colorBorder,
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: theme.colorPrimary,
        borderColor: theme.colorPrimary,
    },
    filterChipText: {
        fontSize: 14,
        color: theme.colorText,
    },
    filterChipTextActive: {
        color: 'white',
    },
    sortToggle: {
        flexDirection: 'row',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colorBorder,
        overflow: 'hidden',
    },
    sortButton: {
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    sortButtonActive: {
        backgroundColor: theme.colorPrimary,
    },
    sortButtonText: {
        fontSize: 14,
        color: theme.colorText,
    },
    sortButtonTextActive: {
        color: 'white',
    },
    // Day card styles
    dayCard: {
        backgroundColor: theme.colorCard,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.md,
        overflow: 'hidden',
        ...theme.shadow.md,
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    dayHeaderLeft: {
        flex: 1,
    },
    dayDate: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colorText,
    },
    dayTotal: {
        fontSize: 14,
        color: theme.colorTextSecondary,
        marginTop: 2,
    },
    dayStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dayStatBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 6,
    },
    dayStatText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 2,
    },
    // Activity card styles
    dayActivitiesList: {
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colorBorder,
    },
    activityCard: {
        backgroundColor: theme.colorBackground,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        ...theme.shadow.sm,
    },
    listContent: {
        paddingBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    categoryText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
    },
    activityText: {
        fontSize: 16,
        color: theme.colorText,
        marginBottom: theme.spacing.md,
        lineHeight: 22,
    },
    statsRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: theme.colorBorder,
        paddingTop: theme.spacing.sm,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statName: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.colorPrimary,
        marginRight: 4,
    },
    statPoints: {
        fontSize: 15,
        fontWeight: 'bold',
        color: theme.colorPrimaryDark,
    },
    emptyContainer: {
        flex: 1,
        backgroundColor: theme.colorBackground,
        padding: theme.spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colorText,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    emptySubtitle: {
        fontSize: 16,
        color: theme.colorTextSecondary,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: '80%',
    },
});