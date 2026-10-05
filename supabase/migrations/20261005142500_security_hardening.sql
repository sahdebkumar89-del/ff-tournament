-- Security hardening: lock the scheduled tournament resolver to its pg_cron/internal caller
-- and restore least-privilege read access for published per-player result rows.

REVOKE EXECUTE ON FUNCTION public.resolve_unfilled_tournaments() FROM PUBLIC;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tournament_result_players'
      AND policyname = 'Admins can view all tournament result players'
  ) THEN
    CREATE POLICY "Admins can view all tournament result players"
      ON public.tournament_result_players
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = (SELECT auth.uid())
            AND p.role = 'ADMIN'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tournament_result_players'
      AND policyname = 'Players can view their published result rows'
  ) THEN
    CREATE POLICY "Players can view their published result rows"
      ON public.tournament_result_players
      FOR SELECT
      TO authenticated
      USING (
        (
          (user_id = (SELECT auth.uid())
           OR reward_recipient_user_id = (SELECT auth.uid()))
          AND EXISTS (
            SELECT 1
            FROM public.tournament_results r
            WHERE r.id = tournament_result_players.result_id
              AND r.verification_status = 'VERIFIED'
              AND r.published_at IS NOT NULL
          )
        )
      );
  END IF;
END $$;