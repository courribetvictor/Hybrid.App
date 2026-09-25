import React, { useCallback } from 'react'
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, Radius, FontSize, FontWeight } from '@/constants/theme'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  style,
  textStyle,
  onPress,
  disabled,
  ...rest
}: ButtonProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 })
  }, [scale])

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 })
  }, [scale])

  const handlePress = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
      if (loading || disabled) return
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onPress?.(e)
    },
    [loading, disabled, onPress],
  )

  const isDisabled = disabled || loading

  return (
    <AnimatedPressable
      style={[animatedStyle, styles.base, styles[variant], styles[`size_${size}`], isDisabled && styles.disabled, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.textInverse : Colors.electric}
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`], textStyle]}>
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.md,
  },

  // ── Variants ───────────────────────────────
  primary: {
    backgroundColor: Colors.electric,
  },
  secondary: {
    backgroundColor: Colors.electricDim,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  danger: {
    backgroundColor: Colors.error,
  },

  // ── Sizes ──────────────────────────────────
  size_sm: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.sm },
  size_md: { paddingHorizontal: 20, paddingVertical: 14 },
  size_lg: { paddingHorizontal: 28, paddingVertical: 18, borderRadius: Radius.lg },

  disabled: { opacity: 0.45 },

  // ── Labels ─────────────────────────────────
  label: {
    fontWeight: FontWeight.semibold,
  },
  label_primary: { color: Colors.textInverse },
  label_secondary: { color: Colors.electric },
  label_ghost: { color: Colors.textPrimary },
  label_danger: { color: Colors.textInverse },

  labelSize_sm: { fontSize: FontSize.sm },
  labelSize_md: { fontSize: FontSize.md },
  labelSize_lg: { fontSize: FontSize.lg },
})
