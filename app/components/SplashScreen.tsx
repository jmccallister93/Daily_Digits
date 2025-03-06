// app/components/SplashScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '../../theme';

interface SplashScreenProps {
    message?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ message = 'Loading...' }) => {
    // Animation value for pulsing effect
    const pulseAnim = new Animated.Value(1);

    // Setup animation sequence
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Animated.Text
                    style={[
                        styles.title,
                        { transform: [{ scale: pulseAnim }] }
                    ]}
                >
                    Daily Digits
                </Animated.Text>
                <Text style={styles.message}>{message}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colorBackground,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: theme.colorText,
        marginBottom: theme.spacing.lg,
    },
    message: {
        fontSize: 16,
        color: theme.colorTextSecondary,
    },
});

export default SplashScreen;