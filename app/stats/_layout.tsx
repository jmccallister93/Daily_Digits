import { Stack } from "expo-router";

export default function StatsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="physical-stats" />
            <Stack.Screen name="mind-stats" />
            <Stack.Screen name="spiritual-stats" />
        </Stack>
    );
}