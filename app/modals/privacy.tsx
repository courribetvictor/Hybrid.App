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
    id: 'public_profile',
    title: 'Profil public',
    subtitle: 'Ton profil est visible par tous les utilisateurs',
    default: true,
  },
  {
    id: 'show_activities',
    title: 'Activités publiques',
    subtitle: 'Tes séances apparaissent dans le feed de tes amis',
    default: true,
  },
  {
    id: 'show_leaderboard',
    title: 'Classement',
    subtitle: "Ton Hybrid Score apparaît dans l'Arène",
    default: true,
  },
  {
    id: 'show_body_metrics',
    title: 'Métriques corporelles',
    subtitle: 'Partager ton poids et ton IMC',
    default: false,
  },
]

export default function PrivacyScreen() {
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
        <Text style={styles.title}>Confidentialité</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Visibilité</Text>

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
          La gestion fine des permissions sera synchronisée avec ton compte dans une prochaine mise à jour.
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
