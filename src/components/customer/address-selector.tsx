'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plus, Home, Briefcase, MapPinned } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useLocation } from '@/hooks/use-location'
import { getUserAddresses } from '@/lib/address-utils'
import { AddAddressModal } from './add-address-modal'

interface Address {
    id: string
    latitude: number
    longitude: number
    locality: string | null
    flat_building: string
    landmark: string | null
    address_type: string
    is_default: boolean
}

interface AddressSelectorProps {
    open: boolean
    onClose: () => void
    userId?: string
}

const ADDRESS_ICONS: Record<string, any> = {
    home: Home,
    work: Briefcase,
    other: MapPinned,
}

export function AddressSelector({ open, onClose, userId }: AddressSelectorProps) {
    const [addresses, setAddresses] = useState<Address[]>([])
    const [showAddAddress, setShowAddAddress] = useState(false)
    const { setSelectedAddress } = useLocation()

    useEffect(() => {
        if (open && userId) {
            loadAddresses()
        }
    }, [open, userId])

    const loadAddresses = async () => {
        if (!userId) return
        const userAddresses = await getUserAddresses(userId)
        setAddresses(userAddresses)
    }

    const handleSelectAddress = (address: Address) => {
        setSelectedAddress(address)
        onClose()
    }

    const handleAddressAdded = () => {
        loadAddresses()
        setShowAddAddress(false)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select Delivery Location</DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="max-h-[60vh]">
                        <div className="space-y-3 pr-4">
                            {/* Add New Address */}
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-3 h-auto p-4"
                                onClick={() => setShowAddAddress(true)}
                            >
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Plus className="h-5 w-5 text-primary" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium">Add New Address</p>
                                    <p className="text-xs text-muted-foreground">
                                        Save address for faster checkout
                                    </p>
                                </div>
                            </Button>

                            {/* Saved Addresses */}
                            {addresses.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground px-1">
                                        Saved Addresses
                                    </p>
                                    {addresses.map((address) => {
                                        const Icon = ADDRESS_ICONS[address.address_type] || MapPinned
                                        return (
                                            <Button
                                                key={address.id}
                                                variant="outline"
                                                className="w-full justify-start gap-3 h-auto p-4 hover:bg-accent"
                                                onClick={() => handleSelectAddress(address)}
                                            >
                                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="text-left flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium capitalize">
                                                            {address.address_type}
                                                        </p>
                                                        {address.is_default && (
                                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {address.flat_building}
                                                        {address.locality && `, ${address.locality}`}
                                                    </p>
                                                </div>
                                            </Button>
                                        )
                                    })}
                                </div>
                            )}

                            {addresses.length === 0 && userId && (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No saved addresses. Add one to get started!
                                </div>
                            )}

                            {!userId && (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    Login to save and manage addresses
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Add Address Modal */}
            {userId && (
                <AddAddressModal
                    open={showAddAddress}
                    onClose={() => setShowAddAddress(false)}
                    onAddressAdded={handleAddressAdded}
                    userId={userId}
                />
            )}
        </>
    )
}
