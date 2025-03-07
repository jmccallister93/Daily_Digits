// app/index.tsx
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Image } from "react-native";
import { theme } from "../theme";
import { useRouter } from "expo-router";
import { StatCategory, useCharacter } from "./context/CharacterContext";
import { LinearGradient } from "expo-linear-gradient";
import SplashScreen from "./components/SplashScreen";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function App() {
  const { characterSheet, isLoading } = useCharacter();
  const router = useRouter();

  const handleBoxPress = (categoryId: string) => {
    router.push(`/stats/${categoryId}`);
  };

  const navigateToCategoryManager = () => {
    router.push("/category-manager");
  };

  // Get all categories from the context
  const categories = Object.values(characterSheet.categories);
  const hasCategories = categories.length > 0;

  // Render a category card
  const renderCategoryCard = (category: StatCategory) => (
    <TouchableOpacity
      key={category.id}
      style={styles.card}
      onPress={() => handleBoxPress(category.id)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={category.gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.emoji}>{category.icon}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{category.name}</Text>
          <Text style={styles.cardDescription}>{category.description}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>{category.score}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  // Show splash screen while data is loading
  if (isLoading) {
    return <SplashScreen message="Preparing your journey..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Digits</Text>
        <Text style={styles.subtitle}>Track your journey.</Text>
      </View>

      {hasCategories ? (
        <View style={styles.cardsContainer}>
          <FlatList
            data={categories}
            renderItem={({ item }) => renderCategoryCard(item)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.flatListContent}
          />
        </View>
      ) : (
        <View style={styles.emptyStateContainer}>
          <MaterialCommunityIcons
            name="notebook-outline"
            size={80}
            color={theme.colorTextSecondary}
            style={styles.emptyStateIcon}
          />
          <Text style={styles.emptyStateTitle}>No Categories Yet</Text>
          <Text style={styles.emptyStateText}>
            Create your first category to start tracking your skills and progress
          </Text>

          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={navigateToCategoryManager}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.getStartedGradient}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <MaterialCommunityIcons name="arrow-right" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colorBackground,
    flex: 1,
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colorText,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colorTextSecondary,
  },
  cardsContainer: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: theme.spacing.lg,
  },
  card: {
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadow.lg,
    height: 130,
    overflow: 'hidden',
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    height: '100%',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  emoji: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scoreContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  // Empty state styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyStateIcon: {
    marginBottom: theme.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colorText,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colorTextSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  getStartedButton: {
    width: '100%',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadow.md,
    marginTop: theme.spacing.lg,
  },
  getStartedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  getStartedText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: theme.spacing.sm,
  },
});