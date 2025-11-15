import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'error' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
}) => {
  const containerStyles = [
    styles.container,
    styles[variant],
    size === 'sm' && styles.containerSm,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    size === 'sm' && styles.textSm,
  ];

  return (
    <View style={containerStyles}>
      <Text style={textStyles}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  containerSm: {
    paddingHorizontal: theme.spacing.xs + 2,
    paddingVertical: 2,
  },

  // Variants
  primary: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  success: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  warning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  neutral: {
    backgroundColor: theme.colors.surface,
  },

  // Text styles
  text: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  textSm: {
    fontSize: 10,
  },
  text_primary: {
    color: theme.colors.primary,
  },
  text_success: {
    color: theme.colors.success,
  },
  text_error: {
    color: theme.colors.error,
  },
  text_warning: {
    color: theme.colors.warning,
  },
  text_neutral: {
    color: theme.colors.textSecondary,
  },
});
