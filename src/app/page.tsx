import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserDropdown } from '@/components/user-dropdown'
import { createClient } from '@/lib/supabase/server'
import { EmailChangeAlert } from '@/components/email-change-alert'
import { Store, Bike, ChefHat } from 'lucide-react'

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
      </main>
    </div>
  )
}
