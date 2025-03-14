// app/components/SplashScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
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
                {/* App Icon with animation */}
                <Animated.View
                    style={[
                        { transform: [{ scale: pulseAnim }] }
                    ]}
                >
                    <Image
                        source={require('../../assets/icon.png')}
                        style={styles.icon}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* App Title */}
                <Text style={styles.title}>Daily Digits</Text>

                {/* Loading Message */}
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
    icon: {
        width: 120,
        height: 120,
        marginBottom: theme.spacing.md,
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