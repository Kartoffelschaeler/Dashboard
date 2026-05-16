create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) <= 160),
  completed boolean not null default false,
  created_at timestamp not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone,
  all_day boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'google',
  access_token text not null,
  refresh_token text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create unique index if not exists calendar_connections_provider_key
  on public.calendar_connections(provider);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'todos'
      and column_name = 'title'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'todos'
      and column_name = 'text'
  ) then
    alter table public.todos rename column title to text;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'todos'
      and column_name = 'is_complete'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'todos'
      and column_name = 'completed'
  ) then
    alter table public.todos rename column is_complete to completed;
  end if;
end $$;

alter table public.todos enable row level security;

alter table public.calendar_events enable row level security;

alter table public.calendar_connections enable row level security;

drop policy if exists "Allow public read access" on public.todos;
drop policy if exists "Allow public insert access" on public.todos;
drop policy if exists "Allow public update access" on public.todos;
drop policy if exists "Allow public delete access" on public.todos;
drop policy if exists "Allow public calendar read access" on public.calendar_events;
drop policy if exists "Allow public calendar insert access" on public.calendar_events;
drop policy if exists "Allow public calendar delete access" on public.calendar_events;
drop policy if exists "Allow public connection read access" on public.calendar_connections;
