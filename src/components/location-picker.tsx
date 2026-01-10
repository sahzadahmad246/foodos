'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { LatLng, Icon } from 'leaflet'
import { Button } from '@/components/ui/button'
import { Crosshair, Loader2 } from 'lucide-react'

// Fix for default marker icon in Next.js
const customIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

interface LocationPickerProps {
    latitude?: number
    longitude?: number
    onLocationChange: (lat: number, lng: number) => void
}

function DraggableMarker({
    position,
    onPositionChange
}: {
    position: LatLng
    onPositionChange: (latlng: LatLng) => void
}) {
    const markerRef = useRef<L.Marker>(null)

    useMapEvents({
        click(e) {
            onPositionChange(e.latlng)
        },
    })

    return (
        <Marker
            draggable={true}
            position={position}
            ref={markerRef}
            icon={customIcon}
            eventHandlers={{
                dragend() {
                    const marker = markerRef.current
                    if (marker) {
                        onPositionChange(marker.getLatLng())
                    }
                },
            }}
        />
    )
}

function LocateButton({ onLocate }: { onLocate: () => void }) {
    const map = useMap()

    const handleClick = () => {
        map.locate({ setView: true, maxZoom: 16 })
        onLocate()
    }

    return (
        <div className="leaflet-top leaflet-right" style={{ margin: '10px' }}>
            <Button
                type="button"
                size="icon"
                variant="secondary"
                className="shadow-md"
                onClick={handleClick}
            >
                <Crosshair className="h-4 w-4" />
            </Button>
        </div>
    )
}

export function LocationPicker({ latitude, longitude, onLocationChange }: LocationPickerProps) {
    const [mounted, setMounted] = useState(false)
    const [isLocating, setIsLocating] = useState(false)
    const [position, setPosition] = useState<LatLng>(
        new LatLng(latitude || 19.076, longitude || 72.8777) // Default: Mumbai
    )

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (latitude && longitude) {
            setPosition(new LatLng(latitude, longitude))
        }
    }, [latitude, longitude])

    const handlePositionChange = (latlng: LatLng) => {
        setPosition(latlng)
        onLocationChange(latlng.lat, latlng.lng)
        setIsLocating(false)
    }

    if (!mounted) {
        return (
            <div className="h-64 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <div className="relative h-64 rounded-lg overflow-hidden border">
                <MapContainer
                    center={position}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    className="z-0"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <DraggableMarker
                        position={position}
                        onPositionChange={handlePositionChange}
                    />
                    <LocateButton onLocate={() => setIsLocating(true)} />
                </MapContainer>
                {isLocating && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
                Click on map or drag marker to set location • Use 📍 to detect your location
            </p>
            {position && (
                <p className="text-xs text-center text-muted-foreground">
                    Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
                </p>
            )}
        </div>
    )
}
