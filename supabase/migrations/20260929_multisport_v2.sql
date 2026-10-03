-- Hybrid.App Multisport v2
-- The existing favorite_sports text[] and activities.sport_type text fields already support
-- the expanded catalogue without a schema migration. This migration upgrades the score formula
-- so every sport family contributes instead of only the original eleven sports.

create or replace function public.calculate_hybrid_score(target_user uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
with a as (
  select *, case when is_verified then 1.0 else 0.65 end as w
  from public.activities
  where user_id=target_user and performed_at>=now()-interval '90 days'
), tagged as (
  select *, case
    when sport_type in ('running','trail_running','walking','nordic_walking','hiking','obstacle_course','triathlon','duathlon','cycling','mountain_biking','gravel_cycling','track_cycling','cyclocross','indoor_cycling','swimming','open_water_swimming','rowing','kayaking','canoeing','stand_up_paddle','cross_country_skiing','biathlon') then 'endurance'
    when sport_type in ('gym','bodybuilding','powerlifting','weightlifting','crossfit','calisthenics','functional_training','circuit_training','kettlebell','strongman','climbing','bouldering','boxing','kickboxing','muay_thai','mma','judo','bjj','karate','taekwondo','wrestling') then 'strength'
    else 'skill'
  end as bucket
  from a
), parts as (
 select
   least(100.0,coalesce(sum(case when bucket='endurance' then (2.0+least(6.0,coalesce(nullif(metrics->>'distance_m','')::numeric,0)/1000.0*.45))*w else 0 end),0)) endurance,
   least(100.0,coalesce(sum(case when bucket='strength' then (4.0+least(5.0,coalesce(nullif(metrics->>'total_volume_kg','')::numeric,0)/2500.0))*w else 0 end),0)) strength,
   least(100.0,coalesce(sum(case when sport_type in ('running','trail_running','athletics','tennis','badminton','padel','table_tennis','squash','football','futsal','basketball','rugby','boxing','kickboxing','mma','fencing') then (case when coalesce(rpe,0)>=7 then 4.0 else 2.5 end)*w else 0 end),0)) speed,
   least(100.0,count(distinct performed_at::date)::numeric/45.0*100.0) consistency,
   least(100.0,count(distinct sport_type)::numeric/10.0*100.0) versatility,
   greatest(0.0,least(100.0,50.0+5.0*(coalesce(sum(case when performed_at>=now()-interval '30 days' then w else 0 end),0)-coalesce(sum(case when performed_at<now()-interval '30 days' and performed_at>=now()-interval '60 days' then w else 0 end),0)))) progression
 from tagged
)
select round((endurance*.20+strength*.20+speed*.15+consistency*.20+versatility*.15+progression*.10)*10)::integer from parts;
$$;
