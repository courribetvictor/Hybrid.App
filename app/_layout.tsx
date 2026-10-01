import React, { useEffect, useRef, useState } from 'react'
import { Stack, router, usePathname, useSegments } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet } from 'react-native'
import { LaunchCurtain } from '@/components/v6/LaunchCurtain'
import * as SplashScreen from 'expo-splash-screen'
import { I18nContext, translations } from '@/lib/i18n'
import { useProfile, useSession } from '@/hooks/useProfile'
import type { PreferredLanguage } from '@/types/database'

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
          <Stack.Screen
            name="modals/notifications"
            options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/search"
            options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }}
          />
        </Stack>
        <LaunchCurtain visible={launchVisible} onDone={() => setLaunchVisible(false)} />
      </I18nContext.Provider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
