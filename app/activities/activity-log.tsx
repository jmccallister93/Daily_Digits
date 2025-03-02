// app/(activities)/activity-log.tsx
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import { theme } from "../../theme";
import { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import { useCharacter } from "../context/CharacterContext"; // FIXED: Corrected import path
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function ActivityLogScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    // Extract category from URL query parameters
    const category = typeof params.category === 'string' ? params.category : undefined;

    // Add a default fallback if category is undefined
    const safeCategory = category || "physical";

    console.log("Raw params:", JSON.stringify(params));
    console.log("Category from params:", category);
    console.log("Using safe category:", safeCategory);
    const { characterSheet, logActivity } = useCharacter();

    const [activity, setActivity] = useState("");
    const [selectedStat, setSelectedStat] = useState("");
    const [points, setPoints] = useState("1");
    const [errors, setErrors] = useState({ activity: "", stat: "", points: "" });
    const [availableStats, setAvailableStats] = useState<string[]>([]);

    console.log("Current category:", category);
    console.log("Character sheet:", characterSheet);

    // Set up available stats based on category
    useEffect(() => {
        try {
            // Always use the safeCategory to prevent undefined issues
            const stats = characterSheet[safeCategory].stats.map((stat: any) => stat.name);
            console.log(`Stats for ${safeCategory}:`, stats);
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

    const handleCancel = () => {
        router.back();
    };

    const validateForm = () => {
        let valid = true;
        const newErrors = { activity: "", stat: "", points: "" };

        if (!activity.trim()) {
            newErrors.activity = "Please describe your activity";
            valid = false;
        }

        if (!selectedStat) {
            newErrors.stat = "Please select a stat to improve";
            valid = false;
        }

        const pointsNum = parseInt(points);
        if (isNaN(pointsNum) || pointsNum < 1 || pointsNum > 5) {
            newErrors.points = "Points must be between 1 and 5";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleSave = () => {
        if (!validateForm()) return;

        logActivity(
            activity,
            safeCategory, // Use safeCategory instead of category
            selectedStat,
            parseInt(points)
        );

        // Navigate back
        router.back();
    };

    // Get examples of activities for the selected category
    const getActivityExamples = () => {
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
    };

    // Debug content to help diagnose the issue
    const debugInfo = () => {
        return (
            <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text>Raw category param: {category || "none"}</Text>
                <Text>Safe category: {safeCategory}</Text>
                <Text>Available Stats: {availableStats.length > 0 ? availableStats.join(", ") : "none"}</Text>
                <Text>Selected Stat: {selectedStat || "none"}</Text>
            </View>
        );
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
                        What did you do to improve your {safeCategory} attributes?
                    </Text>
                </LinearGradient>

                <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
                    {/* Debug information to help diagnose the issue */}
                    {debugInfo()}

                    <View style={styles.card}>
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
                            <Text style={styles.label}>Attribute Improved</Text>
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
                            <Text style={styles.label}>Points Earned (1-5)</Text>
                            <View style={styles.pointsContainer}>
                                <Text style={styles.pointsHint}>Less effort</Text>
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <TouchableOpacity
                                        key={value}
                                        style={[
                                            styles.pointButton,
                                            parseInt(points) === value && styles.activePointButton
                                        ]}
                                        onPress={() => setPoints(value.toString())}
                                    >
                                        <Text
                                            style={[
                                                styles.pointButtonText,
                                                parseInt(points) === value && styles.activePointButtonText
                                            ]}
                                        >
                                            {value}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <Text style={styles.pointsHint}>More effort</Text>
                            </View>
                            {errors.points ? <Text style={styles.errorText}>{errors.points}</Text> : null}
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
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
    },
    androidPicker: {
        height: 50,
        width: '100%',
        color: theme.colorText,
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
    activePointButton: {
        backgroundColor: theme.colorPrimary,
        borderColor: theme.colorPrimary,
    },
    pointButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colorTextSecondary,
    },
    activePointButtonText: {
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
    debugContainer: {
        backgroundColor: '#fff3cd',
        padding: 10,
        marginBottom: 15,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ffecb5',
    },
    debugTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
});