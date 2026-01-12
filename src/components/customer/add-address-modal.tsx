'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, MapPin } from 'lucide-react'
import { saveAddress } from '@/lib/address-utils'
import { reverseGeocode } from '@/lib/geocoding'
import { toast } from 'sonner'

const LocationMapModal = dynamic(
    () => import('./location-map-modal').then(mod => mod.LocationMapModal),
    { ssr: false }
)

interface AddAddressModalProps {
    open: boolean
    onClose: () => void
    onAddressAdded: () => void
    userId: string
}

export function AddAddressModal({ open, onClose, onAddressAdded, userId }: AddAddressModalProps) {
    const [showMap, setShowMap] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        latitude: 0,
        longitude: 0,
        locality: '',
        flat_building: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        address_type: 'home',
        is_default: false,
    })

    const handleLocationSelected = async (location: { latitude: number; longitude: number; locality: string | null }) => {
        const geocoded = await reverseGeocode(location.latitude, location.longitude)

        setFormData(prev => ({
            ...prev,
            latitude: location.latitude,
            longitude: location.longitude,
            locality: geocoded?.locality || location.locality || '',
            city: geocoded?.city || '',
            state: geocoded?.state || '',
            pincode: geocoded?.pincode || '',
        }))
        setShowMap(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.latitude || !formData.longitude) {
            toast.error('Please select a location on the map')
            return
        }

        if (!formData.flat_building) {
            toast.error('Please enter flat/building number')
            return
        }

        setIsSaving(true)
        const result = await saveAddress(userId, formData)
        setIsSaving(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Address saved successfully')
            onAddressAdded()
            onClose()
            // Reset form
            setFormData({
                latitude: 0,
                longitude: 0,
                locality: '',
                flat_building: '',
                landmark: '',
                city: '',
                state: '',
                pincode: '',
                address_type: 'home',
                is_default: false,
            })
        }
    }

    const isFormValid = formData.latitude && formData.longitude && formData.flat_building

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Address</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Location Selector */}
                        <div className="space-y-2">
                            <Label>Location *</Label>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start h-auto py-2 px-3"
                                onClick={() => setShowMap(true)}
                            >
                                <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                                <div className="text-left flex-1 min-w-0">
                                    {formData.locality ? (
                                        <>
                                            <p className="text-sm font-medium truncate">{formData.locality}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm">Select location on map</p>
                                    )}
                                </div>
                            </Button>
                            {formData.city && (
                                <p className="text-xs text-muted-foreground">
                                    {formData.city}, {formData.state} - {formData.pincode}
                                </p>
                            )}
                        </div>

                        {/* Flat/Building */}
                        <div className="space-y-2">
                            <Label htmlFor="flat">Flat / Building No. *</Label>
                            <Input
                                id="flat"
                                value={formData.flat_building}
                                onChange={(e) => setFormData(prev => ({ ...prev, flat_building: e.target.value }))}
                                placeholder="e.g., Flat 101, Tower A"
                                required
                            />
                        </div>

                        {/* Landmark */}
                        <div className="space-y-2">
                            <Label htmlFor="landmark">Landmark (Optional)</Label>
                            <Input
                                id="landmark"
                                value={formData.landmark || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                                placeholder="e.g., Near Metro Station"
                            />
                        </div>

                        {/* Address Type */}
                        <div className="space-y-2">
                            <Label>Address Type</Label>
                            <Select
                                value={formData.address_type}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, address_type: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="home">🏠 Home</SelectItem>
                                    <SelectItem value="work">💼 Work</SelectItem>
                                    <SelectItem value="other">📍 Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSaving || !isFormValid}
                                className="flex-1"
                            >
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Address
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Map Modal */}
            <LocationMapModal
                open={showMap}
                onClose={() => setShowMap(false)}
                onLocationSelected={handleLocationSelected}
                initialLocation={formData.latitude ? {
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    locality: formData.locality,
                } : null}
            />
        </>
    )
}
