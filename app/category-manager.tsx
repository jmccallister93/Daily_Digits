// app/category-manager.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../theme';
import { useCharacter } from './context/CharacterContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Define color presets for gradients
const COLOR_PRESETS: [string, string][] = [
    ['#6366F1', '#8B5CF6'], // Indigo to Purple
    ['#3B82F6', '#06B6D4'], // Blue to Cyan
    ['#EC4899', '#8B5CF6'], // Pink to Purple
    ['#10B981', '#3B82F6'], // Emerald to Blue
    ['#F59E0B', '#EF4444'], // Amber to Red
    ['#14B8A6', '#06B6D4'], // Teal to Cyan
    ['#F97316', '#F59E0B'], // Orange to Amber
    ['#6366F1', '#EC4899'], // Indigo to Pink
];

// Available emoji icons
const ICON_OPTIONS = [
    '💪', '🧠', '✨', '🏃', '🧘', '🎯', '📚', '🎨', '🎵', '💰',
    '🏠', '🌱', '🌍', '❤️', '👨‍👩‍👧‍👦', '🙏', '🔧', '⚽', '🎮', '🎭'
];

// Interface for our category
interface StatCategory {
    id: string;
    name: string;
    description: string;
    score: number;
    icon: string;
    gradient: [string, string];
}

