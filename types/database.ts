// ============================================================
// Hybrid.App — Supabase Database Types (auto-documented)
// ============================================================

export type PreferredUnit = 'metric' | 'imperial'
export type PreferredLanguage = 'fr' | 'en'
export type SportType =
  | 'running' | 'cycling' | 'swimming' | 'gym' | 'badminton' | 'athletics'
  | 'football' | 'tennis' | 'hiking' | 'yoga' | 'boxing'
export type FriendshipStatus = 'pending' | 'accepted'

// ── Sport-specific JSONB metric shapes ──────────────────────

export interface EnduranceMetrics {
  distance_m: number
  avg_pace_s_per_km?: number
  avg_heart_rate?: number
  elevation_m?: number
  splits?: { km: number; pace_s: number }[]
}

export interface GymSet {
  reps: number
  weight_kg: number
  rpe?: number // Rate of Perceived Exertion 1-10
}

export interface GymExercise {
  name: string
  sets: GymSet[]
  one_rm_kg?: number
}

export interface GymMetrics {
  exercises: GymExercise[]
  total_volume_kg?: number // auto-computed: sum(reps * weight)
}

export interface BadmintonSet {
  player_score: number
  opponent_score: number
}

export interface BadmintonMetrics {
  sets: BadmintonSet[]
  match_won: boolean
  opponent_name?: string
}

export interface AthleticsMetrics {
  event: string          // e.g. "100m", "long_jump", "javelin"
  result_value: number
  result_unit: 'm' | 's' | 'points'
  wind_speed?: number    // m/s, for sprints/jumps
}

export interface FootballMetrics {
  match_won?: boolean
  goals_scored?: number
  assists?: number
  position?: 'goalkeeper' | 'defender' | 'midfielder' | 'forward'
  distance_m?: number
}

export interface TennisSet {
  player_games: number
  opponent_games: number
}

export interface TennisMetrics {
  sets: TennisSet[]
  match_won: boolean
  aces?: number
  double_faults?: number
}

export type YogaStyle = 'hatha' | 'vinyasa' | 'yin' | 'ashtanga' | 'power' | 'other'

export interface YogaMetrics {
  style?: YogaStyle
  avg_heart_rate?: number
}

export type BoxingBoutType = 'sparring' | 'bag' | 'pad_work' | 'competition'

export interface BoxingMetrics {
  rounds?: number
  bout_type?: BoxingBoutType
  avg_heart_rate?: number
}

export type ActivityMetrics =
  | EnduranceMetrics
  | GymMetrics
  | BadmintonMetrics
  | AthleticsMetrics
  | FootballMetrics
  | TennisMetrics
  | YogaMetrics
  | BoxingMetrics

// ── Database row types ───────────────────────────────────────

export interface Profile {
  id: string
  username: string
  height_cm: number | null
  current_weight_kg: number | null
  is_pro: boolean
  hybrid_score: number
  preferred_unit: PreferredUnit
  preferred_language: PreferredLanguage
  avatar_url: string | null
  created_at: string
}

export interface BodyLog {
  id: string
  user_id: string
  weight_kg: number | null
  body_fat_percentage: number | null
  calories_consumed: number | null
  logged_date: string // ISO date "YYYY-MM-DD"
  created_at: string
}

export interface Activity {
  id: string
  user_id: string
  sport_type: SportType
  duration_seconds: number
  calories_burned: number | null
  metrics: ActivityMetrics
  created_at: string
}

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: FriendshipStatus
  created_at: string
}

export interface Club {
  id: string
  name: string
  owner_id: string
  total_points: number
  created_at: string
}

export interface ClubMember {
  club_id: string
  user_id: string
  joined_at: string
}

export interface WeeklyChallenge {
  id: string
  title: string
  description: string | null
  sport_type: SportType
  target_value: number | null
  target_unit: string | null
  is_pro_only: boolean
  start_date: string
  end_date: string
  created_at: string
}

// ── Supabase database schema type (for createClient<Database>()) ──

// Utility: make a type compatible with Supabase's Record<string, unknown> constraint
type DbRow<T> = T & { [K: string]: unknown }

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: DbRow<Profile>
        Insert: DbRow<Omit<Profile, 'id' | 'hybrid_score' | 'created_at'> & {
          id?: string
          hybrid_score?: number
          created_at?: string
        }>
        Update: DbRow<Partial<Omit<Profile, 'id' | 'created_at'>>>
        Relationships: []
      }
      body_logs: {
        Row: DbRow<BodyLog>
        Insert: DbRow<Omit<BodyLog, 'id' | 'created_at'> & { id?: string; created_at?: string }>
        Update: DbRow<Partial<Omit<BodyLog, 'id' | 'user_id' | 'created_at'>>>
        Relationships: []
      }
      activities: {
        Row: DbRow<Activity>
        Insert: DbRow<Omit<Activity, 'id' | 'created_at'> & { id?: string; created_at?: string }>
        Update: DbRow<Partial<Omit<Activity, 'id' | 'user_id' | 'created_at'>>>
        Relationships: []
      }
      friendships: {
        Row: DbRow<Friendship>
        Insert: DbRow<Omit<Friendship, 'id' | 'created_at'> & { id?: string; created_at?: string }>
        Update: DbRow<Pick<Friendship, 'status'>>
        Relationships: []
      }
      clubs: {
        Row: DbRow<Club>
        Insert: DbRow<Omit<Club, 'id' | 'total_points' | 'created_at'> & {
          id?: string
          total_points?: number
          created_at?: string
        }>
        Update: DbRow<Partial<Pick<Club, 'name' | 'total_points'>>>
        Relationships: []
      }
      club_members: {
        Row: DbRow<ClubMember>
        Insert: DbRow<Omit<ClubMember, 'joined_at'> & { joined_at?: string }>
        Update: DbRow<Record<string, never>>
        Relationships: []
      }
      weekly_challenges: {
        Row: DbRow<WeeklyChallenge>
        Insert: DbRow<Omit<WeeklyChallenge, 'id' | 'created_at'> & { id?: string; created_at?: string }>
        Update: DbRow<Partial<Omit<WeeklyChallenge, 'id' | 'created_at'>>>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      preferred_unit: PreferredUnit
      preferred_language: PreferredLanguage
      sport_type: SportType
      friendship_status: FriendshipStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ── Utility / joined types ───────────────────────────────────

export interface ActivityWithProfile extends Activity {
  profile: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'is_pro'>
}

export interface ClubWithMembers extends Club {
  members: (ClubMember & { profile: Pick<Profile, 'id' | 'username' | 'avatar_url'> })[]
  member_count: number
}
