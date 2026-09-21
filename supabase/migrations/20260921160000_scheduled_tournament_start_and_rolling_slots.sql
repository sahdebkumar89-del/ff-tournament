create or replace function public.auto_start_full_tournaments()
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_count integer := 0;
  v_t public.tournaments%rowtype;
begin
  for v_t in
    select t.*
    from public.tournaments t
    where t.status in ('REGISTRATION','FULL')
      and ((t.tournament_date + t.scheduled_start_time) at time zone 'Asia/Dhaka') <= now()
      and ((t.tournament_date + t.scheduled_start_time) at time zone 'Asia/Dhaka') > now() - interval '1 day'
    for update skip locked
  loop
    update public.tournaments
    set status = 'STARTED',
        updated_at = now()
    where id = v_t.id
      and status in ('REGISTRATION','FULL');

    if found then
      v_count := v_count + 1;
      insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, details)
      values (
        null,
        'AUTO_START_SCHEDULED',
        'TOURNAMENT',
        v_t.id,
        jsonb_build_object(
          'mode', v_t.mode,
          'scheduled_start', v_t.tournament_date + v_t.scheduled_start_time
        )
      );
    end if;
  end loop;
  return v_count;
end;
$function$;

create or replace function public.ensure_future_tournaments()
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_created integer := 0;
  v_day date := (now() at time zone 'Asia/Dhaka')::date;
  v_slot public.tournament_slots%rowtype;
  v_template public.tournament_templates%rowtype;
begin
  for v_slot in
    select *
    from public.tournament_slots
    where is_enabled = true
    order by slot_number
  loop
    select *
    into v_template
    from public.tournament_templates
    where mode = v_slot.mode
    limit 1;

    if not found then
      continue;
    end if;

    insert into public.tournaments (
      template_id, slot_id, tournament_date, mode,
      scheduled_start_time, scheduled_end_time,
      entry_fee, first_prize, second_prize, third_prize,
      kill_reward, max_players, max_teams,
      status, registration_opens_at, is_enabled
    )
    values (
      v_template.id, v_slot.id, v_day, v_slot.mode,
      v_slot.start_time, v_slot.end_time,
      v_template.entry_fee, v_template.first_prize,
      v_template.second_prize, v_template.third_prize,
      v_template.kill_reward, v_template.max_players,
      v_template.max_teams, 'REGISTRATION', now(), true
    )
    on conflict (slot_id, tournament_date) do nothing;

    if found then
      v_created := v_created + 1;
    end if;
  end loop;

  return v_created;
end;
$function$;