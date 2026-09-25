import React, { useState, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [focused, setFocused] = useState(false)

  const handleReset = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert('Email requis')
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase())
    setLoading(false)
    if (error) Alert.alert('Erreur', error.message)
    else setSent(true)
  }, [email])

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.safe, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} activeOpacity={0.7}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        {sent ? (
          <Animated.View entering={FadeInDown} style={styles.sentWrap}>
            <Text style={styles.sentEmoji}>📬</Text>
            <Text style={styles.sentTitle}>Email envoyé !</Text>
            <Text style={styles.sentSub}>Vérifie ta boîte mail et suis le lien pour réinitialiser ton mot de passe.</Text>
            <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')} activeOpacity={0.85}>
              <Text style={styles.btnText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(100)} style={styles.form}>
            <Text style={styles.title}>Mot de passe oublié</Text>
            <Text style={styles.sub}>Entre ton adresse email et on t'envoie un lien de réinitialisation.</Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputRow, focused && styles.inputFocused]}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="toi@email.com"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnLoading]}
              onPress={handleReset}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Envoyer le lien</Text>
              }
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1, paddingHorizontal: Spacing.xl },
  back: { marginBottom: Spacing.xl },
  backText: { fontSize: FontSize.md, color: Colors.electric, fontWeight: FontWeight.semibold },
  form: { gap: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  sub: { fontSize: FontSize.sm, color: Colors.textTertiary, lineHeight: 20, marginTop: -4 },
  fieldWrap: { gap: 6 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  inputRow: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 52,
    justifyContent: 'center',
  },
  inputFocused: { borderColor: Colors.electric },
  input: { fontSize: FontSize.md, color: Colors.textPrimary },
  btn: {
    backgroundColor: Colors.electric,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.md,
  },
  btnLoading: { opacity: 0.75 },
  btnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#fff' },
  sentWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.md },
  sentEmoji: { fontSize: 56 },
  sentTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  sentSub: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center', lineHeight: 20 },
})
