create or replace function public.generate_ready_next_day_tournaments()
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_created integer := 0;
  v_t public.tournaments%rowtype;
  v_open_at timestamptz;
  v_new_id bigint;
begin
  for v_t in
    select t.*
    from public.tournaments t
    where t.status = 'COMPLETED'
      and not exists (
        select 1 from public.tournaments n
        where n.slot_id = t.slot_id
          and n.tournament_date = t.tournament_date + 1
      )
    order by t.tournament_date, t.slot_id
  loop
    v_open_at := greatest(
      coalesce(v_t.completed_at, now()) + interval '1 hour',
      (
        (
          v_t.tournament_date + v_t.scheduled_end_time
          + case when v_t.scheduled_end_time <= v_t.scheduled_start_time
                 then interval '1 day' else interval '0' end
        ) at time zone 'Asia/Dhaka'
      ) + interval '1 hour'
    );

    if v_open_at > now() then
      continue;
    end if;

    insert into public.tournaments (
      template_id, slot_id, tournament_date, mode,
      scheduled_start_time, scheduled_end_time,
      entry_fee, first_prize, second_prize, third_prize,
      kill_reward, max_players, max_teams, status,
      registration_opens_at, is_enabled
    )
    values (
      v_t.template_id, v_t.slot_id, v_t.tournament_date + 1, v_t.mode,
      v_t.scheduled_start_time, v_t.scheduled_end_time,
      v_t.entry_fee, v_t.first_prize, v_t.second_prize, v_t.third_prize,
      v_t.kill_reward, v_t.max_players, v_t.max_teams, 'REGISTRATION',
      v_open_at, true
    )
    on conflict (slot_id, tournament_date) do nothing
    returning id into v_new_id;

    if v_new_id is not null then
      v_created := v_created + 1;
    end if;
    v_new_id := null;
  end loop;

  return v_created;
end;
$function$;