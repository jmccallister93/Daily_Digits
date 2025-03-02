// layout.tsx
import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";
import { CharacterProvider } from "./context/CharacterContext";
import { View } from "react-native";

export default function Layout() {
    return (
        <CharacterProvider>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: theme.colorPrimary,
                    tabBarInactiveTintColor: theme.colorTextLight,
                    tabBarStyle: {
                        backgroundColor: theme.colorCard,
                        borderTopColor: theme.colorBorder,
                        elevation: 8,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: -3 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        height: 60,
                        paddingBottom: 6,
                        paddingTop: 6,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '500',
                    },
                    headerShown: false,
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "Character",
                        tabBarIcon: ({ color, size }) => (
                            <MaterialCommunityIcons name="account" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="activity-history"
                    options={{
                        title: "Activity Log",
                        tabBarIcon: ({ color, size }) => (
                            <MaterialCommunityIcons name="notebook" size={size} color={color} />
                        ),
                    }}
                />
                {/* Stats screens - Individual routes */}
                <Tabs.Screen
                    name="stats/physical-stats"
                    options={{

                        tabBarButton: () => null,
                        headerShown: false
                    }}
                />
                <Tabs.Screen
                    name="mind-stats"
                    options={{

                        tabBarButton: () => null,
                        headerShown: false
                    }}
                />
                <Tabs.Screen
                    name="spiritual-stats"
                    options={{

                        tabBarButton: () => null,
                        headerShown: false
                    }}
                />

                {/* Activity log screen */}
                <Tabs.Screen
                    name="activity-log"
                    options={{

                        tabBarButton: () => null,
                        headerShown: false
                    }}
                />
                <Tabs.Screen
                    name="stats"
                    options={{
                        tabBarButton: () => null,
                        headerShown: false
                    }}
                />
                <Tabs.Screen
                    name="activities"
                    options={{
                        tabBarButton: () => null,
                        headerShown: false
                    }}
                />
            </Tabs>
        </CharacterProvider>
    );
}