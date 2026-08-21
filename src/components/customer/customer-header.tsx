'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, ChevronDown, User, LogIn, Clock3, Bike } from 'lucide-react'
import { useLocation } from '@/hooks/use-location'
import { AddressSelector } from './address-selector'
import { ProfileSidebar } from './profile-sidebar'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface CustomerHeaderProps {
    restaurant: {
        name: string
        logo_url?: string | null
        image_url?: string | null
        description?: string | null
        city?: string | null
        address_line1?: string | null
        is_online?: boolean | null
    }
    user?: SupabaseUser | null
}

export function CustomerHeader({ restaurant, user }: CustomerHeaderProps) {
    const [showAddressSelector, setShowAddressSelector] = useState(false)
    const [showProfileSidebar, setShowProfileSidebar] = useState(false)
    const { currentLocation, selectedAddress, isDetecting } = useLocation()

    let locationTitle = 'Select location'
    let locationSub = 'Set your delivery address'

    if (selectedAddress) {
        locationTitle = selectedAddress.flat_building || selectedAddress.locality || 'Saved address'
        locationSub = [selectedAddress.locality, selectedAddress.city].filter(Boolean).join(', ')
    } else if (currentLocation?.locality) {
        locationTitle = currentLocation.locality
        locationSub = 'Current location'
    }

    const cover = restaurant.image_url || restaurant.logo_url

    return (
        <>
            <header className="relative overflow-hidden bg-background text-foreground">
                <div className="relative h-48 w-full bg-gradient-to-br from-emerald-950 via-background to-card">
                    {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-black/35" />

                    <div className="relative z-10 flex items-start justify-between gap-3 px-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowAddressSelector(true)}
                            className="min-w-0 flex-1 text-left"
                        >
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">Deliver to</p>
                            <span className="mt-0.5 flex items-center gap-1">
                                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                                <span className="line-clamp-1 text-[15px] font-semibold text-white">
                                    {isDetecting ? 'Detecting location...' : locationTitle}
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 text-white/80" />
                            </span>
                            {locationSub ? (
                                <p className="ml-5 line-clamp-1 text-[11px] text-white/65">{locationSub}</p>
                            ) : null}
                        </button>

                        {user ? (
                            <button
                                type="button"
                                onClick={() => setShowProfileSidebar(true)}
                                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 shadow-lg backdrop-blur"
                                aria-label="Open profile"
                            >
                                {user.user_metadata?.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={user.user_metadata.avatar_url}
                                        alt={user.user_metadata?.full_name || 'User'}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="h-5 w-5 text-white" />
                                )}
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="inline-flex h-11 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur"
                            >
                                <LogIn className="h-3.5 w-3.5" />
                                Login
                            </Link>
                        )}
                    </div>
                </div>

                <div className="relative z-20 -mt-12 px-4 pb-3">
                    <div className="rounded-2xl border border-border/70 bg-card/95 p-3.5 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.65)] backdrop-blur">
                        <div className="flex items-start gap-3">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-muted">
                                {restaurant.logo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={restaurant.logo_url} alt={restaurant.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-primary">
                                        {restaurant.name.slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <h1 className="text-lg font-bold leading-tight">{restaurant.name}</h1>
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                        restaurant.is_online === false
                                            ? 'bg-amber-500/15 text-amber-200'
                                            : 'bg-primary/15 text-primary'
                                    }`}>
                                        {restaurant.is_online === false ? 'Offline' : 'Open'}
                                    </span>
                                </div>
                                {restaurant.description ? (
                                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{restaurant.description}</p>
                                ) : null}
                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                        <Clock3 className="h-3 w-3 text-primary" />
                                        30-35 min
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <Bike className="h-3 w-3 text-primary" />
                                        Delivery
                                    </span>
                                    {restaurant.city || restaurant.address_line1 ? (
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="h-3 w-3 text-primary" />
                                            <span className="line-clamp-1">{restaurant.city || restaurant.address_line1}</span>
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <AddressSelector
                open={showAddressSelector}
                onClose={() => setShowAddressSelector(false)}
                userId={user?.id}
            />

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
