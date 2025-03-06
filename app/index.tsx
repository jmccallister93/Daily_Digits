// app/index.tsx
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { theme } from "../theme";
import { useRouter } from "expo-router";
import { useCharacter } from "./context/CharacterContext";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function App() {
  const { characterSheet } = useCharacter();
  const router = useRouter();

  const handleBoxPress = (category: "physical" | "mind" | "social") => {
    router.push(`/stats/${category}`);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'physical':
        return '💪';
      case 'mind':
        return '🧠';
      case 'social':
        return '✨';
      default:
        return '📊';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Digits</Text>
        <Text style={styles.subtitle}>Track your journey.</Text>
      </View>

      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleBoxPress("physical")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6'] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.emoji}>{getCategoryIcon('physical')}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Physical</Text>
              <Text style={styles.cardDescription}>Strength, dexterity, and endurance</Text>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={styles.score}>{characterSheet.physical.score}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => handleBoxPress("mind")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#3B82F6', '#06B6D4'] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.emoji}>{getCategoryIcon('mind')}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Mind</Text>
              <Text style={styles.cardDescription}>Intelligence, wisdom, and focus</Text>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={styles.score}>{characterSheet.mind.score}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => handleBoxPress("social")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#EC4899', '#8B5CF6'] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.emoji}>{getCategoryIcon('social')}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Social</Text>
              <Text style={styles.cardDescription}>Faith, willpower, and mindfulness</Text>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={styles.score}>{characterSheet.social.score}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
});