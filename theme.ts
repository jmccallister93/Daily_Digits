// theme.ts
export const theme = {
    // Core colors
    colorPrimary: '#6366F1', // Indigo primary color
    colorPrimaryDark: '#4F46E5', // Darker shade of primary
    colorPrimaryLight: '#A5B4FC', // Lighter shade of primary
    
    // Secondary colors
    colorSecondary: '#EC4899', // Pink secondary color
    colorAccent: '#8B5CF6', // Purple accent color
    
    // Background colors
    colorBackground: '#F9FAFB', // Very light gray background
    colorCard: '#FFFFFF', // White for cards
    
    // Text colors
    colorText: '#1F2937', // Dark gray for main text
    colorTextSecondary: '#6B7280', // Medium gray for secondary text
    colorTextLight: '#9CA3AF', // Light gray for tertiary text
    
    // Status colors
    colorSuccess: '#10B981', // Green for success states
    colorWarning: '#F59E0B', // Amber for warning states
    colorDanger: '#EF4444', // Red for error/danger states
    
    // UI element colors
    colorBorder: '#E5E7EB', // Light gray for borders
    colorDisabled: '#D1D5DB', // Gray for disabled states
    
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
    
    // Shadows
    shadow: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
      },
    },
  };