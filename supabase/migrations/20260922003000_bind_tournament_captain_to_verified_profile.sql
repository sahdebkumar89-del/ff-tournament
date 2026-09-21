create or replace function public.request_tournament_join(p_tournament_id bigint, p_free_fire_uids jsonb)
returns bigint
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_tournament public.tournaments%rowtype;
  v_profile public.profiles%rowtype;
  v_request_id bigint;
  v_required_uids integer;
  v_reserved_count integer;
  v_joined_count integer;
begin
  if v_user_id is null then raise exception 'You must be logged in to join a tournament.'; end if;
  select * into v_profile from public.profiles where id=v_user_id;
  if not found or v_profile.free_fire_uid is null or v_profile.free_fire_uid !~ '^[0-9]{5,20}$' then raise exception 'Please set and verify your Free Fire UID in your Profile before joining.'; end if;
  if jsonb_typeof(p_free_fire_uids) <> 'array' then raise exception 'Free Fire UIDs must be provided as a list.'; end if;
  update public.tournament_join_requests set status='CANCELLED',updated_at=now() where tournament_id=p_tournament_id and user_id=v_user_id and status='PENDING' and expires_at<=now();
  select * into v_tournament from public.tournaments where id=p_tournament_id for update;
  if not found then raise exception 'Tournament not found.'; end if;
  if v_tournament.is_enabled=false then raise exception 'This tournament is currently unavailable.'; end if;
  if v_tournament.registration_opens_at>now() then raise exception 'Registration for this tournament is not open yet.'; end if;
  if v_tournament.status<>'REGISTRATION' then raise exception 'Tournament is not open for registration.'; end if;
  if now() >= (((v_tournament.tournament_date+v_tournament.scheduled_start_time) at time zone 'Asia/Dhaka')-interval '30 minutes') then raise exception 'Registration is closed for this tournament.'; end if;
  v_required_uids:=case v_tournament.mode when 'SOLO' then 1 when 'DUO' then 2 when 'SQUAD' then 4 end;
  if jsonb_array_length(p_free_fire_uids)<>v_required_uids then raise exception 'This % tournament requires % Free Fire UID(s).',v_tournament.mode,v_required_uids; end if;
  if p_free_fire_uids->>0<>v_profile.free_fire_uid then raise exception 'The first UID must be your verified Profile Free Fire UID. You are the team captain for this registration.'; end if;
  if exists(select 1 from jsonb_array_elements_text(p_free_fire_uids) u(uid) where u.uid !~ '^[0-9]{5,20}$') then raise exception 'Each Free Fire UID must contain 5 to 20 digits.'; end if;
  if (select count(distinct u.uid) from jsonb_array_elements_text(p_free_fire_uids) u(uid))<>v_required_uids then raise exception 'Free Fire UIDs must be unique.'; end if;
  if exists(select 1 from public.tournament_participants tp where tp.tournament_id=p_tournament_id and tp.user_id=v_user_id and tp.status='JOINED') then raise exception 'You have already joined this tournament.'; end if;
  if exists(select 1 from public.tournament_join_requests r where r.tournament_id=p_tournament_id and r.user_id=v_user_id and r.status='PENDING' and r.expires_at>now()) then raise exception 'You already have a pending join request.'; end if;
  select count(*)::integer into v_joined_count from public.tournament_participants tp where tp.tournament_id=p_tournament_id and tp.status='JOINED';
  select count(*)::integer into v_reserved_count from public.tournament_join_requests r where r.tournament_id=p_tournament_id and r.status='PENDING' and r.expires_at>now();
  if v_tournament.mode='SOLO' then
    if v_joined_count+v_reserved_count>=v_tournament.max_players then raise exception 'Tournament is full.'; end if;
  else
    if (v_joined_count/v_required_uids)+v_reserved_count>=coalesce(v_tournament.max_teams,0) then raise exception 'Tournament is full.'; end if;
  end if;
  insert into public.tournament_join_requests(tournament_id,user_id,mode,free_fire_uids) values(p_tournament_id,v_user_id,v_tournament.mode,p_free_fire_uids) returning id into v_request_id;
  return v_request_id;
