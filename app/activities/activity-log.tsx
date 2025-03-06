import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Switch } from "react-native";
import { theme } from "../../theme";
import { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import { useCharacter } from "../context/CharacterContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Define the valid category types for type safety
type CategoryType = "physical" | "mind" | "spiritual";

export default function ActivityLogScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Extract category from URL query parameters with type assertion
    const rawCategory = typeof params.category === 'string' ? params.category : undefined;

    // Validate that the category is one of our valid types
    const isValidCategory = (cat: string | undefined): cat is CategoryType => {
        return cat === "physical" || cat === "mind" || cat === "spiritual";
    };

    // Add a default fallback if category is undefined or invalid
    const safeCategory: CategoryType = isValidCategory(rawCategory) ? rawCategory : "physical";

    const { characterSheet, logActivity } = useCharacter();

    const [activity, setActivity] = useState("");
    const [selectedStat, setSelectedStat] = useState("");
    const [pointsValue, setPointsValue] = useState(1);
    const [isNegative, setIsNegative] = useState(false);
    const [errors, setErrors] = useState({ activity: "", stat: "", points: "" });
    const [availableStats, setAvailableStats] = useState<string[]>([]);

    // Set up available stats based on category
    useEffect(() => {
        try {
            const stats = characterSheet[safeCategory].stats.map(stat => stat.name);
            setAvailableStats(stats);

            // If stats are available, preselect the first one
            if (stats.length > 0) {
                setSelectedStat(stats[0]);
            }
        } catch (error) {
            console.error("Error setting up available stats:", error);
        }
    }, [safeCategory, characterSheet]);

    // Get category color for the header
    const getCategoryColor = (): [string, string] => {
        switch (safeCategory) {
            case 'physical':
                return ['#6366F1', '#8B5CF6']; // Purple gradient
            case 'mind':
                return ['#3B82F6', '#06B6D4']; // Blue gradient
            case 'spiritual':
                return ['#EC4899', '#8B5CF6']; // Pink gradient
            default:
                return ['#6366F1', '#8B5CF6'];
        }
    };

    // Get category title
    const getCategoryTitle = () => {
        switch (safeCategory) {
            case 'physical':
                return "Physical Activity";
            case 'mind':
                return "Mind Activity";
            case 'spiritual':
                return "Spiritual Activity";
            default:
                return "Log Activity";
        }
    };

    // const previousScreen = typeof params.from === 'string' ? params.from : '/activity-history';
    // const handleCancel = () => {
    //     router.push(previousScreen);
    // };

    const previousScreen = typeof params.from === 'string' ? params.from : undefined;

    const handleCancel = () => {
        if (previousScreen) {
            // Navigate directly to the previous screen
            console.log("Navigating back to:", previousScreen);
            router.push(previousScreen);
        } else {
            // Fallback to a default screen like activity history
            console.log("No previous screen, going to activity history");
            router.push("/activity-history");
        }
    };

    const validateForm = () => {
        let valid = true;
        const newErrors = { activity: "", stat: "", points: "" };

        if (!activity.trim()) {
            newErrors.activity = "Please describe your activity";
            valid = false;
        }

        if (!selectedStat) {
            newErrors.stat = "Please select a stat to modify";
            valid = false;
        }

        if (pointsValue < 1 || pointsValue > 5) {
            newErrors.points = "Points must be between 1 and 5";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleSave = () => {
        if (!validateForm()) return;

        // Apply negative sign if the negative toggle is on
        const finalPoints = isNegative ? -pointsValue : pointsValue;

        logActivity(
            activity,
            safeCategory,
            selectedStat,
            finalPoints
        );

        setActivity("")

        // Navigate back
        router.back();
    };

    // Get examples of activities for the selected category
    const getActivityExamples = () => {
        if (isNegative) {
            switch (safeCategory) {
                case 'physical':
                    return "E.g., 'Skipped workout', 'Ate unhealthy food'";
                case 'mind':
                    return "E.g., 'Procrastinated on task', 'Excessive social media'";
                case 'spiritual':
                    return "E.g., 'Lost my temper', 'Negative self-talk'";
                default:
                    return "Describe what happened...";
            }
        } else {
            switch (safeCategory) {
                case 'physical':
                    return "E.g., 'Went for a 5K run', 'Did 30 minutes of yoga'";
                case 'mind':
                    return "E.g., 'Read 30 pages of a book', 'Learned a new skill'";
                case 'spiritual':
                    return "E.g., 'Had a deep conversation', 'Practiced meditation'";
                default:
                    return "Describe what you did...";
            }
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                <LinearGradient
                    colors={getCategoryColor()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.title}>{getCategoryTitle()}</Text>
                    <Text style={styles.subtitle}>
                        {isNegative
                            ? `What negatively affected your ${safeCategory} attributes?`
                            : `What did you do to improve your ${safeCategory} attributes?`
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
                                placeholder={getActivityExamples()}
                                placeholderTextColor={theme.colorTextLight}
                                multiline
                                numberOfLines={3}
                            />
                            {errors.activity ? <Text style={styles.errorText}>{errors.activity}</Text> : null}
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>{isNegative ? "Attribute Affected" : "Attribute Improved"}</Text>
                            {Platform.OS === 'ios' ? (
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={selectedStat}
                                        onValueChange={(itemValue) => setSelectedStat(itemValue)}
                                        style={styles.picker}
                                    >
                                        {availableStats.map((stat) => (
                                            <Picker.Item key={stat} label={stat} value={stat} />
                                        ))}
                                    </Picker>
                                </View>
                            ) : (
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={selectedStat}
                                        onValueChange={(itemValue) => setSelectedStat(itemValue)}
                                        style={styles.androidPicker}
                                        dropdownIconColor={theme.colorPrimary}
                                    >
                                        {availableStats.length > 0 ? (
                                            availableStats.map((stat) => (
                                                <Picker.Item
                                                    key={stat}
                                                    label={stat}
                                                    value={stat}
                                                    style={{ color: theme.colorText }}
                                                />
                                            ))
                                        ) : (
                                            <Picker.Item label="Loading attributes..." value="" />
                                        )}
                                    </Picker>
                                </View>
                            )}
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
                            <Text style={styles.saveButtonText}>Save Activity</Text>
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
    pickerContainer: {
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colorBorder,
        overflow: 'hidden',
        backgroundColor: theme.colorBackground,
    },
    picker: {
        height: 50,
        width: '100%',
        backgroundColor: theme.colorBackground,
    },
    androidPicker: {
        height: 50,
        width: '100%',
        color: theme.colorText,
        backgroundColor: theme.colorBackground,
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
        marginRight: 10,
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
        marginLeft: 10,
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
    errorText: {
        color: theme.colorDanger,
        fontSize: 14,
        marginTop: 5,
    },
});