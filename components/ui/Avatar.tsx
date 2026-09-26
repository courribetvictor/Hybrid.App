import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontWeight, Radius } from '@/constants/theme'

interface AvatarProps {
  uri?: string | null
  username: string
  size?: number
  isPro?: boolean
}

export function Avatar({ uri, username, size = 40, isPro = false }: AvatarProps) {
  const initials = username.slice(0, 2).toUpperCase()
  const fontSize = size * 0.38

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <View style={[styles.imgWrap, { width: size, height: size, borderRadius: size / 2 }]}>
          {isPro && (
            <LinearGradient
              colors={['#2563EB', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.proBorder, { width: size + 3, height: size + 3, borderRadius: (size + 3) / 2, left: -1.5, top: -1.5 }]}
            />
          )}
          <Image source={{ uri }} style={[styles.img, { width: size - (isPro ? 4 : 0), height: size - (isPro ? 4 : 0), borderRadius: (size - (isPro ? 4 : 0)) / 2 }]} />
        </View>
      ) : (
        <LinearGradient
          colors={['#2563EB', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}
        >
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </LinearGradient>
      )}
      {isPro && (
        <LinearGradient
          colors={['#F59E0B', '#EF4444']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.proBadge, { right: -2, bottom: -2 }]}
        >
          <Text style={styles.proText}>⚡</Text>
        </LinearGradient>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  imgWrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  proBorder: {
    position: 'absolute',
  },
  img: {
    resizeMode: 'cover',
    zIndex: 1,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  proBadge: {
    position: 'absolute',
    borderRadius: Radius.full,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.bg,
  },
  proText: {
    fontSize: 7,
  },
})