export default function CategoryManager() {
    const { characterSheet, updateCategory, addCategory, deleteCategory } = useCharacter();
    const router = useRouter();

    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<string | null>(null);

    const [categoryName, setCategoryName] = useState('');
    const [categoryDescription, setCategoryDescription] = useState('');
    const [categoryIcon, setCategoryIcon] = useState('🎯');
    const [categoryGradient, setCategoryGradient] = useState<[string, string]>(['#6366F1', '#8B5CF6']);
    const [initialScore, setInitialScore] = useState('10');

    // Function to reset form state
    const resetForm = () => {
        setCategoryName('');
        setCategoryDescription('');
        setCategoryIcon('🎯');
        setCategoryGradient(['#6366F1', '#8B5CF6']);
        setInitialScore('10');
        setEditingCategory(null);
    };

    // Open modal to create a new category
    const handleAddCategory = () => {
        resetForm();
        setModalVisible(true);
    };

    // Open modal to edit an existing category
    const handleEditCategory = (categoryId: string) => {
        const category = characterSheet.categories[categoryId];
        if (!category) return;

        setCategoryName(category.name);
        setCategoryDescription(category.description);
        setCategoryIcon(category.icon);
        setCategoryGradient(category.gradient);
        setInitialScore(category.score.toString());
        setEditingCategory(categoryId);
        setModalVisible(true);
    };

    // Save a category (new or existing)
    const handleSaveCategory = () => {
        if (!categoryName.trim()) {
            Alert.alert('Error', 'Please enter a category name');
            return;
        }

        const scoreNum = parseInt(initialScore, 10) || 10;

        if (editingCategory) {
            // Update existing category
            updateCategory(editingCategory, {
                name: categoryName,
                description: categoryDescription,
                icon: categoryIcon,
                gradient: categoryGradient,
                score: scoreNum
            });
        } else {
            // Create new category
            addCategory({
                name: categoryName,
                description: categoryDescription,
                icon: categoryIcon,
                gradient: categoryGradient,
                score: scoreNum,
                stats: [] // Use stats instead of subStats to match the type definition
            });
        }

        setModalVisible(false);
        resetForm();
    };

    // Handle deleting a category
    const handleDeleteCategory = (categoryId: string) => {
        // Don't allow deletion of default categories
        if (['physical', 'mind', 'social'].includes(categoryId)) {
            Alert.alert(
                'Cannot Delete',
                'Default categories cannot be deleted, but you can customize them.'
            );
            return;
        }

        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this category? All associated activities will remain in your history.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteCategory(categoryId)
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Categories</Text>
                <Text style={styles.subtitle}>Customize or add categories to track your progress</Text>
            </View>

            <ScrollView style={styles.categoriesList}>
                {characterSheet && characterSheet.categories && Object.keys(characterSheet.categories).length > 0 ?
                    Object.values(characterSheet.categories).map((category) => (
                        <View key={category.id} style={styles.categoryCard}>
                            <LinearGradient
                                colors={category.gradient as [string, string]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cardHeader}
                            >
                                <View style={styles.iconContainer}>
                                    <Text style={styles.icon}>{category.icon}</Text>
                                </View>
                                <Text style={styles.categoryName}>{category.name}</Text>
                                <Text style={styles.categoryScore}>{category.score}</Text>
                            </LinearGradient>

                            <View style={styles.cardBody}>
                                <Text style={styles.categoryDescription}>{category.description}</Text>

                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={styles.editButton}
                                        onPress={() => handleEditCategory(category.id)}
                                    >
                                        <MaterialCommunityIcons name="pencil" size={18} color={theme.colorPrimary} />
                                        <Text style={styles.editButtonText}>Edit</Text>
                                    </TouchableOpacity>

                                    {!['physical', 'mind', 'social'].includes(category.id) && (
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteCategory(category.id)}
                                        >
                                            <MaterialCommunityIcons name="delete" size={18} color={theme.colorDanger} />
                                            <Text style={styles.deleteButtonText}>Delete</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    ))
                    :
                    // Show loading or create fallback categories from physical, mind, social
                    [
                        characterSheet.physical,
                        characterSheet.mind,
                        characterSheet.social
                    ].filter(Boolean).map((category) => (
                        <View key={category.id} style={styles.categoryCard}>
                            <LinearGradient
                                colors={category.gradient as [string, string]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cardHeader}
                            >
                                <View style={styles.iconContainer}>
                                    <Text style={styles.icon}>{category.icon}</Text>
                                </View>
                                <Text style={styles.categoryName}>{category.name}</Text>
                                <Text style={styles.categoryScore}>{category.score}</Text>
                            </LinearGradient>

                            <View style={styles.cardBody}>
                                <Text style={styles.categoryDescription}>{category.description}</Text>

                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={styles.editButton}
                                        onPress={() => handleEditCategory(category.id)}
                                    >
                                        <MaterialCommunityIcons name="pencil" size={18} color={theme.colorPrimary} />
                                        <Text style={styles.editButtonText}>Edit</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                }
            </ScrollView>

            <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddCategory}
            >
                <MaterialCommunityIcons name="plus" size={24} color="white" />
                <Text style={styles.addButtonText}>Add New Category</Text>
            </TouchableOpacity>

            {/* Category Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingCategory ? 'Edit Category' : 'New Category'}
                            </Text>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <MaterialCommunityIcons name="close" size={24} color={theme.colorTextSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.inputLabel}>Name</Text>
                            <TextInput
                                style={styles.textInput}
                                value={categoryName}
                                onChangeText={setCategoryName}
                                placeholder="e.g., Creative, Financial"
                            />

                            <Text style={styles.inputLabel}>Description</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={categoryDescription}
                                onChangeText={setCategoryDescription}
                                placeholder="What this category represents..."
                                multiline
                                numberOfLines={3}
                            />

                            <Text style={styles.inputLabel}>Starting Score</Text>
                            <TextInput
                                style={styles.textInput}
                                value={initialScore}
                                onChangeText={setInitialScore}
                                keyboardType="number-pad"
                                placeholder="10"
                            />

                            <Text style={styles.inputLabel}>Icon</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconsContainer}>
                                {ICON_OPTIONS.map((icon, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.iconOption,
                                            categoryIcon === icon && styles.selectedIconOption
                                        ]}
                                        onPress={() => setCategoryIcon(icon)}
                                    >
                                        <Text style={styles.iconText}>{icon}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.inputLabel}>Colors</Text>
                            <View style={styles.colorsContainer}>
                                {COLOR_PRESETS.map((colors, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.colorOption,
                                            categoryGradient[0] === colors[0] && categoryGradient[1] === colors[1] && styles.selectedColorOption
                                        ]}
                                        onPress={() => setCategoryGradient(colors)}
                                    >
                                        <LinearGradient
                                            colors={colors}
                                            style={styles.colorPreview}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.previewSection}>
                                <Text style={styles.previewLabel}>Preview:</Text>
                                <LinearGradient
                                    colors={categoryGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.previewCard}
                                >
                                    <View style={styles.previewIconContainer}>
                                        <Text style={styles.previewIcon}>{categoryIcon}</Text>
                                    </View>
                                    <View style={styles.previewContent}>
                                        <Text style={styles.previewTitle}>
                                            {categoryName || 'Category Name'}
                                        </Text>
                                        <Text style={styles.previewDescription}>
                                            {categoryDescription || 'Category description goes here'}
                                        </Text>
                                    </View>
                                    <View style={styles.previewScoreContainer}>
                                        <Text style={styles.previewScore}>{initialScore || '10'}</Text>
                                    </View>
                                </LinearGradient>
                            </View>

                            {editingCategory && ['physical', 'mind', 'social'].includes(editingCategory) && (
                                <View style={styles.defaultCategoryNote}>
                                    <MaterialCommunityIcons name="information" size={20} color={theme.colorWarning} />
                                    <Text style={styles.defaultCategoryNoteText}>
                                        This is a default category and cannot be deleted.
                                    </Text>
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSaveCategory}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    categoriesList: {
        flex: 1,
    },
    categoryCard: {
        backgroundColor: theme.colorCard,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.lg,
        overflow: 'hidden',
        ...theme.shadow.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    icon: {
        fontSize: 20,
    },
    categoryName: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    categoryScore: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        width: 40,
        height: 40,
        borderRadius: 20,
        textAlign: 'center',
        textAlignVertical: 'center',
        lineHeight: 40,
    },
    cardBody: {
        padding: theme.spacing.md,
    },
    categoryDescription: {
        fontSize: 14,
        color: theme.colorText,
        marginBottom: theme.spacing.md,
    },
    actionButtons: {
        flexDirection: 'row',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        marginRight: theme.spacing.sm,
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colorPrimary,
        marginLeft: 4,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    deleteButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colorDanger,
        marginLeft: 4,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colorPrimary,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginTop: theme.spacing.md,
        ...theme.shadow.md,
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: theme.spacing.sm,
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        maxHeight: '90%',
        backgroundColor: theme.colorBackground,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadow.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colorBorder,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colorText,
    },
    modalCloseButton: {
        padding: 4,
    },
    modalForm: {
        padding: theme.spacing.lg,
        maxHeight: 500,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colorTextSecondary,
        marginBottom: theme.spacing.sm,
    },
    textInput: {
        backgroundColor: theme.colorCard,
        borderWidth: 1,
        borderColor: theme.colorBorder,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: 16,
        color: theme.colorText,
        marginBottom: theme.spacing.lg,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    iconsContainer: {
        flexDirection: 'row',
        marginBottom: theme.spacing.lg,
    },
    iconOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        backgroundColor: theme.colorCard,
        borderWidth: 1,
        borderColor: theme.colorBorder,
    },
    selectedIconOption: {
        borderColor: theme.colorPrimary,
        borderWidth: 2,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    iconText: {
        fontSize: 20,
    },
    colorsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: theme.spacing.lg,
    },
    colorOption: {
        width: 60,
        height: 40,
        borderRadius: theme.borderRadius.md,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.colorBorder,
        overflow: 'hidden',
    },
    selectedColorOption: {
        borderColor: theme.colorPrimary,
        borderWidth: 2,
    },
    colorPreview: {
        width: '100%',
        height: '100%',
    },
    previewSection: {
        marginBottom: theme.spacing.lg,
    },
    previewLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colorTextSecondary,
        marginBottom: theme.spacing.sm,
    },
    previewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        height: 100,
    },
    previewIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    previewIcon: {
        fontSize: 20,
    },
    previewContent: {
        flex: 1,
    },
    previewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    previewDescription: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    previewScoreContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewScore: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    defaultCategoryNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.lg,
    },
    defaultCategoryNoteText: {
        flex: 1,
        fontSize: 14,
        color: theme.colorWarning,
        marginLeft: theme.spacing.sm,
    },
    modalFooter: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: theme.colorBorder,
        padding: theme.spacing.md,
    },
    cancelButton: {
        flex: 1,
        padding: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colorBorder,
        marginRight: theme.spacing.sm,
    },
    cancelButtonText: {
        color: theme.colorTextSecondary,
        fontSize: 16,
        fontWeight: '500',
    },
    saveButton: {
        flex: 2,
        padding: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colorPrimary,
        borderRadius: theme.borderRadius.md,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
});