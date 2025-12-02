import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { theme } from '../theme';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, language === 'en' && styles.activeButton]}
        onPress={() => setLanguage('en')}
      >
        <Text style={[styles.text, language === 'en' && styles.activeText]}>EN</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, language === 'pt' && styles.activeButton]}
        onPress={() => setLanguage('pt')}
      >
        <Text style={[styles.text, language === 'pt' && styles.activeText]}>PT</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.background,
  },
  activeButton: {
    backgroundColor: theme.colors.primary,
  },
  text: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  activeText: {
    color: '#ffffff',
  },
});
