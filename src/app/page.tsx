import { createClient } from '@/lib/supabase/server'
import { HomeLanding, type LandingUserRole } from '@/components/landing/home-landing'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'foodOS — WhatsApp is not a kitchen display',
  description: 'The board, the docket, and the rider sheet for restaurants that take their own orders, collect cash, and send their own bikes.',
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams
  const message = params?.message

  const isEmailChangePending = message?.toLowerCase().includes('confirm') &&
    message?.toLowerCase().includes('other email')

  let userRole: LandingUserRole = 'user'

  if (user) {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (restaurant) {
      userRole = 'owner'
    } else {
      const { data: rider } = await supabase
        .from('riders')
        .select('id')
        .eq('email', user.email)
        .eq('is_active', true)
        .single()

      if (rider) {
        userRole = 'rider'
      }
    }
  }

  const { data: onlineRestaurants } = await supabase
    .from('restaurants')
    .select(`
      id,
      name,
      slug,
      logo_url,
      cover_image_url,
      description,
      cuisine_type,
      city,
      state,
      is_online,
      is_active,
      restaurant_settings(
        delivery_fee,
        min_order_amount
      )
    `)
    .eq('is_online', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(12)

  return (
    <HomeLanding
      user={user ? {
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      } : null}
      userRole={userRole}
      isEmailChangePending={Boolean(isEmailChangePending && user)}
      onlineRestaurants={onlineRestaurants || []}
    />
  )
}
