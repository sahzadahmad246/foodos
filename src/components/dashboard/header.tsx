'use client'

import { User } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'
import { UserDropdown } from '@/components/user-dropdown'
import { MobileSidebar, getPageTitle } from '@/components/dashboard/sidebar'
import { OnlineToggle } from '@/components/dashboard/online-toggle'

interface HeaderProps {
    user: User
    restaurant: {
        id: string
        name: string
        logo_url: string | null
        is_active: boolean
    }
    profileComplete: boolean
}

export function DashboardHeader({ user, restaurant, profileComplete }: HeaderProps) {
    const pathname = usePathname()
    const pageTitle = getPageTitle(pathname)

    return (
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6 sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <MobileSidebar restaurant={restaurant} />
                <h1 className="text-lg font-semibold">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-4">
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
