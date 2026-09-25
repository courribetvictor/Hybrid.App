import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
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
            <Image
              source={require('@/assets/logo-full.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
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
  logoImg: {
    height: 28,
    width: 140,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
})
