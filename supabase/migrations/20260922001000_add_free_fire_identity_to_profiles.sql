alter table public.profiles
  add column if not exists free_fire_uid text,
  add column if not exists free_fire_ign text;

alter table public.profiles
  drop constraint if exists profiles_free_fire_uid_format_check;

alter table public.profiles
  add constraint profiles_free_fire_uid_format_check
  check (
    free_fire_uid is null
    or free_fire_uid ~ '^[0-9]{5,20}$'
  );

create unique index if not exists profiles_free_fire_uid_unique_idx
  on public.profiles (free_fire_uid)
  where free_fire_uid is not null;
