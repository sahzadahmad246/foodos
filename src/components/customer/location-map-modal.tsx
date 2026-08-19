'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, MapPin } from 'lucide-react'
import { useLocation } from '@/hooks/use-location'
import { reverseGeocode } from '@/lib/geocoding'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
})

interface LocationMapModalProps {
    open: boolean
    onClose: () => void
    initialLocation?: { latitude: number; longitude: number; locality: string | null } | null
    onLocationSelected?: (location: { latitude: number; longitude: number; locality: string | null }) => void
    embedded?: boolean
}

function LocationMarker({ position, onPositionChange }: any) {
    const map = useMapEvents({
        click(e) {
            onPositionChange([e.latlng.lat, e.latlng.lng])
        },
    })

    return position ? <Marker position={position} draggable eventHandlers={{
        dragend: (e) => {
            const marker = e.target
            const pos = marker.getLatLng()
            onPositionChange([pos.lat, pos.lng])
        }
    }} /> : null
}

export function LocationMapModal({ open, onClose, initialLocation, onLocationSelected, embedded = false }: LocationMapModalProps) {
    const [position, setPosition] = useState<[number, number] | null>(
        initialLocation ? [initialLocation.latitude, initialLocation.longitude] : null
    )
    const [isLoading, setIsLoading] = useState(false)
    const [locality, setLocality] = useState<string>(initialLocation?.locality || '')
    const { setCurrentLocation } = useLocation()

    useEffect(() => {
        if ((open || embedded) && !position) {
            // Auto-detect location when modal opens
            if ('geolocation' in navigator) {
                setIsLoading(true)
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setPosition([pos.coords.latitude, pos.coords.longitude])
                        fetchLocality(pos.coords.latitude, pos.coords.longitude)
                    },
                    () => {
                        setIsLoading(false)
                        // Default to a location if geolocation fails
                        setPosition([28.6139, 77.2090]) // Delhi
                    }
                )
            }
        }
    }, [open])

    const fetchLocality = async (lat: number, lon: number) => {
        setIsLoading(true)
        const result = await reverseGeocode(lat, lon)
        if (result) {
            setLocality(result.locality || result.display_name || '')
        }
        setIsLoading(false)
    }

    const handlePositionChange = async (newPosition: [number, number]) => {
        setPosition(newPosition)
        await fetchLocality(newPosition[0], newPosition[1])
    }

    const handleConfirm = () => {
        if (position) {
            const locationData = {
                latitude: position[0],
                longitude: position[1],
                locality,
            }

            setCurrentLocation(locationData)

            // Notify parent component if callback provided
            if (onLocationSelected) {
                onLocationSelected(locationData)
            }

            onClose()
        }
    }

    const content = (
        <>
                <DialogHeader className="p-4 pb-3 border-b">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <MapPin className="h-4 w-4" />
                        Select Your Location
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-1.5">
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Detecting location...
                            </span>
                        ) : locality ? (
                            locality
                        ) : (
                            'Click on the map or drag the marker'
                        )}
                    </p>
                </DialogHeader>

                {/* Map Container - Medium fixed height */}
                <div className="w-full h-[320px] sm:h-[380px] relative">
                    {position && (
                        <MapContainer
                            center={position}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />
                            <LocationMarker
                                position={position}
                                onPositionChange={handlePositionChange}
                            />
                        </MapContainer>
                    )}
                </div>

                <div className="p-4 pt-3 border-t">
                    <div className="flex gap-2">
                        {!embedded ? (
                            <Button variant="outline" onClick={onClose} className="flex-1" size="sm">
                                Cancel
                            </Button>
                        ) : null}
                        <Button
                            onClick={handleConfirm}
                            disabled={!position || isLoading}
                            className={embedded ? "w-full" : "flex-1"}
                            size="sm"
                        >
                            {isLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            Confirm Location
                        </Button>
                    </div>
                </div>
        </>
    )

    if (embedded) {
        return <div className="overflow-hidden bg-white">{content}</div>
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg p-0 gap-0">
                {content}
            </DialogContent>
        </Dialog>
    )
}
