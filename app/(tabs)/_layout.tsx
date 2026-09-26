import React from 'react'
import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontSize, FontWeight, Radius } from '@/constants/theme'

const TABS = [
  { name: 'index',   label: 'Feed',    icon: '⚡' },
  { name: 'social',  label: 'Social',  icon: '👥' },
  { name: 'arena',   label: 'Arène',   icon: '🏆' },
  { name: 'stats',   label: 'Labo',    icon: '🔬' },
  { name: 'profile', label: 'Profil',  icon: '👤' },
]

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={[tabStyles.wrap, focused && tabStyles.wrapActive]}>
      <Text style={tabStyles.icon}>{icon}</Text>
    </View>
  )
}

export default function TabLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={({ route }) => {
        const tab = TABS.find(t => t.name === route.name)
        return {
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>
              {tab?.label ?? route.name}
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={tab?.icon ?? '•'} label={tab?.label ?? ''} focused={focused} />
          ),
          tabBarStyle: {
            backgroundColor: Colors.bg,
            borderTopColor: Colors.borderLight,
            borderTopWidth: 1,
            height: 56 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 6,
          },
          tabBarItemStyle: {
            gap: 2,
          },
        }
      }}
    >
      {TABS.map(t => (
        <Tabs.Screen key={t.name} name={t.name} />
      ))}
    </Tabs>
  )
}

const tabStyles = StyleSheet.create({
  wrap: {
    width: 34,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapActive: {
    backgroundColor: Colors.electricDim,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
    color: Colors.textTertiary,
  },
  labelActive: {
    color: Colors.electric,
    fontWeight: FontWeight.bold,
  },
})
