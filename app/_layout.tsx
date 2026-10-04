import React, { useEffect, useRef, useState } from 'react'
import { Stack, router, usePathname, useSegments } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet } from 'react-native'
import { LaunchCurtain } from '@/components/v6/LaunchCurtain'
import * as SplashScreen from 'expo-splash-screen'
import { I18nContext, translations } from '@/lib/i18n'
import { useProfile, useSession } from '@/hooks/useProfile'
import type { PreferredLanguage } from '@/types/database'
import { V7EconomyProvider } from '@/hooks/v7/useV7Economy'
import { AvatarOnboardingGate } from '@/components/v7/AvatarOnboardingGate'
import { V8WorldProvider } from '@/hooks/v8/useV8World'
import { WebNativeFeel } from '@/components/v9/WebNativeFeel'
import { V14IdentityProvider } from '@/hooks/v14/useV14Identity'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { userId, ready } = useSession()
  const pathname = usePathname()
  const segments = useSegments()
  const { profile } = useProfile(userId ?? undefined)

  const [language, setLanguage] = useState<PreferredLanguage>('fr')
  const [launchVisible, setLaunchVisible] = useState(true)
  const didInitialNav = useRef(false)

  // Sync language preference from profile
  useEffect(() => {
    if (profile?.preferred_language) setLanguage(profile.preferred_language)
  }, [profile?.preferred_language])

  // Auth guard: only cross the auth/protected boundary. Do not replace valid
  // modal routes after login (Live, Calendar, Activity Story, etc.).
  useEffect(() => {
    if (!ready) return
    SplashScreen.hideAsync()
    if (!didInitialNav.current) didInitialNav.current = true
    if (pathname.includes('reset-password')) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!userId && !inAuthGroup) router.replace('/(auth)/login')
    else if (userId && inAuthGroup) router.replace('/(tabs)')
  }, [ready, userId, pathname, segments])

  if (!ready) return null

  return (
    <GestureHandlerRootView style={styles.root}>
      <V7EconomyProvider>
      <V8WorldProvider>
      <V14IdentityProvider>
      <I18nContext.Provider
        value={{
          t: translations[language],
          language,
          setLanguage,
        }}
      >
        <Stack screenOptions={{ animation: 'slide_from_right', contentStyle: { backgroundColor: '#F4F7FB' } }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modals/add-activity"
            options={{
              presentation: 'modal',
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
          <Stack.Screen
            name="modals/paywall"
            options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="modals/account" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/connections" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/sports" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/activity/[id]" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/track" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/live" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/calendar" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/records" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/equipment" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/watch-live/[id]" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/readiness" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/choose-class" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/sensory-settings" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/sport-rankings" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/credentials" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/avatar-studio" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/avatar-photo" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/rewards-hub" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/profile-card" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/companion-studio" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/trophy-room" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/world" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/story-builder" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/season" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/music-space" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/intelligence" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/competition-mode" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/recap" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/timeline" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/life-hub" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/recovery" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/fuel" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/mind" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/adaptive-plan" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/digital-twin" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/scenario-lab" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/journal" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen
            name="modals/notifications"
            options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/search"
            options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }}
          />
        </Stack>
        <WebNativeFeel />
        <LaunchCurtain visible={launchVisible} onDone={() => setLaunchVisible(false)} />
        <AvatarOnboardingGate />
      </I18nContext.Provider>
      </V14IdentityProvider>
      </V8WorldProvider>
      </V7EconomyProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
