'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, MapPin, ArrowLeft, Home, Briefcase, MapPinned } from 'lucide-react'
import { saveAddress, updateAddress } from '@/lib/address-utils'
import { reverseGeocode } from '@/lib/geocoding'
import { toast } from 'sonner'

const LocationMapModal = dynamic(
    () => import('./location-map-modal').then(mod => mod.LocationMapModal),
    { ssr: false }
)

interface AddressData {
    id?: string
    latitude: number
    longitude: number
    locality: string | null
    flat_building: string
    landmark: string | null
    city: string | null
    state: string | null
    pincode: string | null
    address_type: string
    is_default: boolean
    person_name: string
    mobile: string
}

interface AddAddressModalProps {
    open: boolean
    onClose: () => void
    onAddressAdded: () => void
    userId: string
    editAddress?: AddressData | null
}

const defaultFormData = {
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
    person_name: '',
    mobile: '',
}

export function AddAddressModal({ open, onClose, onAddressAdded, userId, editAddress }: AddAddressModalProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState(defaultFormData)

    // Populate form when editing
    useEffect(() => {
        if (editAddress) {
            setFormData({
                latitude: editAddress.latitude,
                longitude: editAddress.longitude,
                locality: editAddress.locality || '',
                flat_building: editAddress.flat_building,
                landmark: editAddress.landmark || '',
                city: editAddress.city || '',
                state: editAddress.state || '',
                pincode: editAddress.pincode || '',
                address_type: editAddress.address_type,
                is_default: editAddress.is_default,
                person_name: editAddress.person_name || '',
                mobile: editAddress.mobile || '',
            })
        } else {
            setFormData(defaultFormData)
        }
    }, [editAddress, open])

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
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.person_name) {
            toast.error('Please enter person name')
            return
        }

        if (!formData.mobile || formData.mobile.length < 10) {
            toast.error('Please enter valid mobile number')
            return
        }

        if (!formData.latitude || !formData.longitude) {
            toast.error('Please select a location on the map')
            return
        }

        if (!formData.flat_building) {
            toast.error('Please enter flat/building number')
            return
        }

        setIsSaving(true)

        let result
        if (editAddress?.id) {
            result = await updateAddress(editAddress.id, formData)
        } else {
            result = await saveAddress(userId, formData)
        }

        setIsSaving(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(editAddress ? 'Address updated successfully' : 'Address saved successfully')
            onAddressAdded()
            onClose()
            setFormData(defaultFormData)
        }
    }

    const isFormValid = formData.person_name && formData.mobile && formData.latitude && formData.longitude && formData.flat_building

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="z-[80] h-[100dvh] w-screen max-w-none overflow-x-hidden overflow-y-auto rounded-none border-0 bg-background p-0 text-foreground">
                    <DialogHeader className="sticky top-0 z-10 border-b border-border/70 bg-background px-4 py-3">
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <DialogTitle className="text-lg font-semibold">
                                {editAddress ? 'Edit Address' : 'Add New Address'}
                            </DialogTitle>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 overflow-x-hidden pb-8">
                        <LocationMapModal
                            embedded
                            open={open}
                            onClose={() => {}}
                            onLocationSelected={handleLocationSelected}
                            initialLocation={formData.latitude ? {
                                latitude: formData.latitude,
                                longitude: formData.longitude,
                                locality: formData.locality,
                            } : null}
                        />

                        <div className="space-y-4 px-4">
                            <div>
                                <p className="mb-2 text-sm font-medium text-muted-foreground">Delivery details</p>
                                <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="mt-1 h-5 w-5 text-primary" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground">
                                                {formData.locality || 'Tap on map to select location'}
                                            </p>
                                            {formData.city ? (
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {formData.city}, {formData.state} {formData.pincode}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="flat" className="mb-2 block text-sm text-muted-foreground">Address details*</Label>
                                <Input
                                    id="flat"
                                    value={formData.flat_building}
                                    onChange={(e) => setFormData(prev => ({ ...prev, flat_building: e.target.value }))}
                                    placeholder="E.g. Floor, Flat no., Tower"
                                    className="h-14 rounded-xl border-border bg-card text-foreground"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="landmark" className="mb-2 block text-sm text-muted-foreground">Landmark (optional)</Label>
                                <Input
                                    id="landmark"
                                    value={formData.landmark || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                                    placeholder="Nearby landmark"
                                    className="h-12 rounded-xl border-border bg-card text-foreground"
                                />
                            </div>

                            <div>
                                <p className="mb-2 text-sm font-medium text-muted-foreground">Receiver details for this address</p>
                                <div className="grid grid-cols-1 gap-2">
                                    <Input
                                        id="person_name"
                                        value={formData.person_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, person_name: e.target.value }))}
                                        placeholder="Person name"
                                        className="h-12 rounded-xl border-border bg-card text-foreground"
                                        required
                                    />
                                    <Input
                                        id="mobile"
                                        type="tel"
                                        value={formData.mobile}
                                        onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                                        placeholder="Mobile number"
                                        maxLength={10}
                                        className="h-12 rounded-xl border-border bg-card text-foreground"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <p className="mb-2 text-sm font-medium text-muted-foreground">Save address as</p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { value: 'home', label: 'Home', icon: Home },
                                        { value: 'work', label: 'Work', icon: Briefcase },
                                        { value: 'other', label: 'Other', icon: MapPinned },
                                    ].map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, address_type: type.value }))}
                                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm ${
                                                formData.address_type === type.value
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-border bg-card text-foreground/80 hover:bg-muted'
                                            }`}
                                        >
                                            <type.icon className="h-4 w-4" />
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-2 border-t border-border/70 bg-background p-4">
                            <Button
                                type="submit"
                                disabled={isSaving || !isFormValid}
                                className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editAddress ? 'Update address' : 'Save address'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
