'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useLocation } from '@/hooks/use-location'
import { reverseGeocode } from '@/lib/geocoding'
import { findNearbyAddress } from '@/lib/address-utils'

const LocationMapModal = dynamic(
    () => import('./location-map-modal').then(mod => mod.LocationMapModal),
    { ssr: false }
)

export function LocationInitializer({ userId }: { userId?: string }) {
    const [showMap, setShowMap] = useState(false)
    const { currentLocation, selectedAddress, setCurrentLocation, setSelectedAddress, setIsDetecting } = useLocation()

    useEffect(() => {
        // Only run on first visit or if no location is set
        if (!currentLocation && !selectedAddress) {
            detectLocation()
        }
    }, [])

    const detectLocation = async () => {
        setIsDetecting(true)

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords

                    // Try to find nearby saved address (within 100m) if user is logged in
                    if (userId) {
                        const nearbyAddress = await findNearbyAddress(userId, latitude, longitude, 100)

                        if (nearbyAddress) {
                            // Auto-select the nearby saved address - don't show map
                            setSelectedAddress(nearbyAddress)
                            setIsDetecting(false)
                            return
                        }
                    }

                    // If no nearby address, get locality from coordinates
                    const locality = await reverseGeocode(latitude, longitude)

                    const location = {
                        latitude,
                        longitude,
                        locality: locality?.display_name || null,
                    }

                    setCurrentLocation(location)
                    setIsDetecting(false)

                    // Show map only if user is not logged in (guest user)
                    // Logged in users without a nearby address will just see the detected locality
                    if (!userId) {
                        setShowMap(true)
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error)
                    setIsDetecting(false)
                    // Show map so user can manually select if auto-detect fails
                    setShowMap(true)
                }
            )
        } else {
            setIsDetecting(false)
            setShowMap(true)
        }
    }

    if (!showMap) return null

    return (
        <LocationMapModal
            open={showMap}
            onClose={() => setShowMap(false)}
            initialLocation={currentLocation}
        />
    )
}
