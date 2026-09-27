-- Fix: add missing table-level GRANT permissions for authenticated/anon roles.
-- Without these, RLS policies alone are not enough — PostgreSQL denies at the
-- table level before even evaluating the RLS policies.

GRANT SELECT, INSERT, UPDATE        ON public.profiles          TO authenticated;
GRANT SELECT                        ON public.profiles          TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities       TO authenticated;
GRANT SELECT                         ON public.activities       TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.body_logs        TO authenticated;

GRANT SELECT, INSERT, DELETE         ON public.friendships      TO authenticated;

GRANT SELECT                         ON public.weekly_challenges TO authenticated, anon;

GRANT SELECT                         ON public.clubs            TO authenticated, anon;
GRANT INSERT, UPDATE                 ON public.clubs            TO authenticated;

GRANT SELECT, INSERT, DELETE         ON public.club_members     TO authenticated;
GRANT SELECT                         ON public.club_members     TO anon;
