// layout.tsx
import { router, Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";
import { CharacterProvider } from "./context/CharacterContext";
import { View } from "react-native";
import { DecayTimerProvider } from "./context/DecayTimerContext";


export default function Layout() {

    return (
        <CharacterProvider>
            <DecayTimerProvider>
                <Tabs
                    screenOptions={{
                        tabBarActiveTintColor: theme.colorPrimary,
                        tabBarInactiveTintColor: theme.colorTextSecondary,
                        tabBarStyle: {
                            backgroundColor: theme.colorCard,
                            borderTopColor: theme.colorBorder,
                            elevation: 8,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: -3 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            height: 60,
                            paddingBottom: 6,
                            paddingTop: 6,
                            justifyContent: "space-evenly"
                        },
                        tabBarLabelStyle: {
                            fontSize: 12,
                            fontWeight: '500',
                            color: theme.colorText, // Make labels white

                        },
                        headerShown: false,
                    }}
                >
                    <Tabs.Screen
                        name="index"
                        options={{
                            title: "Home",
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
                    <Tabs.Screen
                        name="stat-manager"
                        options={{
                            title: "Stat Manager",
                            tabBarIcon: ({ color, size }) => (
                                <MaterialCommunityIcons name="lead-pencil" size={size} color={color} />
                            ),
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
                        name="edit-activity"
                        options={{
                            href: null,
                            // tabBarButton: () => null,
                            headerShown: false
                        }}
                    />
                    <Tabs.Screen
                        name="components/SplashScreen"
                        options={{
                            href: null,
                            // tabBarButton: () => null,
                            headerShown: false
                        }}
                    />
                    <Tabs.Screen
                        name="components/DecaySettingsComponent"
                        options={{
                            href: null,
                            // tabBarButton: () => null,
                            headerShown: false
                        }}
                    />
                    <Tabs.Screen
                        name="stats"
                        options={{
                            href: null,
                            // tabBarButton: () => null,
                            headerShown: false
                        }}
                    />
                    <Tabs.Screen
                        name="activities"
                        options={{
                            //tabBarButton: () => null,
                            href: null,
                            headerShown: false
                        }}
                    />
                    <Tabs.Screen
                        name="stats/[category]"  // This is the important addition
                        options={{
                            href: null,
                            // tabBarButton: () => null,
                            headerShown: false
                        }}
                    />
                    <Tabs.Screen
                        name="stats/index"  // This is the important addition
                        options={{
                            href: null,
                            // tabBarButton: () => null,
                            headerShown: false
                        }}
                    />
                    <Tabs.Screen
                        name="stats/attributes/[id]"  // This is the important addition
                        options={{
                            href: null,
                            // tabBarButton: () => null,
                            headerShown: false
                        }}
                    />
                    <Tabs.Screen
                        name="context/CharacterContext"  // This is the important addition
                        options={{
                            href: null,
                            // tabBarButton: () => null,
                            headerShown: false
                        }}
                    />
                    <Tabs.Screen
                        name="context/DecayTimerContext"  // This is the important addition
                        options={{
                            href: null,
                            // tabBarButton: () => null,
                            headerShown: false
                        }}
                    />
                    <Tabs.Screen
                        name="components/DecaySettingsComponent"  // This is the important addition
                        options={{
                            href: null,
                            // tabBarButton: () => null,
                            headerShown: false
                        }}
                    />
                    <Tabs.Screen
                        name="components/SplashScreen"  // This is the important addition
                        options={{
                            href: null,
                            // tabBarButton: () => null,
                            headerShown: false
                        }}
                    />

                </Tabs>
            </DecayTimerProvider>
        </CharacterProvider>
    );
}