-- Keep a tournament registration alive by rolling the same row to the next day.
-- Do not create a replacement tournament and do not drop joined participants.

create or replace function public.resolve_unfilled_tournaments()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_t public.tournaments%rowtype;
  v_joined integer;
  v_capacity integer;
  v_start timestamptz;
  v_reason text;
  v_next_date date;
begin
  for v_t in
    select t.*
    from public.tournaments t
    where t.status in ('REGISTRATION','FULL')
      and ((t.tournament_date + t.scheduled_start_time) at time zone 'Asia/Dhaka') <= now()
      and ((t.tournament_date + t.scheduled_start_time) at time zone 'Asia/Dhaka') > now() - interval '1 day'
    order by t.tournament_date, t.slot_id
    for update skip locked
  loop
    select coalesce(sum(jsonb_array_length(p.free_fire_uids)) filter(where p.status='JOINED'),0)::integer
      into v_joined
    from public.tournament_participants p
    where p.tournament_id = v_t.id;

    v_capacity := case
      when v_t.mode = 'SOLO' then v_t.max_players
      when v_t.mode = 'DUO' then v_t.max_teams * 2
      else v_t.max_teams * 4
    end;

    if v_joined >= v_capacity then continue; end if;

    v_start := (v_t.tournament_date + v_t.scheduled_start_time) at time zone 'Asia/Dhaka';

    if v_joined = 0 then
      v_reason := 'NO_PARTICIPANTS';
    elsif now() < v_start + interval '5 minutes' then
      continue;
    else
      v_reason := 'NOT_FULL_AFTER_5_MINUTES';
    end if;

    v_next_date := v_t.tournament_date + 1;

    delete from public.tournaments n
    where n.slot_id = v_t.slot_id
      and n.tournament_date = v_next_date
      and n.id <> v_t.id
      and not exists (
        select 1 from public.tournament_participants p
        where p.tournament_id = n.id
      );

    if exists (
      select 1 from public.tournaments n
      where n.slot_id = v_t.slot_id
        and n.tournament_date = v_next_date
        and n.id <> v_t.id
    ) then
      continue;
    end if;

    update public.tournaments
    set tournament_date = v_next_date,
        status = 'REGISTRATION',
        completed_at = null,
        registration_opens_at = now(),
        updated_at = now()
    where id = v_t.id;

    insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, details)
    values (
      null, 'AUTO_ROLLOVER_NEXT_DAY', 'TOURNAMENT', v_t.id,
      jsonb_build_object(
        'reason', v_reason, 'mode', v_t.mode,
        'joined_players', v_joined, 'capacity_players', v_capacity,
        'old_date', v_t.tournament_date, 'new_date', v_next_date,
        'same_tournament', true
      )
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.generate_ready_next_day_tournaments()
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  return 0;
end;
$$;

create or replace function public.ensure_future_tournaments()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_created integer := 0;
  v_today date := (now() at time zone 'Asia/Dhaka')::date;
  v_slot public.tournament_slots%rowtype;
  v_template public.tournament_templates%rowtype;
  v_is_testing boolean;
begin
  for v_slot in
    select * from public.tournament_slots
    where is_enabled = true
    order by slot_number
  loop
    select * into v_template
    from public.tournament_templates
    where mode = v_slot.mode
    limit 1;

    if not found then continue; end if;

    v_is_testing := v_slot.slot_number between 31 and 33;

    insert into public.tournaments (
      template_id, slot_id, tournament_date, mode,
      scheduled_start_time, scheduled_end_time,
      entry_fee, first_prize, second_prize, third_prize,
      kill_reward, max_players, max_teams, status,
      registration_opens_at, is_enabled
    )
    values (
      v_template.id, v_slot.id, v_today, v_slot.mode,
      v_slot.start_time, v_slot.end_time,
      case when v_is_testing then 0 else v_template.entry_fee end,
      case when v_is_testing then 0 else v_template.first_prize end,
      case when v_is_testing then 0 else v_template.second_prize end,
      case when v_is_testing then 0 else v_template.third_prize end,
      case when v_is_testing then 0 else v_template.kill_reward end,
      v_template.max_players, v_template.max_teams, 'REGISTRATION',
      now(), true
    )
    on conflict (slot_id, tournament_date) do nothing;

    if found then v_created := v_created + 1; end if;
  end loop;

  return v_created;
end;
$$;