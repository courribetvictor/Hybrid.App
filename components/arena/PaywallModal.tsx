import React, { useEffect } from 'react'
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Button } from '@/components/ui/Button'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { useT } from '@/lib/i18n'

const FEATURES = [
  { emoji: '⚔️', text: 'Défis hebdomadaires exclusifs' },
  { emoji: '📊', text: 'Analyse avancée des performances' },
  { emoji: '♾️', text: 'Historique illimité' },
  { emoji: '📋', text: 'Rapport hebdomadaire personnalisé' },
]

interface PaywallModalProps {
  visible: boolean
  onClose: () => void
  onUpgrade?: () => void
}

export function PaywallModal({ visible, onClose, onUpgrade }: PaywallModalProps) {
  const t = useT()
  const translateY = useSharedValue(400)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 })
      translateY.value = withSpring(0, { damping: 22, stiffness: 280 })
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    } else {
      opacity.value = withTiming(0, { duration: 180 })
      translateY.value = withTiming(400, { duration: 220 })
    }
  }, [visible, opacity, translateY])

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value * 0.5 }))
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }))

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, sheetStyle]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⚡ HYBRID PRO</Text>
        </View>

        <Text style={styles.title}>{t.paywall.title}</Text>
        <Text style={styles.subtitle}>{t.paywall.subtitle}</Text>

        {/* Features list */}
        <View style={styles.featuresList}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
              <Text style={styles.check}>✓</Text>
            </View>
          ))}
        </View>

        {/* Price hint */}
        <Text style={styles.price}>À partir de 4,99 € / mois</Text>

        {/* CTAs */}
        <Button
          label={t.paywall.cta}
          variant="primary"
          size="lg"
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            onUpgrade?.()
            onClose()
          }}
        />

        <View style={styles.secondaryRow}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.laterText}>{t.paywall.restore}</Text>
          </TouchableOpacity>
          <Text style={styles.dot}>·</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.laterText}>{t.paywall.later}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.md,
    ...Shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: Colors.electric,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  featuresList: {
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  featureEmoji: { fontSize: 20 },
  featureText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  check: {
    fontSize: FontSize.md,
    color: Colors.success,
    fontWeight: FontWeight.bold,
  },
  price: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: -Spacing.xs,
  },
  dot: {
    color: Colors.textTertiary,
  },
  laterText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
})
