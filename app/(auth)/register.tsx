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
  ScrollView,
  Image,
} from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'

type SportType = 'running' | 'cycling' | 'swimming' | 'gym' | 'badminton' | 'athletics'

const SPORTS: { type: SportType; emoji: string; label: string }[] = [
  { type: 'running', emoji: '🏃', label: 'Course' },
  { type: 'cycling', emoji: '🚴', label: 'Vélo' },
  { type: 'swimming', emoji: '🏊', label: 'Natation' },
  { type: 'gym', emoji: '🏋️', label: 'Muscu' },
  { type: 'badminton', emoji: '🏸', label: 'Badminton' },
  { type: 'athletics', emoji: '⚡', label: 'Athlé' },
]

export default function RegisterScreen() {
  const insets = useSafeAreaInsets()
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [favSports, setFavSports] = useState<SportType[]>([])
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const toggleSport = useCallback((s: SportType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setFavSports(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }, [])

  const handleNext = useCallback(() => {
    setErrorMsg(null)
    if (!email.trim() || !password || !username.trim()) {
      setErrorMsg('Merci de remplir tous les champs.')
      return
    }
    if (password.length < 6) {
      setErrorMsg('Le mot de passe doit faire au moins 6 caractères.')
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setStep(2)
  }, [email, password, username])

  const handleRegister = useCallback(async () => {
    setErrorMsg(null)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { username: username.trim() } },
    })

    if (error) {
      setLoading(false)
      setErrorMsg(error.message)
      return
    }

    // Patch username on profile row (created by DB trigger)
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', data.user.id)
    }

    setLoading(false)

    if (data.session) {
      // Session immédiate (confirmation email désactivée) → auth guard redirige
      // Pas besoin de router.replace ici, _layout.tsx s'en charge via onAuthStateChange
    } else {
      // Confirmation email requise
      setEmailSent(true)
    }
  }, [email, password, username])

  if (emailSent) {
    return (
      <View style={styles.centeredFull}>
        <Text style={styles.bigEmoji}>📬</Text>
        <Text style={styles.successTitle}>Vérifie tes emails</Text>
        <Text style={styles.successSub}>
          Un lien de confirmation a été envoyé à{'\n'}
          <Text style={styles.emailHighlight}>{email.trim()}</Text>
          {'\n'}Clique dessus, puis reviens te connecter.
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Aller à la connexion</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.logoWrap}>
          <Image
            source={require('@/assets/logo-icon.png')}
            style={styles.logoMark}
            resizeMode="contain"
          />
          <Image
            source={require('@/assets/logo-full.png')}
            style={styles.logoText}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Step indicator */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.steps}>
          <View style={[styles.step, step >= 1 && styles.stepActive]} />
          <View style={[styles.step, step >= 2 && styles.stepActive]} />
        </Animated.View>

        {/* Error banner */}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {step === 1 ? (
          <Animated.View entering={FadeInDown.delay(150)} style={styles.form}>
            <Text style={styles.formTitle}>Crée ton compte</Text>
            <Text style={styles.formSub}>Gratuit, sans carte bleue.</Text>

            <Field
              label="Nom d'utilisateur"
              value={username}
              onChangeText={setUsername}
              placeholder="ton_pseudo"
              autoCapitalize="none"
            />
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
              placeholder="Min. 6 caractères"
              secureTextEntry={!showPassword}
              right={
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={8}>
                  <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              }
            />

            <TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.btnText}>Continuer →</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(50)} style={styles.form}>
            <Text style={styles.formTitle}>Tes sports</Text>
            <Text style={styles.formSub}>Sélectionne ceux que tu pratiques.</Text>

            <View style={styles.sportsGrid}>
              {SPORTS.map(s => {
                const active = favSports.includes(s.type)
                return (
                  <TouchableOpacity
                    key={s.type}
                    style={[styles.sportChip, active && styles.sportChipActive]}
                    onPress={() => toggleSport(s.type)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.sportEmoji}>{s.emoji}</Text>
                    <Text style={[styles.sportLabel, active && styles.sportLabelActive]}>{s.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnLoading]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Créer mon compte ⚡</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(1)} style={styles.backWrap} activeOpacity={0.7}>
              <Text style={styles.backText}>← Retour</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ?</Text>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, autoComplete, right }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={field.wrap}>
      <Text style={field.label}>{label}</Text>
      <View style={[field.row, focused && field.rowFocused]}>
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
  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  centeredFull: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  bigEmoji: { fontSize: 56 },
  successTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, textAlign: 'center' },
  successSub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emailHighlight: { fontWeight: FontWeight.bold, color: Colors.electric },
  errorBanner: {
    backgroundColor: Colors.error + '18',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  errorText: { fontSize: FontSize.sm, color: Colors.error, fontWeight: FontWeight.medium },
  logoWrap: { alignItems: 'center', gap: Spacing.sm },
  logoMark: { width: 64, height: 64 },
  logoText: { width: 160, height: 36 },
  steps: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  step: { width: 28, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  stepActive: { backgroundColor: Colors.electric },
  form: { gap: Spacing.md },
  formTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  formSub: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: -8 },
  sportsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgAlt,
  },
  sportChipActive: { borderColor: Colors.electric, backgroundColor: Colors.electricDim },
  sportEmoji: { fontSize: 16 },
  sportLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  sportLabelActive: { color: Colors.electric },
  btn: {
    backgroundColor: Colors.electric,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.md,
  },
  btnLoading: { opacity: 0.75 },
  btnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#fff', letterSpacing: 0.3 },
  backWrap: { alignSelf: 'center' },
  backText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  footerText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  footerLink: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.electric },
})

const field = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  row: {
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
  rowFocused: { borderColor: Colors.electric },
  input: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
})
