-- Fix Duo/Squad capacity tracking by assigning a team_id to each confirmed team registration.
create or replace function public.confirm_tournament_join(p_request_id bigint)
returns bigint
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_request public.tournament_join_requests%rowtype;
  v_tournament public.tournaments%rowtype;
  v_profile public.profiles%rowtype;
  v_wallet public.wallets%rowtype;
  v_participant_id bigint;
  v_balance_after numeric(12,2);
  v_team_size integer;
  v_joined_players integer;
  v_team_id uuid;
begin
  if v_user_id is null then raise exception 'You must be logged in to confirm this join request.'; end if;
  select * into v_profile from public.profiles where id=v_user_id;
  if not found or v_profile.free_fire_uid is null then raise exception 'Please set your Free Fire UID in your Profile first.'; end if;

  select * into v_request from public.tournament_join_requests where id=p_request_id and user_id=v_user_id for update;
  if not found then raise exception 'Join request not found.'; end if;
  if v_request.status<>'PENDING' then raise exception 'This join request is no longer pending.'; end if;
  if v_request.expires_at<=now() then
    update public.tournament_join_requests set status='CANCELLED',updated_at=now() where id=v_request.id;
    raise exception 'This join request has expired.';
  end if;
  if v_request.free_fire_uids->>0 <> v_profile.free_fire_uid then
    raise exception 'Captain UID no longer matches your Profile Free Fire UID. Please update the registration.';
  end if;

  select * into v_tournament from public.tournaments where id=v_request.tournament_id for update;
  if not found or v_tournament.status<>'REGISTRATION' then raise exception 'Tournament is no longer open for registration.'; end if;
  if v_tournament.is_enabled=false then raise exception 'This tournament is currently unavailable.'; end if;
  if v_tournament.registration_opens_at>now() then raise exception 'Registration for this tournament is not open yet.'; end if;
  if now() >= (((v_tournament.tournament_date+v_tournament.scheduled_start_time) at time zone 'Asia/Dhaka')-interval '30 minutes') then raise exception 'Registration is closed for this tournament.'; end if;

  v_team_size:=jsonb_array_length(v_request.free_fire_uids);
  select count(*)::integer into v_joined_players from public.tournament_participants tp where tp.tournament_id=v_tournament.id and tp.status='JOINED';

  if v_tournament.mode='SOLO' then
    if v_joined_players>=v_tournament.max_players then raise exception 'Tournament is full.'; end if;
    v_team_id := null;
  else
    if floor(v_joined_players::numeric/v_team_size)>=coalesce(v_tournament.max_teams,0) then raise exception 'Tournament is full.'; end if;
    v_team_id := gen_random_uuid();
  end if;

  select * into v_wallet from public.wallets where user_id=v_user_id for update;
  if not found then raise exception 'Wallet not found.'; end if;
  if v_wallet.balance<v_tournament.entry_fee then raise exception 'Insufficient wallet balance.'; end if;

  v_balance_after:=v_wallet.balance-v_tournament.entry_fee;

  if v_tournament.entry_fee > 0 then
    update public.wallets set balance=v_balance_after,updated_at=now() where id=v_wallet.id;
    insert into public.wallet_transactions(wallet_id,transaction_type,amount,balance_before,balance_after,tournament_id,description)
    values(v_wallet.id,'ENTRY_FEE',-v_tournament.entry_fee,v_wallet.balance,v_balance_after,v_tournament.id,'Tournament entry fee');
  end if;

  insert into public.tournament_participants(tournament_id,user_id,team_id,captain_free_fire_uid,free_fire_uids,entry_fee,first_prize,second_prize,third_prize,kill_reward)
  values(v_tournament.id,v_user_id,v_team_id,v_profile.free_fire_uid,v_request.free_fire_uids,v_tournament.entry_fee,v_tournament.first_prize,v_tournament.second_prize,v_tournament.third_prize,v_tournament.kill_reward)
  returning id into v_participant_id;

  update public.tournament_join_requests set status='CONFIRMED',reviewed_at=now(),updated_at=now() where id=v_request.id;
  return v_participant_id;
end;
$function$;

update public.tournament_participants tp
set team_id = gen_random_uuid()
from public.tournaments t
where t.id = tp.tournament_id
  and t.mode in ('DUO','SQUAD')
  and tp.status = 'JOINED'
  and tp.team_id is null;
