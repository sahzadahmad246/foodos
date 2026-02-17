'use client'

import { useEffect, useMemo, useState } from 'react'
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
    const BG_SLOT_MS = 10 * 60 * 1000
    const headerBgOptions = useMemo(
        () => [
            'bg-[#0b5d66]',
            'bg-[#0b4b63]',
            'bg-[#123d66]',
            'bg-[#1c3a63]',
        ],
        []
    )
    const [bgIndex, setBgIndex] = useState(
        () => Math.floor(Date.now() / BG_SLOT_MS) % headerBgOptions.length
    )

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

    useEffect(() => {
        const id = window.setInterval(() => {
            setBgIndex(Math.floor(Date.now() / BG_SLOT_MS) % headerBgOptions.length)
        }, 60 * 1000)
        return () => window.clearInterval(id)
    }, [headerBgOptions.length])

    return (
        <>
            <header className={`relative z-30 overflow-hidden text-white transition-colors duration-700 ${headerBgOptions[bgIndex]}`}>
                <div className="relative mx-auto w-full px-3 py-4 min-h-[74px] flex items-center justify-between gap-3 sm:px-4 sm:py-5">
                    <div className="flex flex-1 min-w-0 items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-white/80" />
                        <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.12em] text-white/70">Deliver to</p>
                            <button
                                onClick={() => setShowAddressSelector(true)}
                                className="mt-0.5 inline-flex items-center gap-1 text-left"
                            >
                                <span className="text-[15px] leading-tight text-white line-clamp-1 break-words font-medium">
                                    {isDetecting ? 'Detecting location...' : locationDisplay}
                                </span>
                                <ChevronDown className="h-4 w-4 flex-shrink-0 text-white/80" />
                            </button>
                        </div>
                    </div>

                    {/* Login / Profile */}
                    {user ? (
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => setShowProfileSidebar(true)}
                            className="flex-shrink-0 h-10 w-10 rounded-full bg-white/15 text-white hover:bg-white/25"
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
                            className="flex-shrink-0 h-10 px-3 bg-white/15 text-white hover:bg-white/25"
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
