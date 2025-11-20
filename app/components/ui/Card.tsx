import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'flat' | 'blue' | 'green' | 'purple' | 'orange';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'default',
  padding = 'md',
}) => {
  const cardStyles = [
    styles.card,
    variant === 'default' && styles.cardDefault,
    variant === 'flat' && styles.cardFlat,
    variant === 'blue' && styles.cardBlue,
    variant === 'green' && styles.cardGreen,
    variant === 'purple' && styles.cardPurple,
    variant === 'orange' && styles.cardOrange,
    padding === 'sm' && styles.paddingSm,
    padding === 'md' && styles.paddingMd,
    padding === 'lg' && styles.paddingLg,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyles} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  cardDefault: {
    backgroundColor: theme.colors.background,
    ...theme.shadows.sm,
  },
  cardFlat: {
    backgroundColor: 'rgba(156, 163, 175, 0.15)',
  },
  cardBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  cardGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  cardPurple: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  cardOrange: {
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
  },
  paddingSm: {
    padding: theme.spacing.sm,
  },
  paddingMd: {
    padding: theme.spacing.md,
  },
  paddingLg: {
    padding: theme.spacing.lg,
  },
});
