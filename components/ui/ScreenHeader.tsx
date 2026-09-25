import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme'

interface ScreenHeaderProps {
  title?: string
  logo?: boolean
  right?: React.ReactNode
  left?: React.ReactNode
  border?: boolean
}

export function ScreenHeader({ title, logo, right, left, border = true }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }, border && styles.border]}>
      <View style={styles.row}>
        <View style={styles.side}>{left}</View>

        <View style={styles.center}>
          {logo ? (
            <Text style={styles.logo}>
              Hybrid<Text style={styles.dot}>.</Text>App
            </Text>
          ) : (
            <Text style={styles.title}>{title}</Text>
          )}
        </View>

        <View style={[styles.side, styles.sideRight]}>{right}</View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.md,
    paddingBottom: 12,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  side: {
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  dot: {
    color: Colors.electric,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
})
