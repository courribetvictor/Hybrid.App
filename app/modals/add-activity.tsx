import React, { useState, useCallback, useRef, useEffect } from 'react'
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeOut,
} from 'react-native-reanimated'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import {
  X,
  PersonStanding, Bike, Waves, Mountain, Dumbbell,
  CircleDot, Zap, Feather, Activity, Timer, Flower2,
  Play, Pause, RotateCcw,
  MapPin, Heart, TrendingUp, Clock,
  Swords, Target, Trophy,
  Plus, Trash2, Copy,
} from 'lucide-react-native'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { Button } from '@/components/ui/Button'
import { useActivities } from '@/hooks/useActivities'
import { useSession } from '@/hooks/useProfile'
import { useT } from '@/lib/i18n'
import type { SportType, GymExercise, BadmintonSet, TennisSet, ActivityMetrics } from '@/types/database'
import { EXERCISE_DB } from '@/constants/exercises'
import { SPORT_CATALOG, SPORT_BY_KEY } from '@/constants/sportCatalog'
import { SportActivityPicker } from '@/components/sports/SportActivityPicker'
import { DynamicSportFields } from '@/components/sports/DynamicSportFields'
import { useProfile } from '@/hooks/useProfile'
import { useSensoryFeedback } from '@/hooks/useSensoryFeedback'

// ── Sport config ──────────────────────────────────────────────

type SportConfig = {
  key: SportType
  label: string
  color: string
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>
}

const SPORTS: SportConfig[] = SPORT_CATALOG.map(s => ({ key:s.key, label:s.shortLabel ?? s.label, color:s.color, Icon: Activity }))

const SPORT_MAP = Object.fromEntries(SPORTS.map(s => [s.key, s])) as Record<SportType, SportConfig>

const ENDURANCE_SPORTS: SportType[] = SPORT_CATALOG.filter(s => ['running_endurance','cycling','aquatic','paddle_boat'].includes(s.family)).map(s => s.key)

