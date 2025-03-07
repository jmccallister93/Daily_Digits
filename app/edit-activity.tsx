// EditActivityScreen.tsx
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Switch } from "react-native";
import { theme } from "../theme";
import { useState, useEffect } from "react";
import { ActivityLog, useCharacter } from "./context/CharacterContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function EditActivityScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Get activityId from URL parameters
    const activityId = typeof params.id === 'string' ? params.id : undefined;

    const { characterSheet, activityLog, editActivity, deleteActivity } = useCharacter();

    const [activity, setActivity] = useState("");
    const [selectedStats, setSelectedStats] = useState<string[]>([]);
    const [pointsValue, setPointsValue] = useState(1);
    const [isNegative, setIsNegative] = useState(false);
    const [errors, setErrors] = useState({ activity: "", stat: "", points: "" });
    const [availableStats, setAvailableStats] = useState<string[]>([]);
    const [categoryName, setCategoryName] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [categoryGradient, setCategoryGradient] = useState<[string, string]>(['#6366F1', '#8B5CF6']);
    const [originalActivity, setOriginalActivity] = useState<any>(null);

    // Load the activity data
    useEffect(() => {
        if (!activityId) {
            console.error("No activity ID provided");
            router.back();
            return;
        }

        // Find the activity in the log
        const activityToEdit = activityLog.find(a => a.id === activityId);

        if (!activityToEdit) {
            console.error("Activity not found:", activityId);
            router.back();
            return;
        }

        setOriginalActivity(activityToEdit);
        setActivity(activityToEdit.activity);
        setCategoryId(activityToEdit.category);

        // Handle points - check if negative
        const points = activityToEdit.points;
        setIsNegative(points < 0);
        setPointsValue(Math.abs(points));

        // Handle stats (could be string or array)
        if (Array.isArray(activityToEdit.stat)) {
            setSelectedStats(activityToEdit.stat);
        } else {
            setSelectedStats([activityToEdit.stat]);
        }

        // Set up category info
        const category = characterSheet.categories[activityToEdit.category];
        if (category) {
            setCategoryName(category.name);
            setCategoryGradient(category.gradient);

            // Set up available stats for this category
            if (category.stats && category.stats.length > 0) {
                setAvailableStats(category.stats.map(stat => stat.name));
            } else {
                setAvailableStats([]);
            }
        }
    }, [activityId, activityLog, characterSheet]);

    // Toggle stat selection
    const toggleStatSelection = (stat: string) => {
        setSelectedStats(prev => {
            if (prev.includes(stat)) {
                // Remove the stat if already selected
                return prev.filter(item => item !== stat);
            } else {
                // Add the stat if not already selected
                return [...prev, stat];
            }
        });
    };

    const validateForm = () => {
        let valid = true;
        const newErrors = { activity: "", stat: "", points: "" };

        if (!activity.trim()) {
            newErrors.activity = "Please describe your activity";
            valid = false;
        }

        if (selectedStats.length === 0) {
            newErrors.stat = "Please select at least one stat to modify";
            valid = false;
        }

        if (pointsValue < 1 || pointsValue > 5) {
            newErrors.points = "Points must be between 1 and 5";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleCancel = () => {
        router.back();
    };

    const handleSave = () => {
        if (!validateForm() || !categoryId || !activityId) return;

        // Apply negative sign if the negative toggle is on
        const finalPoints = isNegative ? -pointsValue : pointsValue;

        // Create the updates object with the correct type for stat
        const updates: Partial<Omit<ActivityLog, 'stat'> & { stat?: string | string[] }> = {
            activity,
            points: finalPoints
        };

        // Add the stat field with the correct type
        updates.stat = selectedStats.length === 1 ? selectedStats[0] : selectedStats;

        // Update the activity
        editActivity(activityId, updates);

        // Navigate back
        router.back();
    };

    const handleDelete = () => {
        if (!activityId) return;

        // Delete the activity
        deleteActivity(activityId);

        // Navigate back
        router.back();
    };

    if (!originalActivity) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                <LinearGradient
                    colors={categoryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.title}>Edit {categoryName} Activity</Text>
                    <Text style={styles.subtitle}>
                        {isNegative
                            ? `What negatively affected your ${categoryName} attributes?`
                            : `What did you do to improve your ${categoryName} attributes?`
                        }
                    </Text>
                </LinearGradient>

                <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.card}>
                        {/* Toggle for positive/negative impact */}
                        <View style={styles.toggleContainer}>
                            <Text style={styles.toggleLabel}>
                                {isNegative ? "Negative Impact" : "Positive Impact"}
                            </Text>
                            <Switch
                                value={isNegative}
                                onValueChange={setIsNegative}
                                trackColor={{ false: theme.colorSuccess, true: theme.colorDanger }}
                                thumbColor="#fff"
                                ios_backgroundColor={theme.colorSuccess}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Activity Description</Text>
                            <TextInput
                                style={styles.input}
                                value={activity}
                                onChangeText={setActivity}
                                placeholder={`What did you do related to ${categoryName}?`}
                                placeholderTextColor={theme.colorTextLight}
                                multiline
                                numberOfLines={3}
                            />
                            {errors.activity ? <Text style={styles.errorText}>{errors.activity}</Text> : null}
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>{isNegative ? "Attributes Affected" : "Attributes Improved"}</Text>
                            <View style={styles.statsContainer}>
                                {availableStats.map((stat) => (
                                    <TouchableOpacity
                                        key={stat}
                                        style={[
                                            styles.statButton,
                                            selectedStats.includes(stat) && (
                                                isNegative ? styles.negativeStatButton : styles.positiveStatButton
                                            )
                                        ]}
                                        onPress={() => toggleStatSelection(stat)}
                                    >
                                        <Text
                                            style={[
                                                styles.statButtonText,
                                                selectedStats.includes(stat) && (
                                                    isNegative ? styles.negativeStatButtonText : styles.positiveStatButtonText
                                                )
                                            ]}
                                        >
                                            {stat}
                                        </Text>
                                        {selectedStats.includes(stat) && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={16}
                                                color="white"
                                                style={styles.checkIcon}
                                            />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {errors.stat ? <Text style={styles.errorText}>{errors.stat}</Text> : null}
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Impact Level (1-5)</Text>
                            <View style={styles.pointsContainer}>
                                <Text style={styles.pointsHint}>Slight</Text>
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <TouchableOpacity
                                        key={value}
                                        style={[
                                            styles.pointButton,
                                            pointsValue === value && (
                                                isNegative ? styles.negativePointButton : styles.positivePointButton
                                            )
                                        ]}
                                        onPress={() => setPointsValue(value)}
                                    >
                                        <Text
                                            style={[
                                                styles.pointButtonText,
                                                pointsValue === value && (
                                                    isNegative ? styles.negativePointButtonText : styles.positivePointButtonText
                                                )
                                            ]}
                                        >
                                            {value}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <Text style={styles.pointsHint}>Significant</Text>
                            </View>
                            {errors.points ? <Text style={styles.errorText}>{errors.points}</Text> : null}
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                            <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                isNegative && styles.negativeSaveButton
                            ]}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
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
    },
    header: {
        paddingTop: 50, // For status bar
        paddingBottom: 20,
        paddingHorizontal: theme.spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: theme.spacing.xs,
        color: 'white',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: theme.spacing.sm,
    },
    scrollContent: {
        flex: 1,
    },
    scrollContainer: {
        padding: theme.spacing.lg,
    },
    card: {
        backgroundColor: theme.colorCard,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        ...theme.shadow.md,
        marginBottom: theme.spacing.lg,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colorBorder,
    },
    toggleLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colorText,
    },
    formGroup: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: 16,
        marginBottom: theme.spacing.sm,
        fontWeight: '500',
        color: theme.colorText,
    },
    input: {
        backgroundColor: theme.colorBackground,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: 16,
        borderWidth: 1,
        borderColor: theme.colorBorder,
        textAlignVertical: 'top',
        color: theme.colorText,
        minHeight: 100,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: theme.spacing.xs,
    },
    statButton: {
        backgroundColor: theme.colorBackground,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colorBorder,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginRight: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
    },
    positiveStatButton: {
        backgroundColor: theme.colorPrimary,
        borderColor: theme.colorPrimary,
    },
    negativeStatButton: {
        backgroundColor: theme.colorDanger,
        borderColor: theme.colorDanger,
    },
    statButtonText: {
        fontSize: 14,
        color: theme.colorText,
    },
    positiveStatButtonText: {
        color: 'white',
    },
    negativeStatButtonText: {
        color: 'white',
    },
    checkIcon: {
        marginLeft: theme.spacing.xs,
    },
    pointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pointsHint: {
        fontSize: 12,
        color: theme.colorTextSecondary,
        marginHorizontal: 8,
    },
    pointButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colorBorder,
        backgroundColor: theme.colorBackground,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 4,
    },
    positivePointButton: {
        backgroundColor: theme.colorPrimary,
        borderColor: theme.colorPrimary,
    },
    negativePointButton: {
        backgroundColor: theme.colorDanger,
        borderColor: theme.colorDanger,
    },
    pointButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colorTextSecondary,
    },
    positivePointButtonText: {
        color: 'white',
    },
    negativePointButtonText: {
        color: 'white',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.xxl,
    },
    cancelButton: {
        backgroundColor: theme.colorBackground,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colorBorder,
    },
    cancelButtonText: {
        color: theme.colorTextSecondary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: theme.colorPrimary,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        flex: 1,
        marginLeft: 5,
        alignItems: 'center',
    },
    negativeSaveButton: {
        backgroundColor: theme.colorDanger,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: theme.colorBackground,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        flex: 1,
        marginRight: 5,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colorDanger,
    },
    deleteButtonText: {
        color: theme.colorDanger,
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: theme.colorDanger,
        fontSize: 14,
        marginTop: 5,
    },
});