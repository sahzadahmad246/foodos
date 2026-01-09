# foodOS - Implementation Plan

## 🎯 Goal
Build a robust, multi-tenant SaaS for restaurants to manage online ordering, fleet, and kitchen operations.
**Core Workflow**: Custom Restaurant Link -> Customer Order -> Admin Dashboard (KOT) -> Rider Delivery.

## 🏗 Architecture
- **Runtime/Package Manager**: Bun (Latest)
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + Shadcn UI (Zinc/Neutral theme)
- **Database + Auth**: Supabase (PostgreSQL, Realtime, Auth)
- **Storage**: Cloudinary (for optimized image delivery)
- **Email**: Resend (for transactional emails)
- **State Management**: React Query + Zustand

### URL Structure
- `foodos.com/` - SaaS Landing Page (Marketing)
- `foodos.com/dashboard` - Restaurant Admin Console (Protected)
- `foodos.com/rider` - Delivery Partner Portal (Mobile-first view)
- `foodos.com/[restaurant-slug]` - Customer Storefront (Public)
  - e.g., `foodos.com/pizza-palace`

## 🛒 Features & Flow

### 1. Restaurant Dashboard (The "Command Center")
- **Authentication**: Email/Password login + Google OAuth.
- **Menu Manager**:
  - Categories (Starters, Mains)
  - Items (Name, Price, Image, "Out of Stock" toggle)
- **Rider Manager**: Add Riders (Name, Phone, Vehicle Number). Returns a simple username/pass for them.
- **Live Order Board**:
  - Columns: **Pending** -> **Preparing** -> **Ready** -> **Out for Delivery** -> **Delivered**.
  - **Action**: "Accept & Print KOT" (Simulated KOT view).
  - **Action**: "Assign Rider" (Dropdown of available riders).

### 2. Customer View (The "Ordering Experience")
- **Menu Browsing**: Sticky categories, search, food images.
- **Cart**: Slide-over drawer with item customization (optional: simple notes).
- **Checkout**: Guest checkout or simple OTP (if viable), collect Delivery Address.
- **Order Tracking**: Real-time status updates (Accepted -> Preparing...).

### 3. Delivery Partner Portal
- Simple PIN/Password login.
- **"My Jobs"**: List of assigned orders.
- **Actions**:
  - "Swipe to Pickup" (Changes order status to 'Out for Delivery')
  - "Swipe to Complete" (Changes order status to 'Delivered')

## 💾 Database Schema (Supabase)

### Tables
1.  **profiles** (Linked to Auth): Role (`admin`, `rider`, `customer`), RestaurantID.
2.  **restaurants**: `id`, `name`, `slug`, `logo_url`, `description`, `owner_id`.
3.  **categories**: `id`, `restaurant_id`, `name`, `sort_order`.
4.  **menu_items**: `id`, `category_id`, `name`, `description`, `price`, `image_url`, `is_available`.
5.  **riders**: `id`, `restaurant_id`, `name`, `phone_number`, `pin_code`.
6.  **orders**: `id`, `restaurant_id`, `customer_name`, `customer_address`, `total_amount`, `status` (`pending`, `preparing`, `ready`, `picked_up`, `delivered`), `rider_id`.
7.  **order_items**: `id`, `order_id`, `menu_item_id`, `quantity`, `price_at_time`.

## 💡 Suggestions & Enhancements
- **QR Code Generator**: In the dashboard, auto-generate a printable QR code pointing to `/[slug]` for tables.
- **Audio Notifications**: Play a sound in the dashboard when a new order arrives (Critical for restaurants).
- **Rider Performance**: Track how many orders each rider delivered.

## 📝 Next Steps
1.  **Initialize**: Scaffold the Next.js project.
2.  **Setup Supabase**: Create a generic schema script.
3.  **Build Components**: Create basic inputs, buttons, and layout shells (Shadcn).
