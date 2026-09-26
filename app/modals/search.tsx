import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FriendSearch } from '@/components/arena/FriendSearch'
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme'
import { useSession } from '@/hooks/useProfile'
import { useFriendships } from '@/hooks/useFriendships'

export default function SearchModal() {
  const insets = useSafeAreaInsets()
  const { userId } = useSession()
  const { friendIds, refetch } = useFriendships(userId ?? undefined)

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Rechercher</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {userId ? (
          <FriendSearch
            currentUserId={userId}
            friendIds={friendIds}
            onRequestSent={refetch}
          />
        ) : (
          <Text style={styles.noUser}>Connecte-toi pour rechercher des athlètes</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  body: {
    flex: 1,
    padding: Spacing.md,
  },
  noUser: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 40,
  },
})
