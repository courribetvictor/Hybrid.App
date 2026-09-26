import React, { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SectionList,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing, SportColors } from '@/constants/theme'
import { EXERCISE_DB, GYM_MUSCLE_GROUPS } from '@/constants/exercises'
import { ExerciseCard, MuscleGroupHeader } from '@/components/lab/ExerciseCard'
import type { SportType } from '@/types/database'
import type { ExerciseTemplate } from '@/constants/exercises'

const SPORT_TABS: { key: SportType; label: string; emoji: string }[] = [
  { key: 'gym',       label: 'Muscu',      emoji: '🏋️' },
  { key: 'running',   label: 'Course',     emoji: '🏃' },
  { key: 'cycling',   label: 'Vélo',       emoji: '🚴' },
  { key: 'swimming',  label: 'Natation',   emoji: '🏊' },
  { key: 'hiking',    label: 'Rando',      emoji: '🥾' },
  { key: 'football',  label: 'Football',   emoji: '⚽' },
  { key: 'tennis',    label: 'Tennis',     emoji: '🎾' },
  { key: 'badminton', label: 'Badminton',  emoji: '🏸' },
  { key: 'boxing',    label: 'Boxe',       emoji: '🥊' },
  { key: 'athletics', label: 'Athlétisme', emoji: '⚡' },
  { key: 'yoga',      label: 'Yoga',       emoji: '🧘' },
]

export default function ExercisesScreen() {
  const [activeSport, setActiveSport] = useState<SportType>('gym')
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null)

  const exercises = EXERCISE_DB[activeSport] ?? []

  const filtered = useMemo(() => {
    let list = exercises
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.muscles?.some(m => m.toLowerCase().includes(q))
      )
    }
    if (muscleFilter) {
      list = list.filter(e => e.category === muscleFilter)
    }
    return list
  }, [exercises, search, muscleFilter])

  // Group exercises by category for SectionList
  const sections = useMemo(() => {
    const map: Record<string, ExerciseTemplate[]> = {}
    for (const e of filtered) {
      if (!map[e.category]) map[e.category] = []
      map[e.category].push(e)
    }
    // For gym, order by GYM_MUSCLE_GROUPS
    const order = activeSport === 'gym'
      ? GYM_MUSCLE_GROUPS.map(g => g.key)
      : Object.keys(map)
    return order
      .filter(k => map[k])
      .map(k => ({ title: k, data: map[k] }))
  }, [filtered, activeSport])

  const totalCount = exercises.length

  return (
    <View style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.75}>
          <Text style={styles.backTxt}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Base d'exercices</Text>
          <Text style={styles.subtitle}>{totalCount} exercices disponibles</Text>
        </View>
      </View>

      {/* Sport tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
        style={styles.tabScroll}
      >
        {SPORT_TABS.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[
              styles.tab,
              activeSport === s.key && { backgroundColor: SportColors[s.key], borderColor: SportColors[s.key] },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setActiveSport(s.key)
              setSearch('')
              setMuscleFilter(null)
            }}
            activeOpacity={0.75}
          >
            <Text style={styles.tabEmoji}>{s.emoji}</Text>
            <Text style={[styles.tabLabel, activeSport === s.key && styles.tabLabelActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un exercice…"
          placeholderTextColor={Colors.textTertiary}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Muscle group filter (gym only) */}
      {activeSport === 'gym' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.muscleRow}
          style={{ maxHeight: 44 }}
        >
          <TouchableOpacity
            style={[styles.muscleChip, !muscleFilter && styles.muscleChipActive]}
            onPress={() => setMuscleFilter(null)}
            activeOpacity={0.75}
          >
            <Text style={[styles.muscleLabel, !muscleFilter && styles.muscleLabelActive]}>Tous</Text>
          </TouchableOpacity>
          {GYM_MUSCLE_GROUPS.map(mg => (
            <TouchableOpacity
              key={mg.key}
              style={[
                styles.muscleChip,
                muscleFilter === mg.key && { backgroundColor: mg.color + '25', borderColor: mg.color },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setMuscleFilter(prev => prev === mg.key ? null : mg.key)
              }}
              activeOpacity={0.75}
            >
              <Text style={{ fontSize: 11 }}>{mg.emoji}</Text>
              <Text style={[
                styles.muscleLabel,
                muscleFilter === mg.key && { color: mg.color, fontWeight: FontWeight.bold },
              ]}>
                {mg.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Results count */}
      <Text style={styles.resultCount}>
        {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        {muscleFilter ? ` · ${muscleFilter}` : ''}
        {search ? ` · "${search}"` : ''}
      </Text>

      {/* Exercise list */}
      <SectionList
        sections={sections}
        keyExtractor={(item, i) => `${item.name}_${i}`}
        renderItem={({ item }) => (
          <ExerciseCard exercise={item} />
        )}
        renderSectionHeader={({ section }) => (
          <MuscleGroupHeader
            name={section.title}
            count={section.data.length}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>🔍</Text>
            <Text style={styles.emptyText}>Aucun exercice trouvé</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgAlt },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingTop: 56,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.bgCard,
    ...Shadow.sm,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTxt: { fontSize: FontSize.md, color: Colors.textSecondary },
  headerTitle: { flex: 1 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 1 },
  tabScroll: { maxHeight: 52, backgroundColor: Colors.bgCard },
  tabRow: { gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgAlt,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tabEmoji: { fontSize: 14 },
  tabLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  tabLabelActive: { color: '#fff' },
  searchWrap: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgCard,
  },
  searchInput: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  muscleRow: {
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.bgCard,
  },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgAlt,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  muscleChipActive: { backgroundColor: Colors.electricDim, borderColor: Colors.electric },
  muscleLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  muscleLabelActive: { color: Colors.electric, fontWeight: FontWeight.bold },
  resultCount: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    backgroundColor: Colors.bgCard,
  },
  list: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 40,
  },
  empty: { alignItems: 'center', paddingVertical: 48, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textTertiary },
})
