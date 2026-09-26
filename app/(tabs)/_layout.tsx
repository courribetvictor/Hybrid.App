import React from 'react'
import { Tabs } from 'expo-router'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { Home, Trophy, User2 } from 'lucide-react-native'
import { Colors, FontSize, FontWeight, Gradients } from '@/constants/theme'

interface TabBarProps {
  state: { routes: { key: string; name: string }[]; index: number }
  descriptors: Record<string, { options: Record<string, unknown> }>
  navigation: { emit: (e: any) => any; navigate: (name: string) => void }
}

const TABS = [
  { name: 'index', label: 'Accueil', Icon: Home },
  { name: 'arena', label: 'Arène',   Icon: Trophy, center: true },
  { name: 'vous',  label: 'VOUS',    Icon: User2 },
]

function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[bar.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const tab = TABS.find(t => t.name === route.name)
        if (!tab) return null
        const focused = state.index === index
        const isCenter = tab.center === true
        const IconComponent = tab.Icon

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
              <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={bar.centerTouchable}>
                <LinearGradient
                  colors={Gradients.pro}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[bar.centerBtn, focused && bar.centerBtnFocused]}
                >
                  <IconComponent size={26} color="#FFFFFF" strokeWidth={2.5} />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={[bar.centerLabel, focused && bar.centerLabelFocused]}>
                {tab.label}
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
              {focused && <View style={bar.activeDot} />}
              <IconComponent
                size={22}
                color={focused ? Colors.electric : Colors.textTertiary}
                strokeWidth={focused ? 2.5 : 1.8}
              />
            </View>
            <Text style={[bar.label, focused && bar.labelFocused]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export default function TabLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        tabBar={props => <CustomTabBar {...(props as any)} />}
        screenOptions={{ headerShown: false }}
      >
        {TABS.map(t => (
          <Tabs.Screen key={t.name} name={t.name} />
        ))}
      </Tabs>
    </>
  )
}

const BAR_HEIGHT = 62

const bar = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: BAR_HEIGHT + 24,
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
      },
      android: { elevation: 20 },
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
    width: 44,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconWrapFocused: {
    backgroundColor: Colors.electricDim,
  },
  activeDot: {
    position: 'absolute',
    top: 0,
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.electric,
  },
  label: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.2,
  },
  labelFocused: {
    color: Colors.electric,
    fontWeight: FontWeight.bold,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
    gap: 3,
  },
  centerTouchable: {
    marginBottom: -2,
    marginTop: -20,
  },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A8BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
  },
  centerBtnFocused: {
    transform: [{ scale: 1.06 }],
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  centerLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.2,
  },
  centerLabelFocused: {
    color: Colors.electricLight,
    fontWeight: FontWeight.bold,
  },
})
