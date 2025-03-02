// theme.ts
export const theme = {
    // Core colors
    colorPrimary: '#6366F1', // Indigo primary color
    colorPrimaryDark: '#4F46E5', // Darker shade of primary
    colorPrimaryLight: '#A5B4FC', // Lighter shade of primary
    
    // Secondary colors
    colorSecondary: '#EC4899', // Pink secondary color
    colorAccent: '#8B5CF6', // Purple accent color
    
    // Background colors - DARK THEME
    colorBackground: '#121212', // Dark background
    colorCard: '#1E1E1E', // Dark card background
    
    // Text colors - DARK THEME
    colorText: '#FFFFFF', // White for main text
    colorTextSecondary: '#E0E0E0', // Light gray for secondary text
    colorTextLight: '#A0A0A0', // Medium gray for tertiary text
    
    // Status colors
    colorSuccess: '#10B981', // Green for success states
    colorWarning: '#F59E0B', // Amber for warning states
    colorDanger: '#EF4444', // Red for error/danger states
    
    // UI element colors - DARK THEME
    colorBorder: '#333333', // Dark gray for borders
    colorDisabled: '#555555', // Medium gray for disabled states
    
    // Gradient colors
    gradientPrimary: ['#6366F1', '#8B5CF6'], // Indigo to purple
    gradientSecondary: ['#EC4899', '#8B5CF6'], // Pink to purple
    
    // Fonts
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    
    // Rounded corners
    borderRadius: {
      sm: 6,
      md: 12,
      lg: 16,
      xl: 24,
    },
    
    // Spacing
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
    
    // Shadows - DARK THEME
    shadow: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
      },
    },
  };