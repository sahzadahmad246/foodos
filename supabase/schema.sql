-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User role enum
create type user_role as enum ('customer', 'restaurant_owner', 'rider', 'admin');

-- Vehicle type enum for riders
create type vehicle_type as enum ('bike', 'scooter', 'car', 'bicycle');

-- Order status enum
create type order_status as enum ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled');

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

-- Table: menu_items
create table if not exists menu_items (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  price decimal(10, 2) not null,
  image_url text,
  is_veg boolean default true,
  is_available boolean default true,
  preparation_time_mins int,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
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
