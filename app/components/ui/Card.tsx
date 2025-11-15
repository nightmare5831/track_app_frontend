import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'flat';
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
    backgroundColor: theme.colors.surface,
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
