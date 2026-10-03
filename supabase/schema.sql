-- Run in your NEW Localy Supabase project's SQL Editor.
-- Three small tables: two feeds and a private workspace membership list.
-- No sample customer data is inserted by this migration.
begin;

create table if not exists public.localy_members (
  workspace_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.localy_community_posts (
  workspace_id text not null default 'localy',
  id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id),
  constraint localy_post_object check (jsonb_typeof(data) = 'object'),
  constraint localy_post_id check (data ? 'id' and jsonb_typeof(data->'id') = 'string' and data->>'id' = id)
);

create table if not exists public.localy_opportunities (
  workspace_id text not null default 'localy',
  id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id),
  constraint localy_opportunity_object check (jsonb_typeof(data) = 'object'),
  constraint localy_opportunity_id check (data ? 'id' and jsonb_typeof(data->'id') = 'string' and data->>'id' = id)
);

create index if not exists localy_posts_recent on public.localy_community_posts(workspace_id, created_at desc);
create index if not exists localy_opportunities_recent on public.localy_opportunities(workspace_id, created_at desc);

create or replace function public.localy_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists localy_posts_updated on public.localy_community_posts;
create trigger localy_posts_updated before update on public.localy_community_posts
for each row execute function public.localy_set_updated_at();
drop trigger if exists localy_opportunities_updated on public.localy_opportunities;
create trigger localy_opportunities_updated before update on public.localy_opportunities
for each row execute function public.localy_set_updated_at();

alter table public.localy_members enable row level security;
alter table public.localy_community_posts enable row level security;
alter table public.localy_opportunities enable row level security;

revoke all on public.localy_members, public.localy_community_posts, public.localy_opportunities from anon, authenticated;
grant usage on schema public to authenticated, service_role;
grant select on public.localy_members, public.localy_community_posts, public.localy_opportunities to authenticated;
grant all on public.localy_members, public.localy_community_posts, public.localy_opportunities to service_role;
revoke all on function public.localy_set_updated_at() from public, anon, authenticated;
grant execute on function public.localy_set_updated_at() to service_role;

drop policy if exists localy_read_own_membership on public.localy_members;
create policy localy_read_own_membership on public.localy_members for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists localy_read_posts on public.localy_community_posts;
create policy localy_read_posts on public.localy_community_posts for select to authenticated
using (exists (
  select 1 from public.localy_members m
  where m.workspace_id = localy_community_posts.workspace_id and m.user_id = (select auth.uid())
));

drop policy if exists localy_read_opportunities on public.localy_opportunities;
create policy localy_read_opportunities on public.localy_opportunities for select to authenticated
using (exists (
  select 1 from public.localy_members m
  where m.workspace_id = localy_opportunities.workspace_id and m.user_id = (select auth.uid())
));

-- Feed updates stream to signed-in members. Re-running this script is safe.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'localy_community_posts') then
      alter publication supabase_realtime add table public.localy_community_posts;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'localy_opportunities') then
      alter publication supabase_realtime add table public.localy_opportunities;
    end if;
  end if;
end $$;

commit;
