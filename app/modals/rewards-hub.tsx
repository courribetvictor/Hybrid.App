import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { ChevronLeft, Coins, Gift, Zap, Clock3, ShoppingBag, Shirt } from 'lucide-react-native'
import { SensoryPressable } from '@/components/v6/SensoryPressable'
import { RewardBurst } from '@/components/v5/RewardBurst'
import { useV7Economy } from '@/hooks/v7/useV7Economy'
import { V7_BOOSTS, V7_CHEST_TIERS, V7_DAILY_REWARDS, V7_ITEM_BY_ID, V7_DESTINATIONS } from '@/constants/v7'
import { useSession } from '@/hooks/useProfile'
import { useActivities } from '@/hooks/useActivities'
import { Colors, FontWeight, Shadow } from '@/constants/theme'

export default function RewardsHub() {
  const { state, level, claimDaily, activateBoost, openChest, unlockDestination } = useV7Economy()
  const { userId } = useSession()
  const { activities } = useActivities(userId ?? undefined, 3650)
  const [burst, setBurst] = useState<{ title: string; sub?: string } | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const claimed = state.lastDaily === today
  const cycleDay = ((Math.max(1, state.dailyStreak) - 1) % 7) + 1
  const boostLeft = state.boost && state.boost.endsAt > Date.now()
    ? Math.ceil((state.boost.endsAt - Date.now()) / 60000)
    : 0

  const handleOpenChest = (tier: 'bronze' | 'silver' | 'gold') => {
    const out = openChest(tier)
    if (!out) return
    const item = out.item ? V7_ITEM_BY_ID[out.item] : undefined
    setBurst({
      title: item ? `${item.name} débloqué !` : `+${out.credits} crédits`,
      sub: item ? `+${out.credits} crédits · ${item.rarity}` : 'Capsule ouverte',
    })
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0B1226', '#1E1B4B', '#4C1D95']} style={s.hero}>
        <View style={s.nav}>
          <SensoryPressable event="selection" onPress={() => router.back()} style={s.back}>
            <ChevronLeft size={21} color="#fff" />
          </SensoryPressable>
          <View>
            <Text style={s.kicker}>REWARDS LAB</Text>
            <Text style={s.title}>Progression V7</Text>
          </View>
          <View style={s.wallet}>
            <Coins size={15} color="#FBBF24" />
            <Text style={s.walletText}>{state.credits}</Text>
          </View>
        </View>

        <View style={s.levelCard}>
          <Text style={s.bigLevel}>{level}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.levelLabel}>NIVEAU IDENTITÉ</Text>
            <Text style={s.levelSub}>Gagne des crédits avec tes vraies séances, pas avec du spam.</Text>
          </View>
        </View>

        {boostLeft > 0 && (
          <View style={s.activeBoost}>
            <Zap size={15} color="#FDE047" />
            <Text style={s.activeBoostText}>
              Boost actif · {state.boost?.multiplier}× {state.boost?.kind === 'xp' ? 'XP' : 'crédits'} · {boostLeft} min
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Text style={s.section}>RÉCOMPENSE QUOTIDIENNE</Text>
        <View style={s.dailyRow}>
          {V7_DAILY_REWARDS.map((value, i) => (
            <View
              key={i}
              style={[
                s.day,
                i + 1 === cycleDay && !claimed && s.dayNow,
                i + 1 <= cycleDay && claimed && s.dayDone,
              ]}
            >
              <Text style={s.dayNum}>J{i + 1}</Text>
              <Coins size={13} color={i === 6 ? '#F59E0B' : '#64748B'} />
              <Text style={s.dayValue}>{value}</Text>
            </View>
          ))}
        </View>

        <SensoryPressable
          event={claimed ? 'selection' : 'coin'}
          style={[s.claim, claimed && s.claimed]}
          onPress={() => {
            if (claimed) return
            const reward = claimDaily()
            setBurst({
              title: `+${reward} crédits`,
              sub: cycleDay === 6 ? 'Série de 7 jours : Capsule Bronze bonus !' : 'Récompense quotidienne',
            })
          }}
        >
          <Gift size={18} color={claimed ? Colors.textTertiary : '#fff'} />
          <Text style={[s.claimText, claimed && { color: Colors.textTertiary }]}>
            {claimed ? 'Déjà récupérée aujourd’hui' : 'Récupérer ma récompense'}
          </Text>
        </SensoryPressable>

        <View style={s.heading}>
          <Text style={s.section}>CAPSULES</Text>
          <Text style={s.caption}>Toujours gratuites ici : gagnées par progression et objectifs.</Text>
        </View>
        {V7_CHEST_TIERS.map(c => (
          <View key={c.id} style={s.chest}>
            <View style={[s.chestIcon, { backgroundColor: c.color + '20' }]}>
              <Gift size={22} color={c.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{c.name}</Text>
              <Text style={s.cardSub}>{c.minCoins}–{c.maxCoins} crédits · chance d’objet</Text>
            </View>
            <SensoryPressable
              event="chest"
              disabled={!state.chests[c.id]}
              onPress={() => handleOpenChest(c.id)}
              style={[s.openBtn, !state.chests[c.id] && { opacity: 0.4 }]}
            >
              <Text style={s.openText}>{state.chests[c.id]} · Ouvrir</Text>
            </SensoryPressable>
          </View>
        ))}

        <View style={s.heading}>
          <Text style={s.section}>BOOSTS D’EFFORT</Text>
          <Text style={s.caption}>Ils multiplient tes récompenses, jamais tes performances.</Text>
        </View>
        {V7_BOOSTS.map(b => (
          <View key={b.id} style={s.boost}>
            <View style={s.boostIcon}><Text style={{ fontSize: 24 }}>{b.icon}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{b.name}</Text>
              <Text style={s.cardSub}>{b.description}</Text>
              <View style={s.cost}>
                <Coins size={11} color="#B45309" />
                <Text style={s.costText}>{b.cost}</Text>
              </View>
            </View>
            <SensoryPressable
              event="boost"
              onPress={() => {
                const kind = b.id.includes('coins') ? 'coins' : 'xp'
                if (activateBoost(kind, b.multiplier, b.minutes, b.cost)) {
                  setBurst({ title: `${b.name} activé`, sub: b.description })
                } else {
                  setBurst({ title: 'Crédits insuffisants', sub: 'Bouge, complète des quêtes ou reviens demain.' })
                }
              }}
              style={s.buyBtn}
            >
              <Zap size={14} color="#fff" />
              <Text style={s.buyText}>Activer</Text>
            </SensoryPressable>
          </View>
        ))}

        <View style={s.heading}>
          <Text style={s.section}>EXPÉDITIONS HYBRID</Text>
          <Text style={s.caption}>Débloque des destinations par tes séances réelles et active des boosts temporaires.</Text>
        </View>
        {V7_DESTINATIONS.map(d => {
          const unlocked = activities.length >= d.sessions
          const claimedDest = state.claimedGoals.includes(`destination:${d.id}`)
          return (
            <View key={d.id} style={s.expedition}>
              <View style={[s.destination, { backgroundColor: d.color + '18' }]}>
                <Text style={s.destinationEmoji}>{d.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{d.name}</Text>
                <Text style={s.cardSub}>{d.tagline}</Text>
                <Text style={s.destinationMeta}>
                  {Math.min(activities.length, d.sessions)}/{d.sessions} séances · {d.multiplier}× XP · {d.hours} h
                </Text>
              </View>
              <SensoryPressable
                event={claimedDest ? 'selection' : 'boost'}
                disabled={!unlocked || claimedDest}
                onPress={() => {
                  if (unlockDestination(d.id, d.multiplier, d.hours, d.chest)) {
                    setBurst({ title: 'Destination débloquée', sub: `${d.name} · ${d.multiplier}× XP pendant ${d.hours} h` })
                  }
                }}
                style={[s.destBtn, (!unlocked || claimedDest) && { opacity: 0.4 }]}
              >
                <Text style={s.destBtnText}>{claimedDest ? 'Terminé' : unlocked ? 'Partir' : 'Verrouillé'}</Text>
              </SensoryPressable>
            </View>
          )
        })}

        <SensoryPressable event="selection" onPress={() => router.push('/modals/avatar-studio' as any)} style={s.studio}>
          <ShoppingBag size={19} color={Colors.electric} />
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Boutique & dressing</Text>
            <Text style={s.cardSub}>{state.owned.length} objets possédés · personnalise ton athlète</Text>
          </View>
          <Shirt size={20} color={Colors.electric} />
        </SensoryPressable>

        <View style={s.ethics}>
          <Clock3 size={16} color="#0F766E" />
          <Text style={s.ethicsText}>
            Pas de “perte de streak” punitive à minuit et pas d’achat aléatoire en argent réel. Les capsules V7 sont gagnées dans l’app.
          </Text>
        </View>
      </ScrollView>

      <RewardBurst visible={!!burst} title={burst?.title} subtitle={burst?.sub} onClose={() => setBurst(null)} />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  hero: { paddingTop: 54, paddingHorizontal: 18, paddingBottom: 20 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 8, color: '#C4B5FD', fontWeight: FontWeight.extrabold, letterSpacing: 1.5, textAlign: 'center' },
  title: { fontSize: 18, color: '#fff', fontWeight: FontWeight.extrabold },
  wallet: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(251,191,36,.12)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99 },
  walletText: { color: '#FBBF24', fontWeight: FontWeight.extrabold },
  levelCard: { flexDirection: 'row', gap: 14, alignItems: 'center', marginTop: 23 },
  bigLevel: { fontSize: 52, color: '#fff', fontWeight: FontWeight.extrabold, lineHeight: 55 },
  levelLabel: { fontSize: 10, color: '#A5B4FC', fontWeight: FontWeight.extrabold, letterSpacing: 1.2 },
  levelSub: { fontSize: 12, color: '#D8E1FF', lineHeight: 17, marginTop: 4 },
  activeBoost: { marginTop: 13, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(253,224,71,.12)', padding: 9, borderRadius: 12 },
  activeBoostText: { color: '#FDE047', fontSize: 11, fontWeight: FontWeight.bold },
  body: { padding: 16, paddingBottom: 50 },
  section: { fontSize: 10, color: Colors.textPrimary, fontWeight: FontWeight.extrabold, letterSpacing: 1.1 },
  heading: { marginTop: 24, marginBottom: 10 },
  caption: { fontSize: 10, color: Colors.textTertiary, marginTop: 3 },
  dailyRow: { flexDirection: 'row', gap: 5, marginTop: 10 },
  day: { flex: 1, minWidth: 38, backgroundColor: Colors.bgCard, borderRadius: 12, paddingVertical: 9, alignItems: 'center', gap: 3, borderWidth: 1, borderColor: Colors.borderLight },
  dayNow: { borderColor: Colors.electric, backgroundColor: Colors.electricDim },
  dayDone: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  dayNum: { fontSize: 8, color: Colors.textTertiary, fontWeight: FontWeight.extrabold },
  dayValue: { fontSize: 9, color: Colors.textSecondary, fontWeight: FontWeight.bold },
  claim: { marginTop: 10, backgroundColor: Colors.electric, borderRadius: 15, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...Shadow.sm },
  claimed: { backgroundColor: Colors.bgAlt },
  claimText: { color: '#fff', fontWeight: FontWeight.extrabold, fontSize: 12 },
  chest: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 17, padding: 12, marginBottom: 8, ...Shadow.sm },
  chestIcon: { width: 45, height: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 12, color: Colors.textPrimary, fontWeight: FontWeight.extrabold },
  cardSub: { fontSize: 10, color: Colors.textTertiary, marginTop: 2 },
  openBtn: { backgroundColor: Colors.bgAlt, borderRadius: 11, paddingHorizontal: 9, paddingVertical: 8 },
  openText: { fontSize: 9, color: Colors.textPrimary, fontWeight: FontWeight.extrabold },
  boost: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 17, padding: 12, marginBottom: 8, ...Shadow.sm },
  boostIcon: { width: 45, height: 45, borderRadius: 14, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  cost: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  costText: { fontSize: 10, color: '#B45309', fontWeight: FontWeight.bold },
  buyBtn: { backgroundColor: '#7C3AED', borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  buyText: { fontSize: 9, color: '#fff', fontWeight: FontWeight.extrabold },
  studio: { marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE', borderRadius: 18, padding: 14 },
  expedition: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 17, padding: 12, marginBottom: 8, ...Shadow.sm },
  destination: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  destinationEmoji: { fontSize: 23 },
  destinationMeta: { fontSize: 9, color: Colors.textSecondary, fontWeight: FontWeight.bold, marginTop: 5 },
  destBtn: { backgroundColor: Colors.electric, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8 },
  destBtnText: { fontSize: 9, color: '#fff', fontWeight: FontWeight.extrabold },
  ethics: { marginTop: 12, flexDirection: 'row', gap: 9, backgroundColor: '#F0FDFA', borderRadius: 16, padding: 13 },
  ethicsText: { flex: 1, fontSize: 10, lineHeight: 15, color: '#0F766E', fontWeight: FontWeight.medium },
})
