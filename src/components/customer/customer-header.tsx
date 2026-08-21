'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, ChevronDown, User, LogIn, Clock3, Bike, Star, Sparkles } from 'lucide-react'
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
    let locationSub = 'Choose where we should deliver'

    if (selectedAddress) {
        locationTitle = selectedAddress.flat_building || selectedAddress.locality || 'Saved address'
        locationSub = [selectedAddress.locality, selectedAddress.city].filter(Boolean).join(', ')
    } else if (currentLocation?.locality) {
        locationTitle = currentLocation.locality
        locationSub = 'Current location'
    }

    return (
        <>
            <header className="bg-background text-foreground">
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <button
                        type="button"
                        onClick={() => setShowAddressSelector(true)}
                        className="min-w-0 flex-1 rounded-xl py-1 text-left transition hover:bg-muted/40"
                    >
                        <span className="flex items-center gap-1.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                                <MapPin className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Delivering to</span>
                                <span className="block truncate text-[14px] font-bold leading-tight">
                                {isDetecting ? 'Detecting location...' : locationTitle}
                                </span>
                            </span>
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </span>
                        {locationSub ? (
                            <p className="ml-9 mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{locationSub}</p>
                        ) : null}
                    </button>

                    {user ? (
                        <button
                            type="button"
                            onClick={() => setShowProfileSidebar(true)}
                            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 ring-2 ring-primary/20"
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
                                <User className="h-5 w-5 text-primary" />
                            )}
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground"
                        >
                            <LogIn className="h-3.5 w-3.5" />
                            Login
                        </Link>
                    )}
                </div>

                <div className="px-3 pb-3">
                    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                        <div className="relative h-32 bg-muted">
                            {restaurant.image_url || restaurant.logo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={restaurant.image_url || restaurant.logo_url || ''}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,hsl(var(--primary)/0.32),transparent_34%),linear-gradient(135deg,hsl(var(--primary)/0.18),hsl(var(--accent)/0.18),transparent)]" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/18 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                                <div className="flex min-w-0 items-end gap-2.5">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-card text-sm font-bold text-primary shadow-sm">
                                        {restaurant.logo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={restaurant.logo_url} alt={restaurant.name} className="h-full w-full object-cover" />
                                        ) : (
                                            restaurant.name.slice(0, 2).toUpperCase()
                                        )}
                                    </div>
                                    <div className="min-w-0 pb-1 text-white drop-shadow">
                                        <h1 className="truncate text-xl font-black leading-tight tracking-tight">{restaurant.name}</h1>
                                        {restaurant.description ? (
                                            <p className="mt-0.5 line-clamp-1 text-xs text-white/85">{restaurant.description}</p>
                                        ) : null}
                                    </div>
                                </div>
                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ${
                                    restaurant.is_online === false
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-primary text-primary-foreground'
                                }`}>
                                    {restaurant.is_online === false ? 'Closed' : 'Open'}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 divide-x divide-border/70 border-t border-border/70">
                            <div className="flex min-w-0 flex-col items-center justify-center px-2 py-2.5 text-center">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold">
                                    <Clock3 className="h-3 w-3 text-primary" />
                                    30-35 min
                                </span>
                                <span className="mt-0.5 text-[10px] text-muted-foreground">Average</span>
                            </div>
                            <div className="flex min-w-0 flex-col items-center justify-center px-2 py-2.5 text-center">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold">
                                    <Bike className="h-3 w-3 text-primary" />
                                    Delivery
                                </span>
                                <span className="mt-0.5 text-[10px] text-muted-foreground">Available</span>
                            </div>
                            <div className="flex min-w-0 flex-col items-center justify-center px-2 py-2.5 text-center">
                                <span className="inline-flex max-w-full items-center gap-1 text-[11px] font-bold">
                                    {restaurant.city ? <Star className="h-3 w-3 shrink-0 text-primary" /> : <Sparkles className="h-3 w-3 shrink-0 text-primary" />}
                                    <span className="truncate">{restaurant.city || 'Fresh'}</span>
                                </span>
                                <span className="mt-0.5 text-[10px] text-muted-foreground">{restaurant.city ? 'Location' : 'Kitchen'}</span>
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
