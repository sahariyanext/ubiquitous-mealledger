create table if not exists public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_date date not null,
  cost numeric(10, 2) not null default 0 check (cost >= 0),
  skipped boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, meal_date)
);

alter table public.meal_entries enable row level security;

create policy "Users can view their own meal entries"
  on public.meal_entries for select
  using (auth.uid() = user_id);

create policy "Users can create their own meal entries"
  on public.meal_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own meal entries"
  on public.meal_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own meal entries"
  on public.meal_entries for delete
  using (auth.uid() = user_id);

create or replace function public.set_meal_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists meal_entries_updated_at on public.meal_entries;

create trigger meal_entries_updated_at
  before update on public.meal_entries
  for each row execute function public.set_meal_entries_updated_at();
