begin;

create or replace function public.admin_approve_result_payout(p_result_id bigint)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_result public.tournament_results%rowtype;
  v_row record;
  v_wallet_id bigint;
  v_balance numeric;
  v_captain_wallet_id bigint;
  v_captain_balance numeric;
begin
  if v_actor is null or not exists (select 1 from public.profiles where id=v_actor and role='ADMIN') then raise exception 'Admin access required'; end if;
  select * into v_result from public.tournament_results where id=p_result_id and verification_status='VERIFIED' and published_at is not null for update;
  if not found then raise exception 'Verified and published result not found'; end if;
  if exists (select 1 from public.wallet_transactions where tournament_id=v_result.tournament_id and transaction_type in ('POSITION_PRIZE','KILL_REWARD') and description like 'RESULT_PAYOUT:'||p_result_id::text||':%') then return v_result.total_payout; end if;
  select w.id,w.balance into v_captain_wallet_id,v_captain_balance from public.wallets w join public.tournament_participants tp on tp.user_id=w.user_id where tp.id=v_result.participant_id and tp.status='JOINED' for update;
  if v_captain_wallet_id is null then raise exception 'Captain wallet not found'; end if;
  for v_row in select * from public.tournament_result_players where result_id=p_result_id order by id loop
    if v_row.total_payout<=0 then continue; end if;
    select id,balance into v_wallet_id,v_balance from public.wallets where user_id=v_row.reward_recipient_user_id for update;
    if v_wallet_id is null then v_wallet_id:=v_captain_wallet_id; v_balance:=v_captain_balance; end if;
    if v_row.position_prize>0 then
      insert into public.wallet_transactions(wallet_id,transaction_type,amount,balance_before,balance_after,tournament_id,description) values(v_wallet_id,'POSITION_PRIZE',v_row.position_prize,v_balance,v_balance+v_row.position_prize,v_result.tournament_id,'RESULT_PAYOUT:'||p_result_id||':POSITION:'||v_row.player_uid);
      v_balance:=v_balance+v_row.position_prize;
    end if;
    if v_row.kill_reward>0 then
      insert into public.wallet_transactions(wallet_id,transaction_type,amount,balance_before,balance_after,tournament_id,description) values(v_wallet_id,'KILL_REWARD',v_row.kill_reward,v_balance,v_balance+v_row.kill_reward,v_result.tournament_id,'RESULT_PAYOUT:'||p_result_id||':KILL:'||v_row.player_uid);
      v_balance:=v_balance+v_row.kill_reward;
    end if;
    update public.wallets set balance=v_balance,updated_at=now() where id=v_wallet_id;
    if v_wallet_id=v_captain_wallet_id then v_captain_balance:=v_balance; end if;
  end loop;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,details) values(v_actor,'PRIZE_PAYOUT_APPROVED_UID_SPLIT','TOURNAMENT_RESULT',p_result_id,jsonb_build_object('tournament_id',v_result.tournament_id,'total',v_result.total_payout));
  return v_result.total_payout;
end;
$$;

revoke all on function public.resolve_result_player_reward_recipient(text, uuid) from public, anon, authenticated;
drop function if exists public.resolve_result_player_reward_recipient(text, uuid);
drop index if exists public.notifications_dedupe_key_idx;
drop index if exists public.tournament_rooms_tournament_id_uidx;

commit;