-- Security hardening and RLS performance cleanup.
--
-- No business rules, pricing, tournament timing, or navigation behavior changes.

REVOKE EXECUTE ON FUNCTION public.resolve_unfilled_tournaments() FROM PUBLIC;

DROP POLICY IF EXISTS "Admins can view all tournament result players"
  ON public.tournament_result_players;
DROP POLICY IF EXISTS "Players can view their published result rows"
  ON public.tournament_result_players;

CREATE POLICY "Users and admins can view permitted tournament result players"
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
    OR
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

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins can view all payment transactions" ON public.payment_transactions;
CREATE POLICY "Admins can view all payment transactions"
  ON public.payment_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Users can view their own payment transactions" ON public.payment_transactions;
CREATE POLICY "Users can view their own payment transactions"
  ON public.payment_transactions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can join tournaments" ON public.tournament_participants;
CREATE POLICY "Users can join tournaments"
  ON public.tournament_participants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view their own tournament participations"
  ON public.tournament_participants;
CREATE POLICY "Users can view their own tournament participations"
  ON public.tournament_participants
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view tournament templates" ON public.tournament_templates;
CREATE POLICY "Admins can view tournament templates"
  ON public.tournament_templates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins can view all tournaments" ON public.tournaments;
CREATE POLICY "Admins can view all tournaments"
  ON public.tournaments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Users can view their own wallet transactions"
  ON public.wallet_transactions;
CREATE POLICY "Users can view their own wallet transactions"
  ON public.wallet_transactions
  FOR SELECT TO authenticated
  USING (
    wallet_id IN (
      SELECT wallets.id
      FROM public.wallets
      WHERE wallets.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
CREATE POLICY "Users can view their own wallet"
  ON public.wallets
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));