end;
$function$;

create or replace function public.confirm_tournament_join(p_request_id bigint)
returns bigint
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid:=auth.uid();
  v_request public.tournament_join_requests%rowtype;
  v_tournament public.tournaments%rowtype;
  v_profile public.profiles%rowtype;
  v_wallet public.wallets%rowtype;
  v_participant_id bigint;
  v_balance_after numeric(12,2);
  v_team_size integer;
  v_joined_players integer;
begin
  if v_user_id is null then raise exception 'You must be logged in to confirm this join request.'; end if;
  select * into v_profile from public.profiles where id=v_user_id;
  if not found or v_profile.free_fire_uid is null then raise exception 'Please set your Free Fire UID in your Profile first.'; end if;
  select * into v_request from public.tournament_join_requests where id=p_request_id and user_id=v_user_id for update;
  if not found then raise exception 'Join request not found.'; end if;
  if v_request.status<>'PENDING' then raise exception 'This join request is no longer pending.'; end if;
  if v_request.expires_at<=now() then update public.tournament_join_requests set status='CANCELLED',updated_at=now() where id=v_request.id; raise exception 'This join request has expired.'; end if;
  if v_request.free_fire_uids->>0<>v_profile.free_fire_uid then raise exception 'Captain UID no longer matches your Profile Free Fire UID. Please update the registration.'; end if;
  select * into v_tournament from public.tournaments where id=v_request.tournament_id for update;
  if not found or v_tournament.status<>'REGISTRATION' then raise exception 'Tournament is no longer open for registration.'; end if;
  if v_tournament.is_enabled=false then raise exception 'This tournament is currently unavailable.'; end if;
  if v_tournament.registration_opens_at>now() then raise exception 'Registration for this tournament is not open yet.'; end if;
  if now() >= (((v_tournament.tournament_date+v_tournament.scheduled_start_time) at time zone 'Asia/Dhaka')-interval '30 minutes') then raise exception 'Registration is closed for this tournament.'; end if;
  v_team_size:=jsonb_array_length(v_request.free_fire_uids);
  select count(*)::integer into v_joined_players from public.tournament_participants tp where tp.tournament_id=v_tournament.id and tp.status='JOINED';
  if v_tournament.mode='SOLO' then
    if v_joined_players>=v_tournament.max_players then raise exception 'Tournament is full.'; end if;
  else
    if floor(v_joined_players::numeric/v_team_size)>=coalesce(v_tournament.max_teams,0) then raise exception 'Tournament is full.'; end if;
  end if;
  select * into v_wallet from public.wallets where user_id=v_user_id for update;
  if not found then raise exception 'Wallet not found.'; end if;
  if v_wallet.balance<v_tournament.entry_fee then raise exception 'Insufficient wallet balance.'; end if;
  v_balance_after:=v_wallet.balance-v_tournament.entry_fee;
  update public.wallets set balance=v_balance_after,updated_at=now() where id=v_wallet.id;
  insert into public.wallet_transactions(wallet_id,transaction_type,amount,balance_before,balance_after,tournament_id,description) values(v_wallet.id,'ENTRY_FEE',-v_tournament.entry_fee,v_wallet.balance,v_balance_after,v_tournament.id,'Tournament entry fee');
  insert into public.tournament_participants(tournament_id,user_id,captain_free_fire_uid,free_fire_uids,entry_fee,first_prize,second_prize,third_prize,kill_reward)
  values(v_tournament.id,v_user_id,v_profile.free_fire_uid,v_request.free_fire_uids,v_tournament.entry_fee,v_tournament.first_prize,v_tournament.second_prize,v_tournament.third_prize,v_tournament.kill_reward)
  returning id into v_participant_id;
  update public.tournament_join_requests set status='CONFIRMED',reviewed_at=now(),updated_at=now() where id=v_request.id;
  return v_participant_id;
end;
$function$;

revoke all on function public.request_tournament_join(bigint,jsonb) from public;
grant execute on function public.request_tournament_join(bigint,jsonb) to authenticated;
revoke all on function public.confirm_tournament_join(bigint) from public;
grant execute on function public.confirm_tournament_join(bigint) to authenticated;