function formatTimer(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Main component ────────────────────────────────────────────

export default function AddActivityModal() {
  const t = useT()
  const { userId } = useSession()
  const { profile } = useProfile(userId ?? undefined)
  const { addActivity } = useActivities(userId ?? undefined)
  const { play: sensory } = useSensoryFeedback()

  const [sport, setSport] = useState<SportType | null>(null)
  const [durationMin, setDurationMin] = useState('')
  const [calories, setCalories] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [rpe, setRpe] = useState<number | null>(null)
  const [mood, setMood] = useState<number | null>(null)
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public')
  const [performedDate, setPerformedDate] = useState(() => new Date().toLocaleDateString('fr-FR'))
  const [performedTime, setPerformedTime] = useState(() => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
  const [sessionType, setSessionType] = useState('training')
  const [dynamicMetrics, setDynamicMetrics] = useState<Record<string, any>>({})

  // Chrono state (endurance only)
  const [timerMode, setTimerMode] = useState<'manual' | 'live'>('manual')
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSecs, setTimerSecs] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSecs(s => s + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerRunning])

  // Reset timer when sport changes
  useEffect(() => {
    setTimerRunning(false)
    setTimerSecs(0)
    setTimerMode('manual')
    setDynamicMetrics({})
    const def = sport ? SPORT_BY_KEY[sport] : null
    setSessionType(def?.sessionTypes?.[0]?.value ?? 'training')
  }, [sport])

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

    // Duration: use timer if in live mode, else manual input
    const dur = timerMode === 'live'
      ? timerSecs
      : parseInt(durationMin) * 60

    if (!dur || dur <= 0) {
      setErrorMsg('Merci de saisir une durée.')
      return
    }

    let metrics: ActivityMetrics
    if (sport === 'gym') {
      const totalVolume = exercises.reduce((sum, ex) => sum + ex.sets.reduce((ss, st) => ss + st.reps * st.weight_kg, 0), 0)
      metrics = { ...dynamicMetrics, exercises, total_volume_kg: totalVolume, session_type: sessionType }
    } else {
      const def = SPORT_BY_KEY[sport]
      const parsed: Record<string, any> = {}
      for (const field of def?.metrics ?? []) {
        const raw = dynamicMetrics[field.key]
        if (raw === '' || raw == null) continue
        if (field.type === 'number') parsed[field.key] = Number(String(raw).replace(',', '.'))
        else parsed[field.key] = raw
      }
      metrics = { session_type: sessionType, ...parsed }
      // Normalise key distance fields used by existing stats.
      if (parsed.distance_km != null) metrics.distance_m = parsed.distance_km * 1000
    }

    const match = performedDate.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (!match) {
      setErrorMsg('Date invalide. Utilise le format JJ/MM/AAAA.')
      return
    }
    const timeMatch = performedTime.trim().match(/^(\d{1,2}):(\d{2})$/)
    if (!timeMatch || Number(timeMatch[1]) > 23 || Number(timeMatch[2]) > 59) { setErrorMsg('Heure invalide. Utilise HH:MM.'); return }
    const performedAt = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(timeMatch[1]), Number(timeMatch[2]), 0)
    if (Number.isNaN(performedAt.getTime())) {
      setErrorMsg('Date invalide.')
      return
    }

    try {
      setLoading(true)
      await addActivity({
        sport_type: sport, duration_seconds: dur, calories_burned: parseInt(calories) || null, metrics,
        title: title.trim() || null, notes: notes.trim() || null, rpe, mood, visibility,
        performed_at: performedAt.toISOString(), source: 'manual', is_verified: false,
      })
      await sensory('success')
      setTimeout(() => router.back(), 140)
    } catch (e: any) {
      sensory('error')
      setErrorMsg(e.message)
    } finally {
      setLoading(false)
    }
  }, [sport, timerMode, timerSecs, durationMin, calories, distanceKm, avgHeartRate, exercises, sets, matchWon, event, resultValue,
      footballGoals, footballAssists, footballPosition, footballWon,
      tennisSets, tennisWon, tennisAces, hikingElevation, yogaStyle,
      boxingRounds, boxingType, title, notes, rpe, mood, visibility, performedDate, performedTime, sessionType, dynamicMetrics, addActivity, sensory])

  const selectedSport = sport ? SPORT_MAP[sport] : null
  const isEndurance = sport ? ENDURANCE_SPORTS.includes(sport) : false

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* ── Handle + Header ──────────────────── */}
      <View style={styles.header}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          {selectedSport ? (
            <Animated.View entering={FadeInDown.duration(200).springify()} style={styles.headerSportRow}>
              <View style={[styles.headerIconBg, { backgroundColor: selectedSport.color + '18' }]}>
                <selectedSport.Icon size={18} color={selectedSport.color} strokeWidth={2.2} />
              </View>
              <Text style={[styles.headerTitle, { color: selectedSport.color }]}>{selectedSport.label}</Text>
            </Animated.View>
          ) : (
            <Text style={styles.headerTitle}>Nouvelle activité</Text>
          )}
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={20} color={Colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Sport selector ───────────────────── */}
        <View style={styles.sportSectionHeader}>
          <Text style={styles.sportSectionTitle}>Quelle activité ?</Text>
          <Text style={styles.sportSectionSub}>Choisissez votre discipline</Text>
        </View>
        <SportActivityPicker value={sport} onChange={setSport} favorites={profile?.favorite_sports ?? []} />

        {sport && (
          <Animated.View entering={FadeInDown.duration(250).springify()} style={styles.section}>


            {/* ── Informations communes ───────────── */}
            <View style={styles.metaCard}>
              <Field label="Titre de la séance" value={title} onChange={setTitle} placeholder="Ex. Fractionné 5 × 1 km" />
              <View style={styles.row}><Field label="Date (JJ/MM/AAAA)" value={performedDate} onChange={setPerformedDate} placeholder="29/09/2026" /><Field label="Heure (HH:MM)" value={performedTime} onChange={setPerformedTime} placeholder="18:30" /></View>
              <View>
                <Text style={styles.metaLabel}>Difficulté ressentie (RPE)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(v => (
                    <TouchableOpacity key={v} style={[styles.scoreChip, rpe === v && styles.scoreChipActive]} onPress={() => setRpe(v)}>
                      <Text style={[styles.scoreChipText, rpe === v && styles.scoreChipTextActive]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View>
                <Text style={styles.metaLabel}>Ressenti</Text>
                <View style={styles.chipRow}>
                  {['😫','😕','😐','🙂','🔥'].map((emoji, i) => (
                    <TouchableOpacity key={emoji} style={[styles.moodChip, mood === i + 1 && styles.scoreChipActive]} onPress={() => setMood(i + 1)}>
                      <Text style={styles.moodEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View>
                <Text style={styles.metaLabel}>Visibilité</Text>
                <View style={styles.chipRow}>
                  {([['public','Public'],['followers','Abonnés'],['private','Privé']] as const).map(([key,label]) => (
                    <TouchableOpacity key={key} style={[styles.visibilityChip, visibility === key && styles.scoreChipActive]} onPress={() => setVisibility(key)}>
                      <Text style={[styles.scoreChipText, visibility === key && styles.scoreChipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TextInput value={notes} onChangeText={setNotes} placeholder="Notes, sensations, contexte..." placeholderTextColor={Colors.textTertiary} multiline style={styles.notesInput} />
              <Text style={styles.sourceHint}>Source : saisie manuelle · non vérifiée</Text>
            </View>

            {/* ── Chrono ou durée manuelle ──────── */}
            {isEndurance ? (
              <ChronoCard
                mode={timerMode}
                running={timerRunning}
                secs={timerSecs}
                manualMin={durationMin}
                onModeChange={setTimerMode}
                onToggleRunning={() => setTimerRunning(r => !r)}
                onReset={() => { setTimerRunning(false); setTimerSecs(0) }}
                onManualChange={setDurationMin}
              />
            ) : (
              <View style={styles.row}>
                <Field label="Durée (min)" value={durationMin} onChange={setDurationMin} keyboardType="numeric" placeholder="30" icon={<Clock size={13} color={Colors.textTertiary} />} />
                <Field label="Calories" value={calories} onChange={setCalories} keyboardType="numeric" placeholder="300" icon={<Zap size={13} color={Colors.textTertiary} />} />
              </View>
            )}

            {/* Calories standalone pour endurance */}
            {isEndurance && (
              <Field label="Calories brûlées" value={calories} onChange={setCalories} keyboardType="numeric" placeholder="400" icon={<Zap size={13} color={Colors.textTertiary} />} />
            )}

            {/* ── Formulaire intelligent par discipline ───── */}
            {sport === 'gym' ? (
              <>
                <DynamicSportFields sport={{...SPORT_BY_KEY[sport], metrics: SPORT_BY_KEY[sport].metrics.filter(f => f.key !== 'total_volume_kg')}} sessionType={sessionType} onSessionType={setSessionType} values={dynamicMetrics} onChange={(k,v)=>setDynamicMetrics(p=>({...p,[k]:v}))} />
                <GymFields exercises={exercises} onChange={setExercises} t={t} />
              </>
            ) : (
              <DynamicSportFields sport={SPORT_BY_KEY[sport]} sessionType={sessionType} onSessionType={setSessionType} values={dynamicMetrics} onChange={(k,v)=>setDynamicMetrics(p=>({...p,[k]:v}))} />
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* ── Error banner ─────────────────────── */}
      {errorMsg && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </Animated.View>
      )}

      {/* ── Footer CTA ───────────────────────── */}
      <View style={styles.footer}>
        <Button label={t.common.cancel} variant="ghost" style={styles.footerBtn} onPress={() => router.back()} />
        <Button label={t.common.save} variant="primary" style={styles.footerBtn} onPress={handleSave} loading={loading} disabled={!sport} />
      </View>
    </KeyboardAvoidingView>
  )
}

// ── ChronoCard ────────────────────────────────────────────────

interface ChronoCardProps {
  mode: 'manual' | 'live'
  running: boolean
  secs: number
  manualMin: string
  onModeChange: (m: 'manual' | 'live') => void
  onToggleRunning: () => void
  onReset: () => void
  onManualChange: (v: string) => void
}

function ChronoCard({ mode, running, secs, manualMin, onModeChange, onToggleRunning, onReset, onManualChange }: ChronoCardProps) {
  return (
    <View style={chronoStyles.card}>
      {/* Mode toggle */}
      <View style={chronoStyles.modeRow}>
        {(['manual', 'live'] as const).map(m => (
          <TouchableOpacity
            key={m}
            style={[chronoStyles.modeBtn, mode === m && chronoStyles.modeBtnActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onModeChange(m) }}
            activeOpacity={0.8}
          >
            {m === 'live' ? (
              <Timer size={13} color={mode === m ? Colors.electric : Colors.textTertiary} strokeWidth={2} />
            ) : (
              <Clock size={13} color={mode === m ? Colors.electric : Colors.textTertiary} strokeWidth={2} />
            )}
            <Text style={[chronoStyles.modeBtnLabel, mode === m && chronoStyles.modeBtnLabelActive]}>
              {m === 'manual' ? 'Manuel' : 'Chrono'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'manual' ? (
        <View style={chronoStyles.manualRow}>
          <Clock size={16} color={Colors.textTertiary} strokeWidth={1.8} />
          <TextInput
            style={chronoStyles.manualInput}
            value={manualMin}
            onChangeText={onManualChange}
            keyboardType="numeric"
            placeholder="45"
            placeholderTextColor={Colors.textTertiary}
          />
          <Text style={chronoStyles.manualUnit}>min</Text>
        </View>
      ) : (
        <View style={chronoStyles.liveWrap}>
          <Text style={[chronoStyles.timerDisplay, running && chronoStyles.timerDisplayActive]}>
            {formatTimer(secs)}
          </Text>
          <View style={chronoStyles.timerBtns}>
            <TouchableOpacity
              style={[chronoStyles.timerBtn, running ? chronoStyles.timerBtnPause : chronoStyles.timerBtnPlay]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onToggleRunning() }}
              activeOpacity={0.85}
            >
              {running ? (
                <Pause size={22} color="#fff" fill="#fff" strokeWidth={0} />
              ) : (
                <Play size={22} color="#fff" fill="#fff" strokeWidth={0} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={chronoStyles.timerBtnReset}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onReset() }}
              activeOpacity={0.8}
            >
              <RotateCcw size={18} color={Colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          {secs > 0 && (
            <Text style={chronoStyles.timerHint}>
              {Math.floor(secs / 60)} min sera enregistré
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

// ── Sub-forms ─────────────────────────────────────────────────

function EnduranceFields({ distanceKm, onDistanceChange, heartRate, onHeartRateChange }: any) {
  return (
    <View style={styles.row}>
      <Field label="Distance (km)" value={distanceKm} onChange={onDistanceChange} keyboardType="decimal-pad" placeholder="10.5" icon={<MapPin size={13} color={Colors.textTertiary} />} />
      <Field label="FC moy. (bpm)" value={heartRate} onChange={onHeartRateChange} keyboardType="numeric" placeholder="155" icon={<Heart size={13} color={Colors.textTertiary} />} />
    </View>
  )
}

function HikingFields({ distanceKm, onDistanceChange, elevation, onElevationChange, heartRate, onHeartRateChange }: any) {
  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <Field label="Distance (km)" value={distanceKm} onChange={onDistanceChange} keyboardType="decimal-pad" placeholder="15.0" icon={<MapPin size={13} color={Colors.textTertiary} />} />
        <Field label="Dénivelé (m)" value={elevation} onChange={onElevationChange} keyboardType="numeric" placeholder="800" icon={<Mountain size={13} color={Colors.textTertiary} />} />
      </View>
      <Field label="FC moy. (bpm)" value={heartRate} onChange={onHeartRateChange} keyboardType="numeric" placeholder="130" icon={<Heart size={13} color={Colors.textTertiary} />} />
    </View>
  )
}

// ── Gym (Hevy-style) ──────────────────────────────────────────

const GYM_EXERCISES = EXERCISE_DB.gym.map(e => e.name)

function GymExerciseRow({ exercise, onNameChange, onAddSet, onCopyLastSet, onDeleteSet, onUpdateSet, onDelete, t }: {
  exercise: GymExercise
  onNameChange: (n: string) => void
  onAddSet: () => void
  onCopyLastSet: () => void
  onDeleteSet: (si:number) => void
  onUpdateSet: (si: number, field: 'reps' | 'weight_kg' | 'rir' | 'rest_seconds', v: string) => void
  onDelete: () => void
  t: any
}) {
  const [suggestions, setSuggestions] = useState<string[]>([])

  const handleNameChange = (v: string) => {
    onNameChange(v)
    setSuggestions(v.length >= 2 ? GYM_EXERCISES.filter(n => n.toLowerCase().includes(v.toLowerCase())).slice(0, 5) : [])
  }

  const volume = exercise.sets.reduce((s, st) => s + st.reps * st.weight_kg, 0)

  return (
    <View style={gymStyles.card}>
      {/* Header row */}
      <View style={gymStyles.cardHeader}>
        <View style={{ flex: 1 }}>
          <TextInput
            style={gymStyles.exerciseName}
            value={exercise.name}
            onChangeText={handleNameChange}
            placeholder="Ex : Développé couché, Squat…"
            placeholderTextColor={Colors.textTertiary}
          />
          {volume > 0 && (
            <Text style={gymStyles.volumeInline}>{volume.toFixed(0)} kg de volume</Text>
          )}
        </View>
        <TouchableOpacity onPress={onDelete} style={gymStyles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Trash2 size={15} color={Colors.error} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Autocomplete */}
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map(s => (
            <TouchableOpacity key={s} style={styles.suggestionItem} onPress={() => { onNameChange(s); setSuggestions([]); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }} activeOpacity={0.75}>
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Sets header */}
      <View style={gymStyles.setsHeader}>
        <View style={{ width: 32 }} />
        <Text style={[gymStyles.setsHeaderText, { flex: 1 }]}>Reps</Text>
        <Text style={[gymStyles.setsHeaderText, { flex: 1 }]}>Kg</Text>
        <Text style={[gymStyles.setsHeaderText, { flex: 1 }]}>RIR</Text>
        <Text style={[gymStyles.setsHeaderText, { flex: 1 }]}>Repos</Text>
        <View style={{ width: 24 }} />
      </View>

      {exercise.sets.map((s, si) => (
        <View key={si} style={gymStyles.setRow}>
          <View style={[gymStyles.setBadge, { backgroundColor: si === 0 ? '#0055FF' : si === 1 ? '#7C3AED' : si === 2 ? '#EC4899' : Colors.textTertiary }]}>
            <Text style={gymStyles.setBadgeText}>{si + 1}</Text>
          </View>
          <SmallField value={s.reps > 0 ? String(s.reps) : ''} onChange={v => onUpdateSet(si, 'reps', v)} placeholder="—" />
          <SmallField value={s.weight_kg > 0 ? String(s.weight_kg) : ''} onChange={v => onUpdateSet(si, 'weight_kg', v)} placeholder="—" />
          <SmallField value={s.rir != null ? String(s.rir) : ''} onChange={v => onUpdateSet(si, 'rir', v)} placeholder="RIR" />
          <SmallField value={s.rest_seconds ? String(s.rest_seconds) : ''} onChange={v => onUpdateSet(si, 'rest_seconds', v)} placeholder="s" />
          <TouchableOpacity onPress={() => onDeleteSet(si)} hitSlop={6}><Trash2 size={15} color={Colors.textTertiary}/></TouchableOpacity>
        </View>
      ))}

      {/* Add set row */}
      <View style={gymStyles.addSetRow}>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onAddSet() }} style={gymStyles.addSetBtn}>
          <Plus size={14} color={Colors.electric} strokeWidth={2.5} />
          <Text style={gymStyles.addSetText}>{t.activity.addSet}</Text>
        </TouchableOpacity>
        {exercise.sets.length > 0 && (
          <TouchableOpacity onPress={onCopyLastSet} style={gymStyles.copyBtn}>
            <Copy size={13} color={Colors.textTertiary} strokeWidth={2} />
            <Text style={gymStyles.copyText}>Copier</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

function GymFields({ exercises, onChange, t }: { exercises: GymExercise[]; onChange: (e: GymExercise[]) => void; t: any }) {
  const addExercise = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange([...exercises, { name: '', sets: [{ reps: 0, weight_kg: 0, rir: null, rest_seconds: 90 }] }])
  }

  const updateExerciseName = (idx: number, name: string) => {
    const next = [...exercises]; next[idx] = { ...next[idx], name }; onChange(next)
  }

  const deleteExercise = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange(exercises.filter((_, i) => i !== idx))
  }

  const addSet = (exIdx: number) => {
    const next = [...exercises]
    next[exIdx] = { ...next[exIdx], sets: [...next[exIdx].sets, { reps: 0, weight_kg: 0, rir: null, rest_seconds: 90 }] }
    onChange(next)
  }

  const updateSet = (exIdx: number, setIdx: number, field: 'reps' | 'weight_kg' | 'rir' | 'rest_seconds', value: string) => {
    const next = [...exercises]
    const sets = [...next[exIdx].sets]
    sets[setIdx] = { ...sets[setIdx], [field]: parseFloat(value) || 0 }
    next[exIdx] = { ...next[exIdx], sets }
    onChange(next)
  }

  const copyLastSet = (exIdx: number) => {
    const next = [...exercises]
    const last = next[exIdx]?.sets[next[exIdx].sets.length - 1]
    if (!last) return
    next[exIdx] = { ...next[exIdx], sets: [...next[exIdx].sets, { ...last }] }
    onChange(next)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const deleteSet = (exIdx:number,setIdx:number) => {
    const next=[...exercises]
    if (!next[exIdx] || next[exIdx].sets.length <= 1) return
    next[exIdx]={...next[exIdx],sets:next[exIdx].sets.filter((_,i)=>i!==setIdx)}
    onChange(next)
  }

  const totalVolume = exercises.reduce((sum, ex) => sum + ex.sets.reduce((s, st) => s + st.reps * st.weight_kg, 0), 0)

  return (
    <View style={styles.section}>
      {totalVolume > 0 && (
        <View style={gymStyles.volumeSummary}>
          <Dumbbell size={16} color={Colors.electric} strokeWidth={2} />
          <Text style={gymStyles.volumeSummaryLabel}>Volume total</Text>
          <Text style={gymStyles.volumeSummaryValue}>{totalVolume.toFixed(0)} kg</Text>
        </View>
      )}

      <Text style={{fontSize:FontSize.xs,color:Colors.textSecondary,lineHeight:18}}>RIR = répétitions qu'il te restait en réserve · Repos = secondes entre les séries.</Text>

      {exercises.map((ex, ei) => (
        <GymExerciseRow
          key={ei}
          exercise={ex}
          onNameChange={v => updateExerciseName(ei, v)}
          onAddSet={() => addSet(ei)}
          onCopyLastSet={() => copyLastSet(ei)}
          onDeleteSet={(si) => deleteSet(ei, si)}
          onUpdateSet={(si, field, v) => updateSet(ei, si, field, v)}
          onDelete={() => deleteExercise(ei)}
          t={t}
        />
      ))}

      <TouchableOpacity style={gymStyles.addExerciseBtn} onPress={addExercise} activeOpacity={0.8}>
        <Plus size={16} color={Colors.electric} strokeWidth={2.5} />
        <Text style={gymStyles.addExerciseText}>{t.activity.addExercise}</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Score sports ──────────────────────────────────────────────

function WinLossToggle({ won, onWonChange, t }: any) {
  return (
    <View style={styles.row}>
      {([true, false] as const).map(val => (
        <TouchableOpacity
          key={String(val)}
          style={[scoreStyles.pill, won === val && scoreStyles.pillActive, won === val && (val ? scoreStyles.pillWin : scoreStyles.pillLoss)]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onWonChange(val) }}
          activeOpacity={0.8}
        >
          <Text style={[scoreStyles.pillText, won === val && scoreStyles.pillTextActive]}>
            {val ? `🏆 ${t.activity.won}` : `💪 ${t.activity.lost}`}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

function ScoreRow({ setIdx, playerVal, opponentVal, onPlayerChange, onOpponentChange, onDelete }: {
  setIdx: number; playerVal: string; opponentVal: string
  onPlayerChange: (v: string) => void; onOpponentChange: (v: string) => void; onDelete: () => void
}) {
  return (
    <View style={scoreStyles.setRow}>
      <View style={scoreStyles.setLabel}>
        <Text style={scoreStyles.setLabelText}>Set {setIdx + 1}</Text>
      </View>
      <TextInput style={scoreStyles.scoreInput} value={playerVal} onChangeText={onPlayerChange} keyboardType="numeric" placeholder="Moi" placeholderTextColor={Colors.textTertiary} textAlign="center" />
      <Text style={scoreStyles.dash}>–</Text>
      <TextInput style={scoreStyles.scoreInput} value={opponentVal} onChangeText={onOpponentChange} keyboardType="numeric" placeholder="Adv" placeholderTextColor={Colors.textTertiary} textAlign="center" />
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <X size={14} color={Colors.textTertiary} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  )
}

function BadmintonFields({ sets, onSetsChange, won, onWonChange, t }: any) {
  const addSet = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSetsChange([...sets, { player_score: 0, opponent_score: 0 }]) }
  const delSet = (i: number) => { if (sets.length > 1) onSetsChange(sets.filter((_: any, idx: number) => idx !== i)) }
  const update = (i: number, field: 'player_score' | 'opponent_score', v: string) => {
    const next = [...sets]; next[i] = { ...next[i], [field]: parseInt(v) || 0 }; onSetsChange(next)
  }
  return (
    <View style={styles.section}>
      <SectionLabel label="Sets" />
      {sets.map((s: BadmintonSet, i: number) => (
        <ScoreRow key={i} setIdx={i} playerVal={s.player_score > 0 ? String(s.player_score) : ''} opponentVal={s.opponent_score > 0 ? String(s.opponent_score) : ''} onPlayerChange={v => update(i, 'player_score', v)} onOpponentChange={v => update(i, 'opponent_score', v)} onDelete={() => delSet(i)} />
      ))}
      <TouchableOpacity style={scoreStyles.addSetBtn} onPress={addSet} activeOpacity={0.8}>
        <Plus size={14} color={Colors.electric} strokeWidth={2.5} /><Text style={scoreStyles.addSetText}>Ajouter un set</Text>
      </TouchableOpacity>
      <SectionLabel label="Résultat du match" />
      <WinLossToggle won={won} onWonChange={onWonChange} t={t} />
    </View>
  )
}

function TennisFields({ sets, onSetsChange, won, onWonChange, aces, onAcesChange, t }: any) {
  const addSet = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSetsChange([...sets, { player_games: 0, opponent_games: 0 }]) }
  const delSet = (i: number) => { if (sets.length > 1) onSetsChange(sets.filter((_: any, idx: number) => idx !== i)) }
  const update = (i: number, field: 'player_games' | 'opponent_games', v: string) => {
    const next = [...sets]; next[i] = { ...next[i], [field]: parseInt(v) || 0 }; onSetsChange(next)
  }
  return (
    <View style={styles.section}>
      <SectionLabel label="Sets" />
      {sets.map((s: TennisSet, i: number) => (
        <ScoreRow key={i} setIdx={i} playerVal={s.player_games > 0 ? String(s.player_games) : ''} opponentVal={s.opponent_games > 0 ? String(s.opponent_games) : ''} onPlayerChange={v => update(i, 'player_games', v)} onOpponentChange={v => update(i, 'opponent_games', v)} onDelete={() => delSet(i)} />
      ))}
      <TouchableOpacity style={scoreStyles.addSetBtn} onPress={addSet} activeOpacity={0.8}>
        <Plus size={14} color={Colors.electric} strokeWidth={2.5} /><Text style={scoreStyles.addSetText}>Ajouter un set</Text>
      </TouchableOpacity>
      <Field label="Aces" value={aces} onChange={onAcesChange} keyboardType="numeric" placeholder="3" icon={<Trophy size={13} color={Colors.textTertiary} />} />
      <SectionLabel label="Résultat" />
      <WinLossToggle won={won} onWonChange={onWonChange} t={t} />
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
        <Field label="Buts" value={goals} onChange={onGoalsChange} keyboardType="numeric" placeholder="0" icon={<CircleDot size={13} color={Colors.textTertiary} />} />
        <Field label="Passes déc." value={assists} onChange={onAssistsChange} keyboardType="numeric" placeholder="0" icon={<TrendingUp size={13} color={Colors.textTertiary} />} />
      </View>
      <SectionLabel label="Position" />
      <View style={styles.row}>
        {FOOTBALL_POSITIONS.map(p => (
          <TouchableOpacity key={p.key} style={[styles.toggleBtn, position === p.key && styles.toggleBtnActive]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPositionChange(p.key) }}>
            <Text style={[styles.toggleText, position === p.key && styles.toggleTextActive, { fontSize: FontSize.xs }]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <SectionLabel label="Résultat" />
      <WinLossToggle won={won} onWonChange={onWonChange} t={t} />
    </View>
  )
}

function AthleticsFields({ event, onEventChange, result, onResultChange, t }: any) {
  return (
    <View style={styles.row}>
      <Field label="Épreuve" value={event} onChange={onEventChange} placeholder="100m, Saut…" icon={<Target size={13} color={Colors.textTertiary} />} />
      <Field label="Résultat" value={result} onChange={onResultChange} keyboardType="decimal-pad" placeholder="9.85" icon={<Trophy size={13} color={Colors.textTertiary} />} />
    </View>
  )
}

const YOGA_STYLES = [
  { key: 'hatha', label: 'Hatha' }, { key: 'vinyasa', label: 'Vinyasa' },
  { key: 'yin', label: 'Yin' }, { key: 'ashtanga', label: 'Ashtanga' },
  { key: 'power', label: 'Power' }, { key: 'other', label: 'Autre' },
]

function YogaFields({ yogaStyle, onStyleChange, heartRate, onHeartRateChange }: any) {
  return (
    <View style={styles.section}>
      <SectionLabel label="Style" />
      <View style={[styles.row, { flexWrap: 'wrap' }]}>
        {YOGA_STYLES.map(s => (
          <TouchableOpacity key={s.key} style={[styles.toggleBtn, yogaStyle === s.key && styles.toggleBtnActive, { flex: 0, paddingHorizontal: 14 }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onStyleChange(s.key) }}>
            <Text style={[styles.toggleText, yogaStyle === s.key && styles.toggleTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Field label="FC moy. (bpm)" value={heartRate} onChange={onHeartRateChange} keyboardType="numeric" placeholder="95" icon={<Heart size={13} color={Colors.textTertiary} />} />
    </View>
  )
}

const BOXING_TYPES = [
  { key: 'bag', label: 'Sac' }, { key: 'pad_work', label: 'Pattes' },
  { key: 'sparring', label: 'Sparring' }, { key: 'competition', label: 'Compét.' },
]

function BoxingFields({ rounds, onRoundsChange, boutType, onTypeChange, heartRate, onHeartRateChange, t }: any) {
  return (
    <View style={styles.section}>
      <SectionLabel label="Type de séance" />
      <View style={styles.row}>
        {BOXING_TYPES.map(bt => (
          <TouchableOpacity key={bt.key} style={[styles.toggleBtn, boutType === bt.key && styles.toggleBtnActive]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onTypeChange(bt.key) }}>
            <Text style={[styles.toggleText, boutType === bt.key && styles.toggleTextActive, { fontSize: FontSize.sm }]}>{bt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.row}>
        <Field label="Rounds" value={rounds} onChange={onRoundsChange} keyboardType="numeric" placeholder="6" icon={<Swords size={13} color={Colors.textTertiary} />} />
        <Field label="FC moy. (bpm)" value={heartRate} onChange={onHeartRateChange} keyboardType="numeric" placeholder="155" icon={<Heart size={13} color={Colors.textTertiary} />} />
      </View>
    </View>
  )
}

// ── Shared atoms ──────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <View style={fieldStyles.sectionLabelRow}>
      <View style={fieldStyles.sectionLabelDot} />
      <Text style={fieldStyles.sectionLabel}>{label}</Text>
    </View>
  )
}

function Field({ label, value, onChange, keyboardType = 'default' as any, placeholder, icon }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={[fieldStyles.card, focused && fieldStyles.cardFocused]}>
      <View style={fieldStyles.labelRow}>
        {icon}
        <Text style={fieldStyles.label}>{label}</Text>
      </View>
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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
      textAlign="center"
    />
  )
}

function SportCard({ sport, active, onPress }: { sport: SportConfig; active: boolean; onPress: () => void }) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <TouchableOpacity
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress() }}
      onPressIn={() => { scale.value = withSpring(0.94, { damping: 12, stiffness: 500 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 300 }) }}
      activeOpacity={1}
      style={cardStyles.wrap}
    >
      <Animated.View style={[
        cardStyles.card,
        active ? cardStyles.cardActive : cardStyles.cardInactive,
        animStyle,
      ]}>
        <View style={[
          cardStyles.iconCircle,
          active ? cardStyles.iconCircleActive : { backgroundColor: sport.color + '18' },
        ]}>
          <sport.Icon size={26} color={active ? '#FFFFFF' : sport.color} strokeWidth={2} />
        </View>
        <Text
          style={[cardStyles.label, active ? cardStyles.labelActive : cardStyles.labelDefault]}
          numberOfLines={1}
        >
          {sport.label}
        </Text>
      </Animated.View>
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
  header: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadow.sm,
  },
  handle: {
    width: 44,
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  headerSportRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 120,
    gap: Spacing.md,
  },
  sportSectionHeader: {
    gap: 3,
  },
  sportSectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  sportSectionSub: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textTertiary,
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
  toggleBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgAlt,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtnActive: {
    backgroundColor: Colors.electric,
    borderColor: Colors.electric,
  },
  toggleText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.textInverse,
  },
  suggestions: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  suggestionItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  suggestionText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.bgCard,
  },
  footerBtn: { flex: 1 },
  metaCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight },
  metaLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: 7 },
  chipRow: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  scoreChip: { minWidth: 32, height: 32, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.borderLight },
  scoreChipActive: { backgroundColor: Colors.electricDim, borderColor: Colors.electric },
  scoreChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  scoreChipTextActive: { color: Colors.electric, fontWeight: FontWeight.bold },
  moodChip: { width: 42, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.borderLight },
  moodEmoji: { fontSize: 20 },
  visibilityChip: { flex: 1, minHeight: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.borderLight, paddingHorizontal: 8 },
  notesInput: { minHeight: 88, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 12, color: Colors.textPrimary, backgroundColor: Colors.bg, textAlignVertical: 'top' },
  sourceHint: { fontSize: FontSize.xs, color: Colors.textTertiary },
  errorBanner: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.error + '14',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: Colors.error + '40',
    borderLeftColor: Colors.error,
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
  card: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    ...Shadow.sm,
  },
  cardFocused: {
    borderColor: Colors.electric,
    borderWidth: 1.5,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    padding: 0,
    minHeight: 32,
  },
  small: {
    flex: 1,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sectionLabelDot: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: Colors.electric,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
})

const cardStyles = StyleSheet.create({
  wrap: {
    width: '31.5%',
    flexGrow: 1,
  },
  card: {
    borderRadius: Radius.lg,
    padding: 14,
    paddingBottom: 14,
    gap: 10,
    alignItems: 'flex-start',
    minHeight: 100,
    ...Shadow.sm,
  },
  cardActive: {
    backgroundColor: Colors.electric,
  },
  cardInactive: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  label: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.1,
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelDefault: {
    color: Colors.textPrimary,
  },
})

const chronoStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: Radius.sm,
  },
  modeBtnActive: {
    backgroundColor: Colors.bgCard,
    ...Shadow.sm,
  },
  modeBtnLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textTertiary,
  },
  modeBtnLabelActive: {
    color: Colors.electric,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  manualInput: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  manualUnit: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    color: Colors.textTertiary,
    width: 32,
  },
  liveWrap: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  timerDisplay: {
    fontSize: 52,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'] as any,
  },
  timerDisplayActive: {
    color: Colors.electric,
  },
  timerBtns: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  timerBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  timerBtnPlay: {
    backgroundColor: Colors.electric,
  },
  timerBtnPause: {
    backgroundColor: Colors.warning,
  },
  timerBtnReset: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timerHint: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
})

const gymStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  exerciseName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  volumeInline: {
    fontSize: FontSize.xs,
    color: Colors.electric,
    fontWeight: FontWeight.semibold,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.error + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.bgAlt,
  },
  setsHeaderText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  setBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setBadgeText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  addSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addSetText: {
    fontSize: FontSize.sm,
    color: Colors.electric,
    fontWeight: FontWeight.semibold,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgAlt,
  },
  copyText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
  volumeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.electricDim,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.electric + '30',
  },
  volumeSummaryLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.electric,
    fontWeight: FontWeight.semibold,
  },
  volumeSummaryValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.electric,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.electricDim,
    borderWidth: 1.5,
    borderColor: Colors.electric + '40',
    borderStyle: 'dashed',
  },
  addExerciseText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.electric,
  },
})

const scoreStyles = StyleSheet.create({
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  setLabel: {
    width: 48,
  },
  setLabelText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  scoreInput: {
    flex: 1,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dash: {
    fontSize: FontSize.lg,
    color: Colors.textTertiary,
    fontWeight: FontWeight.bold,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
  },
  addSetText: {
    fontSize: FontSize.sm,
    color: Colors.electric,
    fontWeight: FontWeight.semibold,
  },
  pill: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.md,
    alignItems: 'center',
    backgroundColor: Colors.bgAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  pillActive: {
    borderWidth: 1.5,
  },
  pillWin: {
    backgroundColor: Colors.success + '14',
    borderColor: Colors.success,
  },
  pillLoss: {
    backgroundColor: Colors.bgAlt,
    borderColor: Colors.textTertiary,
  },
  pillText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  pillTextActive: {
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
})
