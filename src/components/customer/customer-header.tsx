'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, ChevronDown, User, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocation } from '@/hooks/use-location'
import { AddressSelector } from './address-selector'
import { ProfileSidebar } from './profile-sidebar'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface CustomerHeaderProps { restaurant: { name: string; logo_url?: string | null }; user?: SupabaseUser | null }

export function CustomerHeader({ restaurant, user }: CustomerHeaderProps) {
    const [showAddressSelector, setShowAddressSelector] = useState(false)
    const [showProfileSidebar, setShowProfileSidebar] = useState(false)
    const { currentLocation, selectedAddress, isDetecting } = useLocation()
    let locationDisplay = 'Select delivery location'
    if (selectedAddress) { locationDisplay = selectedAddress.flat_building || ''; if (selectedAddress.locality) locationDisplay += `, ${selectedAddress.locality}` } else if (currentLocation?.locality) locationDisplay = currentLocation.locality
    return <>
        <header className="storefront-header sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl"><div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-3 px-4 md:px-8"><div className="flex min-w-0 items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary font-serif text-xl text-primary-foreground">{restaurant.logo_url ? <img src={restaurant.logo_url} alt={restaurant.name} className="size-full object-cover" /> : restaurant.name[0]}</div><h1 className="hidden truncate font-serif text-xl sm:block">{restaurant.name}</h1></div><button onClick={() => setShowAddressSelector(true)} className="flex min-w-0 max-w-[210px] items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-2 text-left transition-colors hover:border-primary/50 sm:max-w-xs"><MapPin className="size-3.5 shrink-0 text-primary" /><span className="min-w-0 flex-1 truncate text-xs">{isDetecting ? 'Detecting location...' : locationDisplay}</span><ChevronDown className="size-3.5 shrink-0 text-muted-foreground" /></button>{user ? <Button variant="outline" size="icon" onClick={() => setShowProfileSidebar(true)} className="size-9 shrink-0 rounded-full">{user.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt={user.user_metadata?.full_name || 'User'} className="size-7 rounded-full" /> : <User className="size-4" />}</Button> : <Button asChild size="sm" className="shrink-0 rounded-full"><Link href="/login"><LogIn data-icon="inline-start" /><span className="hidden sm:inline">Login</span></Link></Button>}</div></header>
        <AddressSelector open={showAddressSelector} onClose={() => setShowAddressSelector(false)} userId={user?.id} />
        {user && <ProfileSidebar open={showProfileSidebar} onClose={() => setShowProfileSidebar(false)} user={user} />}
    </>
}
