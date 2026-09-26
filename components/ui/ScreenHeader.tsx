import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  right?: React.ReactNode
  border?: boolean
  accent?: boolean
}

export function ScreenHeader({ title, subtitle, right, border = true, accent = false }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }, border && styles.border]}>
      <View style={styles.row}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right && <View style={styles.actions}>{right}</View>}
      </View>
      {accent && (
        <LinearGradient
          colors={['#2563EB', '#7C3AED', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentLine}
        />
      )}
    </View>
  )
}

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
    borderBottomColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'space-between',
  },
  titleGroup: { flex: 1, gap: 1 },
  title: {
    fontSize: 22,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
  accentLine: {
    height: 2,
    borderRadius: 1,
    marginTop: 6,
    marginBottom: -10,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
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
