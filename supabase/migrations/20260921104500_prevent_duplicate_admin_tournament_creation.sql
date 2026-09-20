-- Creating a tournament must never silently modify/reuse an existing slot.
create or replace function public.admin_create_tournament(
  p_mode text,
  p_tournament_date date,
  p_scheduled_start_time time,
  p_entry_fee numeric default null,
  p_first_prize numeric default null,
  p_second_prize numeric default null,
  p_third_prize numeric default null,
  p_kill_reward numeric default null,
  p_max_players integer default null,
  p_max_teams integer default null
)
returns bigint
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_admin uuid:=auth.uid();
  v_template public.tournament_templates%rowtype;
  v_slot public.tournament_slots%rowtype;
  v_id bigint;
begin
  if v_admin is null or not exists(select 1 from public.profiles where id=v_admin and role='ADMIN')
    then raise exception 'Admin access required'; end if;
  if p_mode not in ('SOLO','DUO','SQUAD') then raise exception 'Invalid tournament mode'; end if;

  select * into v_template from public.tournament_templates where mode=p_mode;
  if not found then raise exception 'Tournament template not found'; end if;

  select * into v_slot from public.tournament_slots
  where mode=p_mode and start_time=p_scheduled_start_time and is_enabled=true limit 1;
  if not found then raise exception 'Start time does not match a configured enabled BR slot'; end if;

  if exists(select 1 from public.tournaments where slot_id=v_slot.id and tournament_date=p_tournament_date)
    then raise exception 'A tournament already exists for this slot and date.'; end if;

  insert into public.tournaments(
    template_id,slot_id,tournament_date,mode,scheduled_start_time,scheduled_end_time,
    entry_fee,first_prize,second_prize,third_prize,kill_reward,max_players,max_teams,
    status,registration_opens_at,is_enabled
  )
  values(
    v_template.id,v_slot.id,p_tournament_date,p_mode,v_slot.start_time,v_slot.end_time,
    coalesce(p_entry_fee,v_template.entry_fee),coalesce(p_first_prize,v_template.first_prize),
    coalesce(p_second_prize,v_template.second_prize),coalesce(p_third_prize,v_template.third_prize),
    coalesce(p_kill_reward,v_template.kill_reward),coalesce(p_max_players,v_template.max_players),
    coalesce(p_max_teams,v_template.max_teams),'REGISTRATION',now(),true
  )
  returning id into v_id;

  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,details)
  values(v_admin,'TOURNAMENT_CREATED','TOURNAMENT',v_id,
    jsonb_build_object('mode',p_mode,'tournament_date',p_tournament_date,'scheduled_start_time',p_scheduled_start_time));
  return v_id;
end;
$function$;