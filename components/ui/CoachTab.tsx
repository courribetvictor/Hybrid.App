import React, { useState, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { useCoach } from '@/hooks/useCoach'
import type { Activity } from '@/types/database'
import type { Skills } from '@/hooks/useSkills'
import type { GoalConfig } from '@/hooks/useGoal'

const SUGGESTED: string[] = [
  'Analyse ma semaine et donne-moi un bilan',
  'Comment progresser en endurance ?',
  'Quel sport devrais-je pratiquer plus ?',
  'Crée-moi un plan d\'entraînement pour cette semaine',
  'Quels sont mes points faibles à travailler ?',
]

interface CoachTabProps {
  activities: Activity[]
  skills: Skills
  goal: GoalConfig | null
}

export function CoachTab({ activities, skills, goal }: CoachTabProps) {
  const { messages, loading, error, sendMessage, clearChat } = useCoach(activities, skills, goal)
  const [input, setInput] = useState('')
  const listRef = useRef<FlatList>(null)

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await sendMessage(text)
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
  }, [input, loading, sendMessage])

  const handleSuggestion = useCallback(async (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await sendMessage(text)
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
  }, [sendMessage])

  const isEmpty = messages.length === 0

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.coachBadge}>
          <Text style={styles.coachEmoji}>⚡</Text>
          <View>
            <Text style={styles.coachName}>Coach Hybrid</Text>
            <Text style={styles.coachSub}>IA personnalisée sur tes données</Text>
          </View>
        </View>
        {!isEmpty && (
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn} activeOpacity={0.7}>
            <Text style={styles.clearTxt}>Effacer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages or welcome */}
      {isEmpty ? (
        <View style={styles.welcome}>
          <Text style={styles.welcomeTitle}>Bonjour, athlète 👋</Text>
          <Text style={styles.welcomeSub}>
            Je connais tes activités et tes stats. Pose-moi n'importe quelle question.
          </Text>
          <View style={styles.suggestions}>
            {SUGGESTED.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionBtn}
                onPress={() => handleSuggestion(s)}
                activeOpacity={0.75}
              >
                <Text style={styles.suggestionTxt}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[
              styles.bubble,
              item.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
            ]}>
              {item.role === 'assistant' && (
                <Text style={styles.bubbleFrom}>⚡ Coach</Text>
              )}
              <Text style={[
                styles.bubbleText,
                item.role === 'user' && styles.bubbleTextUser,
              ]}>
                {item.content}
              </Text>
            </View>
          )}
          ListFooterComponent={
            loading ? (
              <View style={styles.typingWrap}>
                <ActivityIndicator size="small" color={Colors.electric} />
                <Text style={styles.typingText}>Coach en train d'écrire…</Text>
              </View>
            ) : error ? (
              <View style={styles.errorWrap}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Pose une question…"
          placeholderTextColor={Colors.textTertiary}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
          activeOpacity={0.85}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  coachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  coachEmoji: {
    fontSize: 28,
    width: 40,
    height: 40,
    textAlign: 'center',
    lineHeight: 40,
    backgroundColor: Colors.electricDim,
    borderRadius: 20,
    overflow: 'hidden',
  },
  coachName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  coachSub: { fontSize: FontSize.xs, color: Colors.textTertiary },
  clearBtn: { padding: 6 },
  clearTxt: { fontSize: FontSize.sm, color: Colors.textTertiary },
  welcome: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  welcomeTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  welcomeSub: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  suggestions: { gap: Spacing.sm, marginTop: Spacing.sm },
  suggestionBtn: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.sm,
  },
  suggestionTxt: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  list: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: 8,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 6,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.electric,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.bgCard,
    borderBottomLeftRadius: 4,
    ...Shadow.sm,
  },
  bubbleFrom: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.electric,
  },
  bubbleText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  bubbleTextUser: { color: '#fff' },
  typingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.md,
    alignSelf: 'flex-start',
  },
  typingText: { fontSize: FontSize.sm, color: Colors.textTertiary },
  errorWrap: { padding: Spacing.md },
  errorText: { fontSize: FontSize.sm, color: Colors.error },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.bg,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.electric,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendIcon: { fontSize: 20, color: '#fff', fontWeight: FontWeight.bold },
})
