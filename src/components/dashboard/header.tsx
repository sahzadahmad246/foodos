'use client'

import { User } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ArrowUpRight, CircleHelp } from 'lucide-react'
import { UserDropdown } from '@/components/user-dropdown'
import { MobileSidebar, getPageTitle } from '@/components/dashboard/sidebar'
import { OnlineToggle } from '@/components/dashboard/online-toggle'
import { Button } from '@/components/ui/button'

interface HeaderProps {
    user: User
    restaurant: { id: string; name: string; slug: string; logo_url: string | null; is_active: boolean }
    profileComplete: boolean
}

export function DashboardHeader({ user, restaurant, profileComplete }: HeaderProps) {
    const pathname = usePathname()
    const pageTitle = getPageTitle(pathname)
    return (
        <header className="dashboard-header sticky top-0 z-20 flex h-[76px] items-center justify-between border-b px-4 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
                <MobileSidebar restaurant={restaurant} />
                <div className="min-w-0">
                    <p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:block">Restaurant operations</p>
                    <h1 className="truncate font-serif text-xl md:text-2xl">{pageTitle}</h1>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                <span className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex"><CircleHelp className="size-4" /> Need a hand?</span>
                <Button asChild variant="outline" size="sm" className="hidden gap-2 rounded-full sm:flex">
                    <Link href={`/r/${restaurant.slug}`} target="_blank"><ArrowUpRight data-icon="inline-end" /> View menu</Link>
                </Button>
                <OnlineToggle restaurantId={restaurant.id} isActive={restaurant.is_active} profileComplete={profileComplete} />
                <UserDropdown user={{ email: user.email, name: user.user_metadata?.full_name || user.user_metadata?.name, avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture }} />
            </div>
        </header>
    )
}
