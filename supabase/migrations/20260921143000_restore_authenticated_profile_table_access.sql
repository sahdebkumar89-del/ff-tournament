-- Restore the table privileges required by the authenticated user profile
-- policies and by tournament RLS policies that check profiles.
grant select, update on table public.profiles to authenticated;
