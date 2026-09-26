import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'

const SETTINGS = [
  {
    id: 'new_challenges',
    title: 'Nouveaux défis',
    subtitle: 'Quand un défi hebdomadaire est disponible',
    default: true,
  },
  {
    id: 'friend_activity',
    title: 'Activités des amis',
    subtitle: 'Quand un ami ajoute une séance',
    default: true,
  },
  {
    id: 'reminders',
    title: "Rappels d'entraînement",
    subtitle: "Un rappel si tu n'as pas bougé depuis 3 jours",
    default: false,
  },
  {
    id: 'weekly_summary',
    title: 'Résumé hebdomadaire',
    subtitle: 'Ton bilan sportif chaque lundi matin',
    default: true,
  },
]

export default function NotificationsScreen() {
  const [settings, setSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(SETTINGS.map(s => [s.id, s.default])),
  )

  const toggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSettings(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Préférences</Text>

        <View style={styles.card}>
          {SETTINGS.map((s, i) => (
            <React.Fragment key={s.id}>
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{s.title}</Text>
                  <Text style={styles.rowSub}>{s.subtitle}</Text>
                </View>
                <Switch
                  value={settings[s.id]}
                  onValueChange={() => toggle(s.id)}
                  trackColor={{ false: Colors.border, true: Colors.electricDim }}
                  thumbColor={settings[s.id] ? Colors.electric : '#fff'}
                />
              </View>
              {i < SETTINGS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.note}>
          Les notifications push arrivent dans la prochaine mise à jour. Tes préférences seront prises en compte automatiquement.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4, width: 40 },
  backIcon: { fontSize: FontSize.xl, color: Colors.textPrimary },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 48 },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: -4,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.md,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  rowSub: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.md },
  note: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.sm,
  },
})
