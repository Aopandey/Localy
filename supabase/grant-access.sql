-- FIRST: create your Localy user from the app's sign-in screen and confirm its email.
-- THEN: replace the email below and run this in the Supabase SQL Editor.
-- This is separate from signing into the Supabase dashboard with GitHub.
do $$
declare
  member_email text := 'aopandey24@gmail.com';
  member_id uuid;
begin
  select id into member_id from auth.users where lower(email) = lower(member_email);
  if member_id is null then
    raise exception 'No Localy user found for this email. Create the account in Localy and confirm the email first.';
  end if;
  insert into public.localy_members(workspace_id, user_id)
  values ('localy', member_id)
  on conflict (workspace_id, user_id) do nothing;
end $$;
