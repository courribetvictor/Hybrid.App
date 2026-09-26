import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import type { Skills } from '@/hooks/useSkills'
import { SKILL_META } from '@/hooks/useSkills'

interface Props {
  skills: Skills
  size?: number
}

const SKILLS_ORDER = ['explosivite', 'detente', 'endurance', 'force', 'agilite'] as const
const N = SKILLS_ORDER.length

// Pentagon vertex positions (0 = top, clockwise)
function vertex(i: number, r: number, cx: number, cy: number) {
  const angle = (Math.PI * 2 * i) / N - Math.PI / 2
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  }
}

export function SkillsRadar({ skills, size = 220 }: Props) {
  const svgSize = size * 1.35
  const cx = svgSize / 2
  const cy = svgSize / 2
  const maxR = size * 0.38
  const labelR = size * 0.52

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0]

  // Skill polygon points
  const skillPoints = SKILLS_ORDER.map((key, i) => {
    const ratio = (skills[key] ?? 0) / 100
    return vertex(i, maxR * ratio, cx, cy)
  }).map(p => `${p.x},${p.y}`).join(' ')

  const outerPoints = SKILLS_ORDER.map((_, i) => vertex(i, maxR, cx, cy))
    .map(p => `${p.x},${p.y}`).join(' ')

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Compétences Hybrid</Text>

      {/* Radar */}
      <View style={{ alignItems: 'center' }}>
        <Svg width={svgSize} height={svgSize}>
          {/* Background rings */}
          {rings.map(r => (
            <Polygon
              key={r}
              points={SKILLS_ORDER.map((_, i) => {
                const p = vertex(i, maxR * r, cx, cy)
                return `${p.x},${p.y}`
              }).join(' ')}
              fill="none"
              stroke={Colors.borderLight}
              strokeWidth={r === 1 ? 1.5 : 1}
            />
          ))}

          {/* Axis lines */}
          {SKILLS_ORDER.map((_, i) => {
            const p = vertex(i, maxR, cx, cy)
            return (
              <Line
                key={i}
                x1={cx} y1={cy}
                x2={p.x} y2={p.y}
                stroke={Colors.borderLight}
                strokeWidth={1}
              />
            )
          })}

          {/* Filled skill polygon */}
          <Polygon
            points={skillPoints}
            fill={Colors.electricDim}
            stroke={Colors.electric}
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* Outer pentagon */}
          <Polygon
            points={outerPoints}
            fill="none"
            stroke={Colors.border}
            strokeWidth={1.5}
          />

          {/* Skill dots */}
          {SKILLS_ORDER.map((key, i) => {
            const ratio = (skills[key] ?? 0) / 100
            const p = vertex(i, maxR * ratio, cx, cy)
            const meta = SKILL_META[key]
            return (
              <Circle
                key={key}
                cx={p.x} cy={p.y}
                r={4}
                fill={meta.color}
                stroke="#fff"
                strokeWidth={1.5}
              />
            )
          })}

          {/* Labels */}
          {SKILLS_ORDER.map((key, i) => {
            const p = vertex(i, labelR, cx, cy)
            const meta = SKILL_META[key]
            const val = skills[key] ?? 0
            // Adjust text anchor based on position
            const anchor = p.x < cx - 4 ? 'end' : p.x > cx + 4 ? 'start' : 'middle'
            return (
              <React.Fragment key={key}>
                <SvgText
                  x={p.x}
                  y={p.y - 6}
                  fontSize={10}
                  fontWeight="700"
                  fill={meta.color}
                  textAnchor={anchor}
                >
                  {meta.emoji} {meta.label}
                </SvgText>
                <SvgText
                  x={p.x}
                  y={p.y + 7}
                  fontSize={11}
                  fontWeight="800"
                  fill={Colors.textPrimary}
                  textAnchor={anchor}
                >
                  {val}
                </SvgText>
              </React.Fragment>
            )
          })}
        </Svg>
      </View>

      {/* Bar list */}
      <View style={styles.bars}>
        {SKILLS_ORDER.map(key => {
          const meta = SKILL_META[key]
          const val = skills[key] ?? 0
          return (
            <View key={key} style={styles.barRow}>
              <Text style={styles.barEmoji}>{meta.emoji}</Text>
              <Text style={styles.barLabel}>{meta.label}</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${val}%` as any, backgroundColor: meta.color }]} />
              </View>
              <Text style={[styles.barVal, { color: meta.color }]}>{val}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  bars: { gap: 8 },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barEmoji: { fontSize: 14, width: 20, textAlign: 'center' },
  barLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary, width: 72 },
  barBg: { flex: 1, height: 6, backgroundColor: Colors.bgAlt, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barVal: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, width: 24, textAlign: 'right' },
})
