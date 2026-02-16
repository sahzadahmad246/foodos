import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserDropdown } from '@/components/user-dropdown'
import { createClient } from '@/lib/supabase/server'
import { EmailChangeAlert } from '@/components/email-change-alert'
import { Store, Bike, ChefHat, MapPin, Clock, Truck } from 'lucide-react'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams
  const message = params?.message

  // Check if this is an email change confirmation message
  const isEmailChangePending = message?.toLowerCase().includes('confirm') &&
    message?.toLowerCase().includes('other email')

  // Check user role
  let userRole: 'owner' | 'rider' | 'user' = 'user'

  if (user) {
    // Check if owner
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (restaurant) {
      userRole = 'owner'
    } else {
      // Check if rider
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-2xl font-bold">
            food<span className="text-primary">OS</span>
          </Link>

          <nav>
            {user ? (
              <UserDropdown
                user={{
                  email: user.email,
                  name: user.user_metadata?.full_name || user.user_metadata?.name,
                  avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
                }}
              />
            ) : (
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Email Change Alert */}
      {isEmailChangePending && user && (
        <EmailChangeAlert email={user.email} />
      )}

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          Restaurant Management
          <br />
          <span className="text-primary">Made Simple</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Streamline your orders, manage your menu, and delight your customers with foodOS.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          {!user ? (
            <>
              <Button size="lg" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Login</Link>
              </Button>
            </>
          ) : userRole === 'owner' ? (
            <Button size="lg" asChild className="gap-2">
              <Link href="/dashboard">
                <Store className="h-5 w-5" />
                Go to Dashboard
              </Link>
            </Button>
          ) : userRole === 'rider' ? (
            <Button size="lg" asChild className="gap-2">
              <Link href="/rider">
                <Bike className="h-5 w-5" />
                Rider Dashboard
              </Link>
            </Button>
          ) : (
            <Button size="lg" asChild className="gap-2">
              <Link href="/onboarding">
                <ChefHat className="h-5 w-5" />
                Start Your Restaurant
              </Link>
            </Button>
          )}
        </div>

        <section className="mt-20 text-left">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Order From Online Restaurants</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Explore restaurants currently accepting orders.
              </p>
            </div>
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
              {onlineRestaurants?.length || 0} online
            </Badge>
          </div>

          {!onlineRestaurants || onlineRestaurants.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
              No restaurants are online right now.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {onlineRestaurants.map((restaurant) => {
                const settingsRaw = restaurant.restaurant_settings as any[] | null
                const settings = Array.isArray(settingsRaw) ? settingsRaw[0] : settingsRaw
                const cuisines = (restaurant.cuisine_type || []).slice(0, 3)
                const location = [restaurant.city, restaurant.state].filter(Boolean).join(', ')

                return (
                  <Link
                    key={restaurant.id}
                    href={`/r/${restaurant.slug}`}
                    className="group overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative h-36 w-full bg-muted">
                      {restaurant.cover_image_url ? (
                        <Image
                          src={restaurant.cover_image_url}
                          alt={restaurant.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-950/40 dark:to-amber-950/30" />
                      )}
                      <div className="absolute right-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                        Online
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="relative h-11 w-11 overflow-hidden rounded-full border bg-background">
                          {restaurant.logo_url ? (
                            <Image
                              src={restaurant.logo_url}
                              alt={`${restaurant.name} logo`}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                              {restaurant.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-foreground">{restaurant.name}</h3>
                          {location && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              {location}
                            </p>
                          )}
                        </div>
                      </div>

                      {restaurant.description && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{restaurant.description}</p>
                      )}

                      {cuisines.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {cuisines.map((cuisine: string) => (
                            <Badge key={cuisine} variant="secondary" className="text-xs">
                              {cuisine}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Truck className="h-3.5 w-3.5" />
                          {settings?.delivery_fee ? `₹${Number(settings.delivery_fee).toFixed(0)} delivery` : 'Free/Variable delivery'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Min ₹{Number(settings?.min_order_amount || 0).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
