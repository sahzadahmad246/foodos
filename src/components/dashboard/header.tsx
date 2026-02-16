'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { UserDropdown } from '@/components/user-dropdown'
import { MobileSidebar, getPageTitle } from '@/components/dashboard/sidebar'
import { OnlineToggle } from '@/components/dashboard/online-toggle'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
    user: User
    restaurant: {
        id: string
        name: string
        slug: string
        logo_url: string | null
        is_active: boolean
    }
    profileComplete: boolean
}

export function DashboardHeader({ user, restaurant, profileComplete }: HeaderProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const riderName = searchParams.get('name')
    const [resolvedRiderName, setResolvedRiderName] = useState<string | null>(null)

    const riderId =
        pathname.startsWith('/dashboard/riders/')
            ? pathname.split('/')[3] || null
            : null

    useEffect(() => {
        if (!riderId || riderName) {
            return
        }

        let cancelled = false
        ;(async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('riders')
                .select('name')
                .eq('id', riderId)
                .maybeSingle()

            if (!cancelled) {
                setResolvedRiderName(data?.name || null)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [riderId, riderName])

    const pageTitle =
        pathname.startsWith('/dashboard/riders/')
            ? resolvedRiderName || 'Rider Details'
            : getPageTitle(pathname)

    return (
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6 sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <MobileSidebar restaurant={restaurant} />
                <h1 className="text-lg font-semibold">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    <Link href={`/r/${restaurant.slug}`} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                        <span className="hidden sm:inline">View Menu</span>
                    </Link>
                </Button>
                <OnlineToggle
                    restaurantId={restaurant.id}
                    isActive={restaurant.is_active}
                    profileComplete={profileComplete}
                />
                <UserDropdown
                    user={{
                        email: user.email,
                        name: user.user_metadata?.full_name || user.user_metadata?.name,
                        avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
                    }}
                />
            </div>
        </header>
    )
}
