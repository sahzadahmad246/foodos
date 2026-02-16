-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User role enum
create type user_role as enum ('customer', 'restaurant_owner', 'rider', 'admin');

-- Vehicle type enum for riders
create type vehicle_type as enum ('bike', 'scooter', 'car', 'bicycle');

-- Order status enum
create type order_status as enum ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled');

-- Rider cash ledger entry type
create type rider_cash_entry_type as enum ('collect', 'deposit');

-- Rider deposit request status
create type rider_deposit_request_status as enum ('pending', 'approved', 'rejected', 'cancelled');

-- Table: profiles (Extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  role user_role default 'customer',
  restaurant_id uuid, -- Will be FK after restaurants table created
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: restaurants
create table if not exists restaurants (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references auth.users not null,
  -- Basic Info (Required during onboarding)
  name text not null,
  slug text not null unique,
  -- Optional Info (Complete later)
  logo_url text,
  logo_public_id text,
  cover_image_url text,
  cover_public_id text,
  description text,
  cuisine_type text[] default '{}',
  phone text,
  phone_secondary text,
  email text,
  -- Address
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  pincode text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  -- Status
  is_active boolean default true,
  is_verified boolean default false,
  onboarding_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add FK to profiles after restaurants exists
alter table profiles add constraint profiles_restaurant_id_fkey 
  foreign key (restaurant_id) references restaurants(id) on delete set null;

-- Table: restaurant_settings
create table if not exists restaurant_settings (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants(id) on delete cascade unique not null,
  -- Tax & Legal
  has_gst boolean default false,
  gst_number text,
  gst_percentage decimal(4, 2) default 0,
  fssai_number text,
  -- Delivery Settings
  delivery_radius_km decimal(4, 1) default 5.0,
  min_order_amount decimal(10, 2) default 0,
  delivery_fee decimal(10, 2) default 0,
  free_delivery_above decimal(10, 2),
  -- Payment Settings
  cod_enabled boolean default true,
  online_payment_enabled boolean default false,
  razorpay_key_id text,
  razorpay_key_secret_encrypted text,
  -- Timing
  opening_time time default '09:00',
  closing_time time default '22:00',
  working_days text[] default '{"Mon","Tue","Wed","Thu","Fri","Sat","Sun"}',
  -- Orders
  auto_accept_orders boolean default false,
  avg_prep_time_mins int default 30,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: categories
create table if not exists categories (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  name text not null,
  description text,
  image_url text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: menu_items (World-class schema)
create table if not exists menu_items (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  
  -- Basic Info
  name text not null,
  description text,
  short_description text, -- For quick display
  
  -- Pricing
  price decimal(10, 2) not null,
  compare_at_price decimal(10, 2), -- Original price for discounts
  cost_price decimal(10, 2), -- For profit tracking
  
  -- Images
  image_url text,
  gallery_urls text[], -- Multiple images
  video_url text, -- Item video
  
  -- Classification
  is_veg boolean default true,
  is_available boolean default true,
  is_featured boolean default false, -- Show in featured section
  is_bestseller boolean default false,
  is_new boolean default false,
  is_spicy boolean default false,
  spice_level int default 0, -- 0-5 scale
  
  -- Variants (e.g., Small/Medium/Large)
  has_variants boolean default false,
  variants jsonb default '[]', -- [{name: "Small", price: 99}, {name: "Large", price: 149}]
  
  -- Addons/Extras
  has_addons boolean default false,
  addon_groups jsonb default '[]', -- [{group: "Toppings", items: [{name: "Cheese", price: 30}]}]
  
  -- Nutritional Info
  calories int,
  protein_grams decimal(5, 1),
  carbs_grams decimal(5, 1),
  fat_grams decimal(5, 1),
  fiber_grams decimal(5, 1),
  
  -- Dietary & Allergens
  allergens text[], -- ['nuts', 'dairy', 'gluten']
  dietary_tags text[], -- ['gluten-free', 'keto', 'halal', 'jain']
  
  -- Serving Info
  serves int default 1, -- Serves X people
  portion_size text, -- "250g", "2 pcs"
  
  -- Time & Availability
  preparation_time_mins int default 20,
  available_from time, -- Available only after this time
  available_until time, -- Available only until this time
  available_days text[] default '{"Mon","Tue","Wed","Thu","Fri","Sat","Sun"}',
  
  -- Inventory
  track_inventory boolean default false,
  stock_quantity int,
  low_stock_alert int default 5,
  
  -- SEO & Display
  tags text[], -- ['popular', 'must-try', 'chef-special']
  sort_order int default 0,
  
  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: riders
create table if not exists riders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  name text not null,
  phone text not null,
  vehicle_type vehicle_type default 'bike',
  vehicle_number text,
  is_active boolean default true,
  is_online boolean default false,
  cash_in_hand decimal(10, 2) default 0,
  cash_collected_total decimal(10, 2) default 0,
  cash_deposited_total decimal(10, 2) default 0,
  delivered_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: orders
create table if not exists orders (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants(id) not null,
  order_number text not null, -- Human readable: #ORD-001
  customer_id uuid references auth.users,
  customer_name text not null,
  customer_phone text,
  customer_address text,
  customer_latitude decimal(10, 8),
  customer_longitude decimal(11, 8),
  items_total decimal(10, 2) not null,
  delivery_fee decimal(10, 2) default 0,
  tax_amount decimal(10, 2) default 0,
  total_amount decimal(10, 2) not null,
  payment_method text default 'cod', -- 'cod' or 'online'
  payment_status text default 'pending', -- 'pending', 'paid', 'failed'
  status order_status default 'pending',
  rider_id uuid references riders(id),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: rider_cash_ledger
create table if not exists rider_cash_ledger (
  id uuid default uuid_generate_v4() primary key,
  rider_id uuid references riders(id) on delete cascade not null,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  order_id uuid references orders(id) on delete set null,
  type rider_cash_entry_type not null,
  amount decimal(10, 2) not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists rider_cash_ledger_rider_id_idx on rider_cash_ledger (rider_id);
create index if not exists rider_cash_ledger_restaurant_id_idx on rider_cash_ledger (restaurant_id);
create index if not exists rider_cash_ledger_created_at_idx on rider_cash_ledger (created_at desc);
create unique index if not exists rider_cash_ledger_collect_order_unique
  on rider_cash_ledger (order_id) where type = 'collect';

-- Table: rider_cash_deposit_requests
create table if not exists rider_cash_deposit_requests (
  id uuid default uuid_generate_v4() primary key,
  rider_id uuid references riders(id) on delete cascade not null,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  amount decimal(10, 2) not null,
  note text,
  status rider_deposit_request_status default 'pending' not null,
  requested_at timestamp with time zone default timezone('utc'::text, now()) not null,
  decided_at timestamp with time zone,
  decided_by uuid references auth.users,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists rider_cash_deposit_requests_rider_id_idx on rider_cash_deposit_requests (rider_id);
create index if not exists rider_cash_deposit_requests_restaurant_id_idx on rider_cash_deposit_requests (restaurant_id);
create index if not exists rider_cash_deposit_requests_status_idx on rider_cash_deposit_requests (status);

-- Table: order_items
create table if not exists order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  menu_item_id uuid references menu_items(id) on delete set null,
  name text not null, -- Snapshot
  price decimal(10, 2) not null, -- Snapshot
  quantity int not null default 1
);

-- Enable RLS
alter table profiles enable row level security;
alter table restaurants enable row level security;
alter table restaurant_settings enable row level security;
alter table categories enable row level security;
alter table menu_items enable row level security;
alter table riders enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table rider_cash_ledger enable row level security;
alter table rider_cash_deposit_requests enable row level security;

-- RLS Policies for restaurants
create policy "Users can view their own restaurant" on restaurants
  for select using (auth.uid() = owner_id);

create policy "Users can update their own restaurant" on restaurants
  for update using (auth.uid() = owner_id);

create policy "Users can insert their own restaurant" on restaurants
  for insert with check (auth.uid() = owner_id);

-- RLS Policies for restaurant_settings
create policy "Owners can manage their restaurant settings" on restaurant_settings
  for all using (
    restaurant_id in (select id from restaurants where owner_id = auth.uid())
  );

-- RLS Policies for profiles
create policy "Users can view their own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

-- RLS Policies for rider_cash_ledger
create policy "Owners can view their riders cash ledger" on rider_cash_ledger
  for select using (
    restaurant_id in (select id from restaurants where owner_id = auth.uid())
  );

create policy "Riders can view their own cash ledger" on rider_cash_ledger
  for select using (
    rider_id in (select id from riders where user_id = auth.uid())
  );

create policy "Riders can view their own cash ledger by email" on rider_cash_ledger
  for select using (
    rider_id in (select id from riders where email = (auth.jwt() ->> 'email'))
  );

create policy "Owners can record rider cash deposits" on rider_cash_ledger
  for insert with check (
    restaurant_id in (select id from restaurants where owner_id = auth.uid())
  );

-- RLS Policies for rider_cash_deposit_requests
create policy "Riders can create their deposit requests" on rider_cash_deposit_requests
  for insert with check (
    rider_id in (select id from riders where user_id = auth.uid())
  );

create policy "Riders can create deposit requests by email" on rider_cash_deposit_requests
  for insert with check (
    rider_id in (select id from riders where email = (auth.jwt() ->> 'email'))
  );

create policy "Riders can view their deposit requests" on rider_cash_deposit_requests
  for select using (
    rider_id in (select id from riders where user_id = auth.uid())
  );

create policy "Riders can view their deposit requests by email" on rider_cash_deposit_requests
  for select using (
    rider_id in (select id from riders where email = (auth.jwt() ->> 'email'))
  );

create policy "Riders can cancel their pending requests" on rider_cash_deposit_requests
  for update using (
    rider_id in (select id from riders where user_id = auth.uid())
    and status = 'pending'
  )
  with check (
    rider_id in (select id from riders where user_id = auth.uid())
    and status = 'cancelled'
  );

create policy "Riders can cancel pending requests by email" on rider_cash_deposit_requests
  for update using (
    rider_id in (select id from riders where email = (auth.jwt() ->> 'email'))
    and status = 'pending'
  )
  with check (
    rider_id in (select id from riders where email = (auth.jwt() ->> 'email'))
    and status = 'cancelled'
  );

create policy "Owners can view rider deposit requests" on rider_cash_deposit_requests
  for select using (
    restaurant_id in (select id from restaurants where owner_id = auth.uid())
  );

create policy "Owners can decide rider deposit requests" on rider_cash_deposit_requests
  for update using (
    restaurant_id in (select id from restaurants where owner_id = auth.uid())
  );

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Cash ledger application: maintain rider cash balances
create or replace function public.apply_rider_cash_ledger()
returns trigger as $$
declare
  current_cash numeric;
begin
  select coalesce(cash_in_hand, 0) into current_cash
  from riders
  where id = new.rider_id
  for update;

  if new.type = 'deposit' and current_cash < new.amount then
    raise exception 'Deposit exceeds cash in hand';
  end if;

  if new.type = 'collect' then
    update riders
      set cash_in_hand = coalesce(cash_in_hand, 0) + new.amount,
          cash_collected_total = coalesce(cash_collected_total, 0) + new.amount
      where id = new.rider_id;
  elsif new.type = 'deposit' then
    update riders
      set cash_in_hand = coalesce(cash_in_hand, 0) - new.amount,
          cash_deposited_total = coalesce(cash_deposited_total, 0) + new.amount
      where id = new.rider_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists apply_rider_cash_ledger_trigger on rider_cash_ledger;
create trigger apply_rider_cash_ledger_trigger
  after insert on rider_cash_ledger
  for each row execute procedure public.apply_rider_cash_ledger();

-- Order delivery trigger: count deliveries and record COD collections
create or replace function public.handle_order_delivered_cash()
returns trigger as $$
begin
  if (tg_op = 'UPDATE') then
    if (new.status = 'delivered' and (old.status is distinct from new.status)) then
      if new.rider_id is not null then
        update riders
          set delivered_count = coalesce(delivered_count, 0) + 1
          where id = new.rider_id;
      end if;

      if new.payment_method = 'cod' and new.rider_id is not null then
        insert into rider_cash_ledger (rider_id, restaurant_id, order_id, type, amount)
        values (new.rider_id, new.restaurant_id, new.id, 'collect', new.total_amount);
      end if;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists handle_order_delivered_cash_trigger on orders;
create trigger handle_order_delivered_cash_trigger
  after update on orders
  for each row execute procedure public.handle_order_delivered_cash();

-- Approve rider deposit request (creates ledger entry and marks approved)
create or replace function public.approve_rider_deposit_request(request_id uuid)
returns void as $$
declare
  req record;
  owner_ok boolean;
begin
  select *
  into req
  from rider_cash_deposit_requests
  where id = request_id
  for update;

  if req is null then
    raise exception 'Request not found';
  end if;

  if req.status <> 'pending' then
    raise exception 'Request already processed';
  end if;

  select exists(
    select 1 from restaurants where id = req.restaurant_id and owner_id = auth.uid()
  ) into owner_ok;

  if not owner_ok then
    raise exception 'Not authorized';
  end if;

  insert into rider_cash_ledger (rider_id, restaurant_id, order_id, type, amount, note)
  values (req.rider_id, req.restaurant_id, null, 'deposit', req.amount, req.note);

  update rider_cash_deposit_requests
    set status = 'approved',
        decided_at = timezone('utc'::text, now()),
        decided_by = auth.uid()
    where id = request_id;
end;
$$ language plpgsql security definer;

-- Reject rider deposit request
create or replace function public.reject_rider_deposit_request(request_id uuid)
returns void as $$
declare
  req record;
  owner_ok boolean;
begin
  select *
  into req
  from rider_cash_deposit_requests
  where id = request_id
  for update;

  if req is null then
    raise exception 'Request not found';
  end if;

  if req.status <> 'pending' then
    raise exception 'Request already processed';
  end if;

  select exists(
    select 1 from restaurants where id = req.restaurant_id and owner_id = auth.uid()
  ) into owner_ok;

  if not owner_ok then
    raise exception 'Not authorized';
  end if;

  update rider_cash_deposit_requests
    set status = 'rejected',
        decided_at = timezone('utc'::text, now()),
        decided_by = auth.uid()
    where id = request_id;
end;
$$ language plpgsql security definer;
