export type PreferredLanguage = 'fr' | 'en'
export type PreferredUnit = 'metric' | 'imperial'
export type SportType = string
export type ActivitySource = 'manual'|'gps'|'garmin'|'apple_health'|'health_connect'|'strava'
export interface GymSet { reps:number; weight_kg:number; rir?:number|null; rest_seconds?:number|null; warmup?:boolean }
export interface GymExercise { name:string; sets:GymSet[] }
export interface BadmintonSet { player_score:number; opponent_score:number }
export interface TennisSet { player_games:number; opponent_games:number }
export type ActivityMetrics = Record<string, any>
export interface Profile {
  id:string; username:string; avatar_url?:string|null; bio?:string|null; height_cm?:number|null; weight_kg?:number|null; current_weight_kg?:number|null;
  preferred_language?:PreferredLanguage; preferred_unit?:PreferredUnit; favorite_sports?:SportType[]; is_pro?:boolean;
  hybrid_score?:number|null; fitness_level?:string|null; created_at:string;
  show_profile?:boolean; show_activities?:boolean; show_ranking?:boolean; show_body_metrics?:boolean;
}
export interface Activity {
  id:string; user_id:string; sport_type:SportType; duration_seconds:number; calories_burned?:number|null; metrics:ActivityMetrics;
  title?:string|null; notes?:string|null; rpe?:number|null; mood?:number|null; performed_at:string; created_at:string; updated_at?:string|null;
  source?:ActivitySource; source_external_id?:string|null; is_verified?:boolean; visibility?:'public'|'followers'|'private';
}
export interface ActivityWithProfile extends Activity { profile?:Profile|null }
export interface PostWithProfile { id:string; user_id:string; content:string; created_at:string; profile?:Profile|null; likes?:string[]; image_url?:string|null; likes_count:number; liked_by_me:boolean; sport_type?:SportType|null; media_url?:string|null }

export type LiveVisibility = 'public' | 'followers' | 'private'
export interface LiveNote { id:string; at_seconds:number; distance_km?:number|null; text:string; created_at:string }
export interface LiveReaction { id:string; emoji:string; user_id:string; created_at:string }
export interface LiveActivity {
  id:string; user_id:string; sport_type:SportType; started_at:string; ended_at?:string|null; status:'live'|'paused'|'finished';
  visibility:LiveVisibility; share_location:boolean; hide_start_end:boolean; delayed_minutes?:number|null;
  distance_km?:number|null; duration_seconds:number; pace_seconds_per_km?:number|null; heart_rate?:number|null; elevation_m?:number|null;
  current_track?:{ title:string; artist:string; artwork_url?:string|null }|null; notes?:LiveNote[]; reactions_count?:number; profile?:Profile|null;
}
export interface TrainingPlanItem { id:string; user_id:string; date:string; sport_type:SportType; title:string; duration_minutes?:number|null; status:'planned'|'done'|'skipped'; source:'manual'|'coach'; details?:Record<string,any> }
export interface EquipmentItem { id:string; user_id:string; category:string; name:string; brand?:string|null; sport_type?:SportType|null; distance_km?:number; usage_minutes?:number; threshold_km?:number|null; active:boolean; created_at:string }

export interface BodyLog { id:string; user_id:string; weight_kg:number|null; body_fat_percentage:number|null; calories_consumed:number|null; logged_date:string; created_at:string }
