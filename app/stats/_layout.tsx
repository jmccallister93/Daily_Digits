// app/(stats)/_layout.tsx
import { Stack } from "expo-router";

export default function StatsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        />
    );
}