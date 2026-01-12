'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Location {
    latitude: number
    longitude: number
    locality: string | null
}

interface LocationStore {
    currentLocation: Location | null
    selectedAddress: Address | null
    isDetecting: boolean
    setCurrentLocation: (location: Location) => void
    setSelectedAddress: (address: Address | null) => void
    setIsDetecting: (isDetecting: boolean) => void
    clearLocation: () => void
}

interface Address {
    id?: string
    latitude: number
    longitude: number
    locality: string | null
    flat_building?: string
    landmark?: string
    city?: string
    state?: string
    pincode?: string
    address_type?: string
    is_default?: boolean
}

export const useLocation = create<LocationStore>()(
    persist(
        (set) => ({
            currentLocation: null,
            selectedAddress: null,
            isDetecting: false,

            setCurrentLocation: (location) => set({ currentLocation: location }),

            setSelectedAddress: (address) => set({ selectedAddress: address }),

            setIsDetecting: (isDetecting) => set({ isDetecting }),

            clearLocation: () => set({
                currentLocation: null,
                selectedAddress: null,
                isDetecting: false
            }),
        }),
        {
            name: 'foodos-location',
        }
    )
)
