// activity-history.tsx (continued)
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from "react-native";
import { theme } from "../theme";
import { useCharacter } from "./context/CharacterContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ActivityHistoryScreen() {
    const { activityLog } = useCharacter();

    // Helper function to format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Get category color
    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'physical':
                return theme.colorSuccess;
            case 'mind':
                return theme.colorPrimary;
            case 'spiritual':
                return theme.colorSecondary;
            default:
                return theme.colorAccent;
        }
    };

    // Get category icon
    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'physical':
                return <MaterialCommunityIcons name="arm-flex" size={18} color="white" />;
            case 'mind':
                return <MaterialCommunityIcons name="brain" size={18} color="white" />;
            case 'spiritual':
                return <MaterialCommunityIcons name="meditation" size={18} color="white" />;
            default:
                return <MaterialCommunityIcons name="star" size={18} color="white" />;
        }
    };

    // If no activities logged yet
    if (activityLog.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="notebook-outline" size={80} color={theme.colorTextLight} />
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

            <FlatList
                data={[...activityLog].reverse()} // Show newest first
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.activityCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
                                {getCategoryIcon(item.category)}
                                <Text style={styles.categoryText}>
                                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                                </Text>
                            </View>
                            <Text style={styles.date}>{formatDate(item.date)}</Text>
                        </View>

                        <Text style={styles.activityText}>{item.activity}</Text>

                        <View style={styles.statsRow}>
                            <View style={styles.statBadge}>
                                <Text style={styles.statName}>{item.stat}</Text>
                                <Text style={styles.statPoints}>+{item.points}</Text>
                            </View>
                        </View>
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
        marginBottom: theme.spacing.lg,
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
    listContent: {
        paddingBottom: 20,
    },
    activityCard: {
        backgroundColor: theme.colorCard,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...theme.shadow.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
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
    date: {
        fontSize: 14,
        color: theme.colorTextLight,
    },
    activityText: {
        fontSize: 16,
        color: theme.colorText,
        marginBottom: theme.spacing.lg,
        lineHeight: 22,
    },
    statsRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: theme.colorBorder,
        paddingTop: theme.spacing.md,
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