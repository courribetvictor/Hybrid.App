import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { Colors, FontSize, FontWeight, Radius } from '@/constants/theme'

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
        <Image source={{ uri }} style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      )}
      {isPro && (
        <View style={[styles.proBadge, { right: -2, bottom: -2 }]}>
          <Text style={styles.proText}>⚡</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  img: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: Colors.electricDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.electric,
    fontWeight: FontWeight.bold,
  },
  proBadge: {
    position: 'absolute',
    backgroundColor: Colors.electric,
    borderRadius: Radius.full,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proText: {
    fontSize: 8,
  },
})
