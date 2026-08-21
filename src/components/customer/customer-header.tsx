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
            <header className="relative z-30 overflow-hidden border-b border-border/70 bg-background text-foreground">
                <div className="relative mx-auto flex min-h-[82px] w-full items-center justify-between gap-3 px-4 py-5 sm:px-5">
                    <div className="flex flex-1 min-w-0 items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Deliver to</p>
                            <button
                                onClick={() => setShowAddressSelector(true)}
                                className="mt-0.5 inline-flex items-center gap-1 text-left"
                            >
                                <span className="line-clamp-1 break-words text-[15px] font-medium leading-tight text-foreground">
                                    {isDetecting ? 'Detecting location...' : locationDisplay}
                                </span>
                                <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* Login / Profile */}
                    {user ? (
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => setShowProfileSidebar(true)}
                            className="h-10 w-10 flex-shrink-0 rounded-full bg-muted text-foreground hover:bg-muted/80"
                        >
                            {user.user_metadata?.avatar_url ? (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt={user.user_metadata?.full_name || 'User'}
                                    className="h-8 w-8 rounded-full object-cover"
                                />
                            ) : (
                                <User className="h-5 w-5" />
                            )}
                        </Button>
                    ) : (
                        <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="h-10 flex-shrink-0 bg-muted px-3 text-foreground hover:bg-muted/80"
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
