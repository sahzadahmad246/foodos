'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, ChevronDown, User, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocation } from '@/hooks/use-location'
import { AddressSelector } from './address-selector'
import { ProfileSidebar } from './profile-sidebar'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface CustomerHeaderProps {
    restaurant: {
        name: string
        logo_url?: string | null
    }
    user?: SupabaseUser | null
}

export function CustomerHeader({ restaurant, user }: CustomerHeaderProps) {
    const [showAddressSelector, setShowAddressSelector] = useState(false)
    const [showProfileSidebar, setShowProfileSidebar] = useState(false)
    const { currentLocation, selectedAddress, isDetecting } = useLocation()

    // Build location display text
    let locationDisplay = 'Select location'

    if (selectedAddress) {
        // Show full address for saved addresses
        locationDisplay = selectedAddress.flat_building || ''
        if (selectedAddress.locality) {
            locationDisplay += `, ${selectedAddress.locality}`
        }
    } else if (currentLocation?.locality) {
        // Show just locality for detected location
        locationDisplay = currentLocation.locality
    }

    return (
        <>
            <header className="sticky top-0 z-40 bg-background border-b">
                <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
                    {/* Logo & Name - Hidden on mobile */}
                    <div className="hidden md:flex items-center gap-3 min-w-0 flex-shrink">
                        {restaurant.logo_url && (
                            <img
                                src={restaurant.logo_url}
                                alt={restaurant.name}
                                className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                            />
                        )}
                        <h1 className="font-bold text-lg truncate">{restaurant.name}</h1>
                    </div>

                    {/* Location Display - Wraps on mobile, no box */}
                    <button
                        onClick={() => setShowAddressSelector(true)}
                        className="flex items-start gap-1.5 flex-1 md:flex-initial md:max-w-xs min-w-0 text-left"
                    >
                        <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs leading-tight text-foreground line-clamp-2 break-words">
                                {isDetecting ? 'Detecting location...' : locationDisplay}
                            </p>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground hidden sm:block" />
                    </button>

                    {/* Login / Profile */}
                    {user ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowProfileSidebar(true)}
                            className="flex-shrink-0 h-9 w-9"
                        >
                            {user.user_metadata?.avatar_url ? (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt={user.user_metadata?.full_name || 'User'}
                                    className="h-7 w-7 rounded-full"
                                />
                            ) : (
                                <User className="h-4 w-4" />
                            )}
                        </Button>
                    ) : (
                        <Button
                            asChild
                            variant="default"
                            size="sm"
                            className="flex-shrink-0 h-9 px-3"
                        >
                            <Link href="/login">
                                <LogIn className="h-3.5 w-3.5 sm:mr-2" />
                                <span className="hidden sm:inline text-xs">Login</span>
                            </Link>
                        </Button>
                    )}
                </div>
            </header>

            {/* Address Selector Modal */}
            <AddressSelector
                open={showAddressSelector}
                onClose={() => setShowAddressSelector(false)}
                userId={user?.id}
            />

            {/* Profile Sidebar */}
            {user && (
                <ProfileSidebar
                    open={showProfileSidebar}
                    onClose={() => setShowProfileSidebar(false)}
                    user={user}
                />
            )}
        </>
    )
}
