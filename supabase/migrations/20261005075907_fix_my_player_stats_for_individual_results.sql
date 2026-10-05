create or replace function public.get_my_player_stats()
returns table(
  played bigint,
  wins bigint,
  top_three bigint,
  kills bigint
)
language plpgsql
security definer
set search_path = public
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
  select
    count(distinct r.id)::bigint as played,
    count(distinct r.id) filter (where r.position = 1)::bigint as wins,
    count(distinct r.id) filter (where r.position between 1 and 3)::bigint as top_three,
    coalesce(sum(greatest(rp.kills, 0)), 0)::bigint as kills
  from public.tournament_result_players rp
  join public.tournament_results r on r.id = rp.result_id
  where rp.user_id = auth.uid()
    and r.verification_status = 'VERIFIED'
    and r.published_at is not null;
end;
$function$;

revoke all on function public.get_my_player_stats() from public;
grant execute on function public.get_my_player_stats() to authenticated;
