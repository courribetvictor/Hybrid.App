import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { Button } from '@/components/ui/Button'
import { useActivities } from '@/hooks/useActivities'
import { useSession } from '@/hooks/useProfile'
import { useT } from '@/lib/i18n'
import type { SportType, GymExercise, BadmintonSet, TennisSet, ActivityMetrics } from '@/types/database'

// ── Sport config ──────────────────────────────────────────────

const SPORTS: { key: SportType; emoji: string; label: string }[] = [
  { key: 'running',   emoji: '🏃', label: 'Course' },
  { key: 'cycling',   emoji: '🚴', label: 'Vélo' },
  { key: 'swimming',  emoji: '🏊', label: 'Natation' },
  { key: 'hiking',    emoji: '🥾', label: 'Randonnée' },
  { key: 'gym',       emoji: '🏋️', label: 'Muscu' },
  { key: 'football',  emoji: '⚽', label: 'Football' },
  { key: 'tennis',    emoji: '🎾', label: 'Tennis' },
  { key: 'badminton', emoji: '🏸', label: 'Badminton' },
  { key: 'boxing',    emoji: '🥊', label: 'Boxe' },
  { key: 'athletics', emoji: '⚡', label: 'Athlétisme' },
  { key: 'yoga',      emoji: '🧘', label: 'Yoga' },
]

// ── Component ─────────────────────────────────────────────────

