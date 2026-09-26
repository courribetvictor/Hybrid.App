import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme'

interface ScreenHeaderProps {
  title: string
  right?: React.ReactNode
  border?: boolean
}

export function ScreenHeader({ title, right, border = true }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }, border && styles.border]}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        {right && <View style={styles.actions}>{right}</View>}
      </View>
    </View>
  )
}

// Reusable icon button for header right side
export function HeaderIconBtn({
  icon, onPress, badge,
}: { icon: string; onPress?: () => void; badge?: boolean }) {
  return (
    <TouchableOpacity style={styles.iconBtn} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.iconBtnText}>{icon}</Text>
      {badge && <View style={styles.badge} />}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.md,
    paddingBottom: 10,
  },
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
  },
  iconBtnText: { fontSize: 17 },
  badge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.electric,
    borderWidth: 1.5,
    borderColor: Colors.bg,
  },
})
