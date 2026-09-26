import React, { useEffect, useRef, useState } from 'react'
import { Stack, router } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import { I18nContext, translations } from '@/lib/i18n'
import { useProfile, useSession } from '@/hooks/useProfile'
import type { PreferredLanguage } from '@/types/database'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { userId, ready } = useSession()
  const { profile } = useProfile(userId ?? undefined)

  const [language, setLanguage] = useState<PreferredLanguage>('fr')
  const didInitialNav = useRef(false)

  // Sync language preference from profile
  useEffect(() => {
    if (profile?.preferred_language) setLanguage(profile.preferred_language)
  }, [profile?.preferred_language])

  // Auth guard: redirect once on startup, then only on sign-out
  useEffect(() => {
    if (!ready) return
    SplashScreen.hideAsync()
    if (!didInitialNav.current) {
      // First time ready — navigate to the right root
      didInitialNav.current = true
      router.replace(userId ? '/(tabs)' : '/(auth)/login')
      return
    }
    // After initial nav: only handle sign-out (userId going null)
    if (!userId) {
      router.replace('/(auth)/login')
    }
  }, [ready, userId])

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
        <Stack>
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
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="profile"
            options={{ headerShown: false }}
          />
        </Stack>
      </I18nContext.Provider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