export default function AddActivityModal() {
  const t = useT()
  const { userId } = useSession()
  const { addActivity } = useActivities(userId ?? undefined)

  const [sport, setSport] = useState<SportType | null>(null)
  const [durationMin, setDurationMin] = useState('')
  const [calories, setCalories] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Endurance fields
  const [distanceKm, setDistanceKm] = useState('')
  const [avgHeartRate, setAvgHeartRate] = useState('')

  // Gym fields
  const [exercises, setExercises] = useState<GymExercise[]>([])

  // Badminton fields
  const [sets, setBadmintonSets] = useState<BadmintonSet[]>([{ player_score: 0, opponent_score: 0 }])
  const [matchWon, setMatchWon] = useState<boolean | null>(null)

  // Athletics fields
  const [event, setEvent] = useState('')
  const [resultValue, setResultValue] = useState('')

  // Football fields
  const [footballGoals, setFootballGoals] = useState('')
  const [footballAssists, setFootballAssists] = useState('')
  const [footballPosition, setFootballPosition] = useState('')
  const [footballWon, setFootballWon] = useState<boolean | null>(null)

  // Tennis fields
  const [tennisSets, setTennisSets] = useState<TennisSet[]>([{ player_games: 0, opponent_games: 0 }])
  const [tennisWon, setTennisWon] = useState<boolean | null>(null)
  const [tennisAces, setTennisAces] = useState('')

  // Hiking fields
  const [hikingElevation, setHikingElevation] = useState('')

  // Yoga fields
  const [yogaStyle, setYogaStyle] = useState('hatha')

  // Boxing fields
  const [boxingRounds, setBoxingRounds] = useState('')
  const [boxingType, setBoxingType] = useState('bag')

  const handleSave = useCallback(async () => {
    setErrorMsg(null)
    if (!sport) return
    const dur = parseInt(durationMin) * 60
    if (!dur || dur <= 0) {
      setErrorMsg('Merci de saisir une durée en minutes.')
      return
    }

    let metrics: ActivityMetrics
    if (sport === 'running' || sport === 'cycling' || sport === 'swimming') {
      metrics = {
        distance_m: parseFloat(distanceKm) * 1000 || 0,
        avg_heart_rate: parseInt(avgHeartRate) || undefined,
      }
    } else if (sport === 'gym') {
      const totalVolume = exercises.reduce((sum, ex) => {
        return sum + ex.sets.reduce((s, st) => s + st.reps * st.weight_kg, 0)
      }, 0)
      metrics = { exercises, total_volume_kg: totalVolume }
    } else if (sport === 'badminton') {
      metrics = { sets, match_won: matchWon ?? false }
    } else if (sport === 'athletics') {
      metrics = {
        event,
        result_value: parseFloat(resultValue) || 0,
        result_unit: 's',
      }
    } else if (sport === 'hiking') {
      metrics = {
        distance_m: parseFloat(distanceKm) * 1000 || 0,
        avg_heart_rate: parseInt(avgHeartRate) || undefined,
        elevation_m: parseInt(hikingElevation) || undefined,
      }
    } else if (sport === 'football') {
      metrics = {
        match_won: footballWon ?? false,
        goals_scored: parseInt(footballGoals) || 0,
        assists: parseInt(footballAssists) || 0,
        position: (footballPosition as any) || undefined,
      } as any
    } else if (sport === 'tennis') {
      metrics = {
        sets: tennisSets,
        match_won: tennisWon ?? false,
        aces: parseInt(tennisAces) || undefined,
      } as any
    } else if (sport === 'yoga') {
      metrics = {
        style: yogaStyle,
        avg_heart_rate: parseInt(avgHeartRate) || undefined,
      } as any
    } else {
      // boxing
      metrics = {
        rounds: parseInt(boxingRounds) || undefined,
        bout_type: boxingType,
        avg_heart_rate: parseInt(avgHeartRate) || undefined,
      } as any
    }

    try {
      setLoading(true)
      await addActivity({
        sport_type: sport,
        duration_seconds: dur,
        calories_burned: parseInt(calories) || null,
        metrics,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.back()
    } catch (e: any) {
      setErrorMsg(e.message)
    } finally {
      setLoading(false)
    }
  }, [sport, durationMin, calories, distanceKm, avgHeartRate, exercises, sets, matchWon, event, resultValue,
      footballGoals, footballAssists, footballPosition, footballWon,
      tennisSets, tennisWon, tennisAces, hikingElevation, yogaStyle,
      boxingRounds, boxingType, addActivity])

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Handle bar */}
      <View style={styles.handle} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t.activity.addActivity}</Text>

        {/* Sport selector */}
        <Text style={styles.sectionLabel}>{t.activity.selectSport}</Text>
        <View style={styles.sportGrid}>
          {SPORTS.map(s => (
            <SportChip
              key={s.key}
              emoji={s.emoji}
              label={s.label}
              active={sport === s.key}
              onPress={() => setSport(s.key)}
            />
          ))}
        </View>

        {sport && (
          <>
            {/* Common fields */}
            <View style={styles.row}>
              <Field
                label={`${t.activity.duration} (min)`}
                value={durationMin}
                onChange={setDurationMin}
                keyboardType="numeric"
                placeholder="30"
              />
              <Field
                label={t.activity.caloriesBurned}
                value={calories}
                onChange={setCalories}
                keyboardType="numeric"
                placeholder="300"
              />
            </View>

            {/* Sport-specific fields */}
            {(sport === 'running' || sport === 'cycling' || sport === 'swimming') && (
              <EnduranceFields
                distanceKm={distanceKm}
                onDistanceChange={setDistanceKm}
                heartRate={avgHeartRate}
                onHeartRateChange={setAvgHeartRate}
                t={t}
              />
            )}

            {sport === 'gym' && (
              <GymFields exercises={exercises} onChange={setExercises} t={t} />
            )}

            {sport === 'badminton' && (
              <BadmintonFields
                sets={sets}
                onSetsChange={setBadmintonSets}
                won={matchWon}
                onWonChange={setMatchWon}
                t={t}
              />
            )}

            {sport === 'athletics' && (
              <AthleticsFields
                event={event}
                onEventChange={setEvent}
                result={resultValue}
                onResultChange={setResultValue}
                t={t}
              />
            )}

            {sport === 'hiking' && (
              <HikingFields
                distanceKm={distanceKm}
                onDistanceChange={setDistanceKm}
                elevation={hikingElevation}
                onElevationChange={setHikingElevation}
                heartRate={avgHeartRate}
                onHeartRateChange={setAvgHeartRate}
              />
            )}

            {sport === 'football' && (
              <FootballFields
                goals={footballGoals}
                onGoalsChange={setFootballGoals}
                assists={footballAssists}
                onAssistsChange={setFootballAssists}
                position={footballPosition}
                onPositionChange={setFootballPosition}
                won={footballWon}
                onWonChange={setFootballWon}
                t={t}
              />
            )}

            {sport === 'tennis' && (
              <TennisFields
                sets={tennisSets}
                onSetsChange={setTennisSets}
                won={tennisWon}
                onWonChange={setTennisWon}
                aces={tennisAces}
                onAcesChange={setTennisAces}
                t={t}
              />
            )}

            {sport === 'yoga' && (
              <YogaFields
                yogaStyle={yogaStyle}
                onStyleChange={setYogaStyle}
                heartRate={avgHeartRate}
                onHeartRateChange={setAvgHeartRate}
              />
            )}

            {sport === 'boxing' && (
              <BoxingFields
                rounds={boxingRounds}
                onRoundsChange={setBoxingRounds}
                boutType={boxingType}
                onTypeChange={setBoxingType}
                heartRate={avgHeartRate}
                onHeartRateChange={setAvgHeartRate}
                t={t}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Inline error */}
      {errorMsg && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Footer CTA */}
      <View style={styles.footer}>
        <Button
          label={t.common.cancel}
          variant="ghost"
          style={styles.footerBtn}
          onPress={() => router.back()}
        />
        <Button
          label={t.common.save}
          variant="primary"
          style={styles.footerBtn}
          onPress={handleSave}
          loading={loading}
          disabled={!sport}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

// ── Sub-forms ─────────────────────────────────────────────────

function EnduranceFields({ distanceKm, onDistanceChange, heartRate, onHeartRateChange, t }: any) {
  return (
    <View style={styles.row}>
      <Field
        label={`${t.activity.distance} (km)`}
        value={distanceKm}
        onChange={onDistanceChange}
        keyboardType="decimal-pad"
        placeholder="10.5"
      />
      <Field
        label={`${t.activity.heartRate} (bpm)`}
        value={heartRate}
        onChange={onHeartRateChange}
        keyboardType="numeric"
        placeholder="155"
      />
    </View>
  )
}

function GymFields({ exercises, onChange, t }: { exercises: GymExercise[]; onChange: (e: GymExercise[]) => void; t: any }) {
  const addExercise = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange([...exercises, { name: '', sets: [{ reps: 0, weight_kg: 0 }] }])
  }

  const updateExerciseName = (idx: number, name: string) => {
    const next = [...exercises]
    next[idx] = { ...next[idx], name }
    onChange(next)
  }

  const addSet = (exIdx: number) => {
    const next = [...exercises]
    next[exIdx] = { ...next[exIdx], sets: [...next[exIdx].sets, { reps: 0, weight_kg: 0 }] }
    onChange(next)
  }

  const updateSet = (exIdx: number, setIdx: number, field: 'reps' | 'weight_kg', value: string) => {
    const next = [...exercises]
    const sets = [...next[exIdx].sets]
    sets[setIdx] = { ...sets[setIdx], [field]: parseFloat(value) || 0 }
    next[exIdx] = { ...next[exIdx], sets }
    onChange(next)
  }

  return (
    <View style={styles.section}>
      {exercises.map((ex, ei) => (
        <View key={ei} style={styles.exerciseCard}>
          <TextInput
            style={styles.exerciseName}
            value={ex.name}
            onChangeText={v => updateExerciseName(ei, v)}
            placeholder="Développé couché, Squat…"
            placeholderTextColor={Colors.textTertiary}
          />
          {ex.sets.map((s, si) => (
            <View key={si} style={styles.setRow}>
              <Text style={styles.setIndex}>#{si + 1}</Text>
              <SmallField
                value={s.reps > 0 ? String(s.reps) : ''}
                onChange={v => updateSet(ei, si, 'reps', v)}
                placeholder="Reps"
              />
              <SmallField
                value={s.weight_kg > 0 ? String(s.weight_kg) : ''}
                onChange={v => updateSet(ei, si, 'weight_kg', v)}
                placeholder="kg"
              />
            </View>
          ))}
          <TouchableOpacity onPress={() => addSet(ei)} style={styles.addSetBtn}>
            <Text style={styles.addSetText}>+ {t.activity.addSet}</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Button label={`+ ${t.activity.addExercise}`} variant="secondary" onPress={addExercise} />
    </View>
  )
}

function BadmintonFields({ sets, onSetsChange, won, onWonChange, t }: any) {
  const addSet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSetsChange([...sets, { player_score: 0, opponent_score: 0 }])
  }

  const updateSet = (idx: number, field: 'player_score' | 'opponent_score', value: string) => {
    const next = [...sets]
    next[idx] = { ...next[idx], [field]: parseInt(value) || 0 }
    onSetsChange(next)
  }

  return (
    <View style={styles.section}>
      {sets.map((s: BadmintonSet, i: number) => (
        <View key={i} style={styles.setRow}>
          <Text style={styles.setIndex}>Set {i + 1}</Text>
          <SmallField
            value={s.player_score > 0 ? String(s.player_score) : ''}
            onChange={v => updateSet(i, 'player_score', v)}
            placeholder="Moi"
          />
          <Text style={{ color: Colors.textTertiary }}>–</Text>
          <SmallField
            value={s.opponent_score > 0 ? String(s.opponent_score) : ''}
            onChange={v => updateSet(i, 'opponent_score', v)}
            placeholder="Adv."
          />
        </View>
      ))}

      <Button label="+ Set" variant="secondary" size="sm" onPress={addSet} style={{ alignSelf: 'flex-start' }} />

      {/* Win/Loss toggle */}
      <View style={styles.toggleRow}>
        {([true, false] as const).map(val => (
          <TouchableOpacity
            key={String(val)}
            style={[styles.toggleBtn, won === val && styles.toggleBtnActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onWonChange(val) }}
          >
            <Text style={[styles.toggleText, won === val && styles.toggleTextActive]}>
              {val ? t.activity.won : t.activity.lost}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

function AthleticsFields({ event, onEventChange, result, onResultChange, t }: any) {
  return (
    <View style={styles.row}>
      <Field
        label={t.activity.event}
        value={event}
        onChange={onEventChange}
        placeholder="100m, Saut en longueur…"
      />
      <Field
        label={t.activity.result}
        value={result}
        onChange={onResultChange}
        keyboardType="decimal-pad"
        placeholder="9.85"
      />
    </View>
  )
}

function HikingFields({ distanceKm, onDistanceChange, elevation, onElevationChange, heartRate, onHeartRateChange }: any) {
  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <Field
          label="Distance (km)"
          value={distanceKm}
          onChange={onDistanceChange}
          keyboardType="decimal-pad"
          placeholder="15.0"
        />
        <Field
          label="Dénivelé (m)"
          value={elevation}
          onChange={onElevationChange}
          keyboardType="numeric"
          placeholder="800"
        />
      </View>
      <Field
        label="Fréquence cardiaque (bpm)"
        value={heartRate}
        onChange={onHeartRateChange}
        keyboardType="numeric"
        placeholder="130"
      />
    </View>
  )
}

const FOOTBALL_POSITIONS = [
  { key: 'goalkeeper', label: 'Gardien' },
  { key: 'defender',   label: 'Défenseur' },
  { key: 'midfielder', label: 'Milieu' },
  { key: 'forward',    label: 'Attaquant' },
]

function FootballFields({ goals, onGoalsChange, assists, onAssistsChange, position, onPositionChange, won, onWonChange, t }: any) {
  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <Field label="Buts" value={goals} onChange={onGoalsChange} keyboardType="numeric" placeholder="0" />
        <Field label="Passes déc." value={assists} onChange={onAssistsChange} keyboardType="numeric" placeholder="0" />
      </View>
      <Text style={styles.sectionLabel}>Position</Text>
      <View style={styles.toggleRow}>
        {FOOTBALL_POSITIONS.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[styles.toggleBtn, position === p.key && styles.toggleBtnActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPositionChange(p.key) }}
          >
            <Text style={[styles.toggleText, position === p.key && styles.toggleTextActive, { fontSize: FontSize.xs }]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.toggleRow}>
        {([true, false] as const).map(val => (
          <TouchableOpacity
            key={String(val)}
            style={[styles.toggleBtn, won === val && styles.toggleBtnActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onWonChange(val) }}
          >
            <Text style={[styles.toggleText, won === val && styles.toggleTextActive]}>
              {val ? t.activity.won : t.activity.lost}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

function TennisFields({ sets, onSetsChange, won, onWonChange, aces, onAcesChange, t }: any) {
  const addSet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSetsChange([...sets, { player_games: 0, opponent_games: 0 }])
  }
  const updateSet = (idx: number, field: 'player_games' | 'opponent_games', value: string) => {
    const next = [...sets]
    next[idx] = { ...next[idx], [field]: parseInt(value) || 0 }
    onSetsChange(next)
  }
  return (
    <View style={styles.section}>
      {sets.map((s: TennisSet, i: number) => (
        <View key={i} style={styles.setRow}>
          <Text style={styles.setIndex}>Set {i + 1}</Text>
          <SmallField
            value={s.player_games > 0 ? String(s.player_games) : ''}
            onChange={(v: string) => updateSet(i, 'player_games', v)}
            placeholder="Moi"
          />
          <Text style={{ color: Colors.textTertiary }}>–</Text>
          <SmallField
            value={s.opponent_games > 0 ? String(s.opponent_games) : ''}
            onChange={(v: string) => updateSet(i, 'opponent_games', v)}
            placeholder="Adv."
          />
        </View>
      ))}
      <Button label="+ Set" variant="secondary" size="sm" onPress={addSet} style={{ alignSelf: 'flex-start' }} />
      <Field label="Aces" value={aces} onChange={onAcesChange} keyboardType="numeric" placeholder="3" />
      <View style={styles.toggleRow}>
        {([true, false] as const).map(val => (
          <TouchableOpacity
            key={String(val)}
            style={[styles.toggleBtn, won === val && styles.toggleBtnActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onWonChange(val) }}
          >
            <Text style={[styles.toggleText, won === val && styles.toggleTextActive]}>
              {val ? t.activity.won : t.activity.lost}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const YOGA_STYLES = [
  { key: 'hatha',    label: 'Hatha' },
  { key: 'vinyasa',  label: 'Vinyasa' },
  { key: 'yin',      label: 'Yin' },
  { key: 'ashtanga', label: 'Ashtanga' },
  { key: 'power',    label: 'Power' },
  { key: 'other',    label: 'Autre' },
]

function YogaFields({ yogaStyle, onStyleChange, heartRate, onHeartRateChange }: any) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Style</Text>
      <View style={styles.sportGrid}>
        {YOGA_STYLES.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[styles.toggleBtn, yogaStyle === s.key && styles.toggleBtnActive, { flex: 0, paddingHorizontal: 14 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onStyleChange(s.key) }}
          >
            <Text style={[styles.toggleText, yogaStyle === s.key && styles.toggleTextActive, { fontSize: FontSize.sm }]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Field
        label="Fréquence cardiaque (bpm)"
        value={heartRate}
        onChange={onHeartRateChange}
        keyboardType="numeric"
        placeholder="95"
      />
    </View>
  )
}

const BOXING_TYPES = [
  { key: 'bag',         label: 'Sac' },
  { key: 'pad_work',    label: 'Pattes' },
  { key: 'sparring',    label: 'Sparring' },
  { key: 'competition', label: 'Compét.' },
]

function BoxingFields({ rounds, onRoundsChange, boutType, onTypeChange, heartRate, onHeartRateChange, t }: any) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Type de séance</Text>
      <View style={styles.toggleRow}>
        {BOXING_TYPES.map(bt => (
          <TouchableOpacity
            key={bt.key}
            style={[styles.toggleBtn, boutType === bt.key && styles.toggleBtnActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onTypeChange(bt.key) }}
          >
            <Text style={[styles.toggleText, boutType === bt.key && styles.toggleTextActive, { fontSize: FontSize.sm }]}>
              {bt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.row}>
        <Field label="Rounds" value={rounds} onChange={onRoundsChange} keyboardType="numeric" placeholder="6" />
        <Field label="Fréquence (bpm)" value={heartRate} onChange={onHeartRateChange} keyboardType="numeric" placeholder="155" />
      </View>
    </View>
  )
}

// ── Shared input atoms ────────────────────────────────────────

function Field({ label, value, onChange, keyboardType = 'default', placeholder }: any) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
      />
    </View>
  )
}

function SmallField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <TextInput
      style={fieldStyles.small}
      value={value}
      onChangeText={onChange}
      keyboardType="decimal-pad"
      placeholder={placeholder}
      placeholderTextColor={Colors.textTertiary}
    />
  )
}

function SportChip({ emoji, label, active, onPress }: any) {
  return (
    <TouchableOpacity
      style={[chipStyles.chip, active && chipStyles.active]}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress() }}
      activeOpacity={0.75}
    >
      <Text style={chipStyles.emoji}>{emoji}</Text>
      <Text style={[chipStyles.label, active && chipStyles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  section: {
    gap: Spacing.sm,
  },
  exerciseCard: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  exerciseName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 6,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  setIndex: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    width: 28,
  },
  addSetBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  addSetText: {
    fontSize: FontSize.sm,
    color: Colors.electric,
    fontWeight: FontWeight.medium,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgAlt,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.electric,
  },
  toggleText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.textInverse,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  footerBtn: {
    flex: 1,
  },
  errorBanner: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.error + '18',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    fontWeight: FontWeight.medium,
  },
})

const fieldStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  small: {
    flex: 1,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
})

const chipStyles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgAlt,
    gap: 4,
    minWidth: 80,
  },
  active: {
    backgroundColor: Colors.electric,
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.textInverse,
  },
})
