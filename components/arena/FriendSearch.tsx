import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { Avatar } from '@/components/ui/Avatar'
import { supabase } from '@/lib/supabase'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import type { Profile } from '@/types/database'

type SearchResult = Pick<Profile, 'id' | 'username' | 'avatar_url' | 'is_pro'>

interface FriendSearchProps {
  currentUserId: string
  friendIds: string[]
  onRequestSent?: () => void
}

export function FriendSearch({ currentUserId, friendIds, onRequestSent }: FriendSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [sent, setSent] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (text.trim().length < 2) { setResults([]); return }

      debounceRef.current = setTimeout(async () => {
        setSearching(true)
        const { data } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, is_pro')
          .ilike('username', `%${text.trim()}%`)
          .neq('id', currentUserId)
          .limit(20)
        setResults(data ?? [])
        setSearching(false)
      }, 350)
    },
    [currentUserId],
  )

  const handleAdd = useCallback(
    async (userId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      await supabase.from('friendships').insert({
        user_id: currentUserId,
        friend_id: userId,
        status: 'pending',
      })
      setSent(prev => new Set(prev).add(userId))
      onRequestSent?.()
    },
    [currentUserId, onRequestSent],
  )

  const alreadyFriend = (id: string) => friendIds.includes(id)
  const requestSent = (id: string) => sent.has(id)

  return (
    <View style={styles.container}>
      {/* Search input */}
      <View style={styles.inputWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Rechercher un utilisateur…"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searching && (
          <ActivityIndicator size="small" color={Colors.electric} style={styles.spinner} />
        )}
      </View>

      {/* Results */}
      {results.length > 0 && (
        <View style={styles.results}>
          {results.map(user => (
            <View key={user.id} style={styles.resultRow}>
              <Avatar uri={user.avatar_url} username={user.username} isPro={user.is_pro} size={36} />
              <Text style={styles.resultName} numberOfLines={1}>{user.username}</Text>
              {alreadyFriend(user.id) ? (
                <View style={styles.chipFriend}>
                  <Text style={styles.chipText}>Ami ✓</Text>
                </View>
              ) : requestSent(user.id) ? (
                <View style={styles.chipSent}>
                  <Text style={styles.chipText}>Envoyé ✓</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(user.id)} activeOpacity={0.75}>
                  <Text style={styles.addText}>+ Ajouter</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {query.length >= 2 && !searching && results.length === 0 && (
        <Text style={styles.noResults}>Aucun résultat pour « {query} »</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingVertical: 12,
  },
  spinner: { marginRight: 4 },
  results: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  resultName: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  addBtn: {
    backgroundColor: Colors.electric,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
  chipFriend: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipSent: {
    backgroundColor: Colors.electricDim,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  noResults: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
})
