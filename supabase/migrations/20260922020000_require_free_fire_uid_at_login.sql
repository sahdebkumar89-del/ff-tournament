create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  insert into public.profiles (id, free_fire_uid)
  values (
    new.id,
    case
      when coalesce(new.raw_user_meta_data ->> 'free_fire_uid', '') ~ '^[0-9]{5,20}$'
        then new.raw_user_meta_data ->> 'free_fire_uid'
      else null
    end
  );

  insert into public.wallets (user_id)
  values (new.id);

  return new;
end;
$function$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
