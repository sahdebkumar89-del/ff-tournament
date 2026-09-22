create or replace function public.admin_create_bulk_uid_results(
  p_tournament_id bigint,
  p_results jsonb,
  p_proof_url text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := auth.uid();
  v_t public.tournaments%rowtype;
  v_joined_count integer;
  v_item jsonb;
  v_count integer := 0;
  v_seen jsonb := '{}'::jsonb;
  v_participant_id bigint;
  v_position integer;
  v_kills jsonb;
  v_duplicate_positions integer;
begin
  if v_admin is null or not exists (
    select 1 from public.profiles where id = v_admin and role = 'ADMIN'
  ) then
    raise exception 'Admin access required';
  end if;

  if jsonb_typeof(p_results) <> 'array' or jsonb_array_length(p_results) = 0 then
    raise exception 'At least one participant result is required';
  end if;

  select * into v_t
  from public.tournaments
  where id = p_tournament_id
  for update;

  if not found then
    raise exception 'Tournament not found';
  end if;

  if v_t.status not in ('STARTED','COMPLETED') then
    raise exception 'Tournament must be started or completed';
  end if;

  select count(*) into v_joined_count
  from public.tournament_participants
  where tournament_id = p_tournament_id and status = 'JOINED';

  if jsonb_array_length(p_results) <> v_joined_count then
    raise exception 'Every joined participant must have a result before saving.';
  end if;

  for v_item in select value from jsonb_array_elements(p_results) loop
    if not (v_item ? 'participant_id') or not (v_item ? 'position') or not (v_item ? 'player_kills') then
      raise exception 'Each participant needs position and kills.';
    end if;

    v_participant_id := (v_item->>'participant_id')::bigint;
    v_position := (v_item->>'position')::integer;
    v_kills := v_item->'player_kills';

    if v_position < 1 then
      raise exception 'Position must be 1 or higher.';
    end if;

    if jsonb_typeof(v_kills) <> 'object' then
      raise exception 'Kills must be entered for every UID.';
    end if;

    if v_seen ? v_participant_id::text then
      raise exception 'A participant appears more than once.';
    end if;

    if not exists (
      select 1 from public.tournament_participants
      where id = v_participant_id
        and tournament_id = p_tournament_id
        and status = 'JOINED'
    ) then
      raise exception 'Invalid participant in result sheet.';
    end if;

    if exists (
      select 1 from public.tournament_results
      where participant_id = v_participant_id
    ) then
      raise exception 'A result already exists for one or more participants. Refresh the result sheet.';
    end if;

    if jsonb_array_length((select free_fire_uids from public.tournament_participants where id = v_participant_id))
       <> (select count(*) from jsonb_object_keys(v_kills)) then
      raise exception 'Kills must be entered for every registered UID.';
    end if;

    v_seen := v_seen || jsonb_build_object(v_participant_id::text, true);
    v_count := v_count + 1;
  end loop;

  select count(*) into v_duplicate_positions
  from (
    select (value->>'position')::integer as position
    from jsonb_array_elements(p_results)
    group by (value->>'position')::integer
    having count(*) > 1
  ) d;

  if v_duplicate_positions > 0 then
    raise exception 'Each finishing position can be used only once.';
  end if;

  for v_item in select value from jsonb_array_elements(p_results) loop
    perform public.admin_create_uid_result(
      p_tournament_id,
      (v_item->>'participant_id')::bigint,
      (v_item->>'position')::integer,
      v_item->'player_kills',
      p_proof_url
    );
  end loop;

  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, details)
  values (
    v_admin,
    'RESULTS_BULK_ENTERED',
    'TOURNAMENT',
    p_tournament_id,
    jsonb_build_object('participant_count', v_count)
  );

  return v_count;
end;
$$;

revoke all on function public.admin_create_bulk_uid_results(bigint,jsonb,text) from public;
grant execute on function public.admin_create_bulk_uid_results(bigint,jsonb,text) to authenticated;