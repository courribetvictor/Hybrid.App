import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const btnScale = useSharedValue(1)
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }))

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password) {
      Alert.alert('Champs requis', 'Merci de remplir l\'email et le mot de passe.')
      return
    }
    btnScale.value = withSpring(0.96, { damping: 8, stiffness: 400 }, () => {
      btnScale.value = withSpring(1)
    })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    setLoading(false)
    if (error) {
      Alert.alert('Connexion impossible', error.message)
    } else {
      router.replace('/(tabs)')
    }
  }, [email, password, btnScale])

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.safe, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>

        {/* Logo */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.logoWrap}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>⚡</Text>
          </View>
          <Text style={styles.logoText}>
            Hybrid<Text style={styles.logoDot}>.</Text>App
          </Text>
          <Text style={styles.tagline}>Tes performances, tous sports confondus.</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.form}>
          <Text style={styles.formTitle}>Connexion</Text>

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="toi@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Field
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            autoComplete="password"
            right={
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={8}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotWrap}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <Animated.View style={btnStyle}>
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnLoading]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Se connecter</Text>
              }
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Créer un compte</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </KeyboardAvoidingView>
  )
}

function Field({
  label, value, onChangeText, placeholder,
  secureTextEntry, keyboardType, autoCapitalize, autoComplete, right,
}: any) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={field.wrap}>
      <Text style={field.label}>{label}</Text>
      <View style={[field.inputRow, focused && field.inputFocused]}>
        <TextInput
          style={field.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {right}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'space-between' },
  logoWrap: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.lg },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: Colors.electric,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  logoMarkText: { fontSize: 28 },
  logoText: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  logoDot: { color: Colors.electric },
  tagline: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center' },
  form: { gap: Spacing.md },
  formTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginBottom: 4 },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: FontSize.sm, color: Colors.electric, fontWeight: FontWeight.medium },
  btn: {
    backgroundColor: Colors.electric,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    ...Shadow.md,
  },
  btnLoading: { opacity: 0.75 },
  btnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#fff', letterSpacing: 0.3 },
  eyeIcon: { fontSize: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  footerText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  footerLink: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.electric },
})

const field = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 52,
    gap: 8,
  },
  inputFocused: { borderColor: Colors.electric },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
})
