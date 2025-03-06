import { Stack } from "expo-router";

export default function ActivitiesLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="activity-log" />
            <Stack.Screen name="index" />
        </Stack>
    );
}