create or replace function public.admin_create_uid_result(
  p_tournament_id bigint,p_participant_id bigint,p_position integer,p_player_kills jsonb,p_proof_url text default null
) returns bigint language plpgsql security definer set search_path='' as $$
declare v_admin uuid:=auth.uid(); v_t public.tournaments%rowtype; v_p public.tournament_participants%rowtype;
v_result_id bigint; v_uids jsonb; v_total_kills integer:=0; v_kill_reward numeric:=0; v_position_prize numeric:=0;
v_uid text; v_kills integer; v_user uuid; v_captain uuid;
begin
if v_admin is null or not exists(select 1 from public.profiles where id=v_admin and role='ADMIN') then raise exception 'Admin access required'; end if;
if p_position<1 or jsonb_typeof(p_player_kills)<>'object' then raise exception 'Invalid result values'; end if;
select * into v_t from public.tournaments where id=p_tournament_id for update;
if not found then raise exception 'Tournament not found'; end if;
if v_t.status not in ('STARTED','COMPLETED') then raise exception 'Tournament must be started or completed'; end if;
select * into v_p from public.tournament_participants where id=p_participant_id and tournament_id=p_tournament_id and status='JOINED';
if not found then raise exception 'Joined participant not found'; end if;
v_uids:=v_p.free_fire_uids;
if jsonb_array_length(v_uids) <> (select count(*) from jsonb_object_keys(p_player_kills)) then raise exception 'Kills must be entered for every registered UID'; end if;
if p_position=1 then v_position_prize:=v_t.first_prize; elsif p_position=2 then v_position_prize:=v_t.second_prize; elsif p_position=3 then v_position_prize:=v_t.third_prize; end if;
v_captain:=v_p.user_id;
if exists(select 1 from public.tournament_results where participant_id=p_participant_id) then raise exception 'A result already exists for this participant in this tournament'; end if;
insert into public.tournament_results(tournament_id,participant_id,position,kills,position_prize,kill_reward,total_payout,proof_url,player_uid,reward_recipient_user_id)
values(p_tournament_id,p_participant_id,p_position,0,v_position_prize,0,v_position_prize,nullif(trim(coalesce(p_proof_url,'')),''),v_p.captain_free_fire_uid,v_captain) returning id into v_result_id;
for v_uid in select jsonb_array_elements_text(v_uids) loop
 if not (p_player_kills ? v_uid) then raise exception 'Missing kills for UID %',v_uid; end if;
 v_kills:=greatest(0,(p_player_kills->>v_uid)::integer); v_total_kills:=v_total_kills+v_kills; v_kill_reward:=v_kill_reward+(v_kills*v_t.kill_reward);
 select id into v_user from public.profiles where free_fire_uid=v_uid limit 1;
 insert into public.tournament_result_players(result_id,participant_id,player_uid,user_id,position_prize,kills,kill_reward,total_payout,reward_recipient_user_id)
 values(v_result_id,p_participant_id,v_uid,v_user,case when v_uid=v_p.captain_free_fire_uid then v_position_prize else 0 end,v_kills,v_kills*v_t.kill_reward,
 case when v_uid=v.p_captain_free_fire_uid then v_position_prize+(v_kills*v_t.kill_reward) else v_kills*v_t.kill_reward end,coalesce(v_user,v_captain));
end loop;
update public.tournament_results set kills=v_total_kills,kill_reward=v_kill_reward,total_payout=v_position_prize+v_kill_reward where id=v_result_id;
return v_result_id;
end; $$;

create or replace function public.admin_approve_result_payout(p_result_id bigint)
returns numeric language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_result public.tournament_results%rowtype; v_row record; v_wallet_id bigint; v_balance numeric; v_amount numeric;
begin
if v_actor is null or not exists(select 1 from public.profiles where id=v_actor and role='ADMIN') then raise exception 'Admin access required'; end if;
select * into v_result from public.tournament_results where id=p_result_id and verification_status='VERIFIED' and published_at is not null for update;
if not found then raise exception 'Verified and published result not found'; end if;
if exists(select 1 from public.wallet_transactions where tournament_id=v_result.tournament_id and transaction_type in ('POSITION_PRIZE','KILL_REWARD') and description like 'RESULT_PAYOUT:'||p_result_id::text||':%') then return v_result.total_payout; end if;
for v_row in select * from public.tournament_result_players where result_id=p_result_id order by id loop
 v_amount:=v_row.total_payout; if v_amount<=0 then continue; end if;
 select id,balance into v_wallet_id,v_balance from public.wallets where user_id=v_row.reward_recipient_user_id for update;
 if not found then raise exception 'Wallet not found for reward recipient of UID %',v_row.player_uid; end if;
 if v_row.position_prize>0 then
  insert into public.wallet_transactions(wallet_id,transaction_type,amount,balance_before,balance_after,tournament_id,description)
  values(v_wallet_id,'POSITION_PRIZE',v_row.position_prize,v_balance,v_balance+v_row.position_prize,v_result.tournament_id,'RESULT_PAYOUT:'||p_result_id||':POSITION:'||v_row.player_uid);
  v_balance:=v_balance+v_row.position_prize;
 end if;
 if v_row.kill_reward>0 then
  insert into public.wallet_transactions(wallet_id,transaction_type,amount,balance_before,balance_after,tournament_id,description)
  values(v_wallet_id,'KILL_REWARD',v_row.kill_reward,v_balance,v_balance+v_row.kill_reward,v_result.tournament_id,'RESULT_PAYOUT:'||p_result_id||':KILL:'||v_row.player_uid);
  v_balance:=v_balance+v_row.kill_reward;
 end if;
 update public.wallets set balance=v_balance,updated_at=now() where id=v_wallet_id;
end loop;
insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,details)
values(v_actor,'PRIZE_PAYOUT_APPROVED_UID_SPLIT','TOURNAMENT_RESULT',p_result_id,jsonb_build_object('tournament_id',v_result.tournament_id,'total',v_result.total_payout));
return v_result.total_payout;
end; $$;
revoke all on function public.admin_create_uid_result(bigint,bigint,integer,jsonb,text) from public;
grant execute on function public.admin_create_uid_result(bigint,bigint,integer,jsonb,text) to authenticated;
revoke all on function public.admin_approve_result_payout(bigint) from public;
grant execute on function public.admin_approve_result_payout(bigint) to authenticated;
