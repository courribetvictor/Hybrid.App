import React from 'react'
import { Tabs } from 'expo-router'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontSize, FontWeight, Shadow } from '@/constants/theme'

interface TabBarProps {
  state: { routes: { key: string; name: string }[]; index: number }
  descriptors: Record<string, { options: Record<string, unknown> }>
  navigation: { emit: (e: any) => any; navigate: (name: string) => void }
}

const TABS = [
  { name: 'index',   label: 'Feed',    icon: '⚡' },
  { name: 'social',  label: 'Social',  icon: '👥' },
  { name: 'arena',   label: 'Arène',   icon: '🏆', center: true },
  { name: 'stats',   label: 'Labo',    icon: '🔬' },
  { name: 'profile', label: 'Profil',  icon: '👤' },
]

function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[bar.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const tab = TABS.find(t => t.name === route.name)
        const focused = state.index === index
        const isCenter = tab?.center === true

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          })
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name)
          }
        }

        if (isCenter) {
          return (
            <View key={route.key} style={bar.centerWrap}>
              <TouchableOpacity
                style={[bar.centerBtn, focused && bar.centerBtnFocused]}
                onPress={onPress}
                activeOpacity={0.85}
              >
                <Text style={bar.centerIcon}>{tab?.icon}</Text>
              </TouchableOpacity>
              <Text style={[bar.centerLabel, focused && bar.centerLabelFocused]}>
                {tab?.label}
              </Text>
            </View>
          )
        }

        return (
          <TouchableOpacity
            key={route.key}
            style={bar.item}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <View style={[bar.iconWrap, focused && bar.iconWrapFocused]}>
              <Text style={bar.icon}>{tab?.icon}</Text>
            </View>
            <Text style={[bar.label, focused && bar.labelFocused]}>
              {tab?.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TABS.map(t => (
        <Tabs.Screen key={t.name} name={t.name} />
      ))}
    </Tabs>
  )
}

const BAR_HEIGHT = 62

const bar = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderLight,
    height: BAR_HEIGHT + 20, // extra for safe area padding
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 10 },
    }),
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 6,
    gap: 2,
    height: BAR_HEIGHT,
  },
  iconWrap: {
    width: 36,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapFocused: {
    backgroundColor: Colors.electricDim,
  },
  icon: { fontSize: 18 },
  label: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
  labelFocused: {
    color: Colors.electric,
    fontWeight: FontWeight.bold,
  },
  // ── Center (Arène) elevated button ──
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
    gap: 3,
  },
  centerBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.electric,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -2,
    marginTop: -20, // elevate above the bar line
    ...Shadow.lg,
  },
  centerBtnFocused: {
    backgroundColor: '#1A56F0', // slightly deeper blue when active
    transform: [{ scale: 1.06 }],
  },
  centerIcon: { fontSize: 22 },
  centerLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
  centerLabelFocused: {
    color: Colors.electric,
    fontWeight: FontWeight.bold,
  },
})
