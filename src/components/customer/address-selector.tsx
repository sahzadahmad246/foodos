'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plus, Home, Briefcase, MapPinned, MoreVertical, Pencil, Trash2, Loader2, User, Phone } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useLocation } from '@/hooks/use-location'
import { getUserAddresses, deleteAddress } from '@/lib/address-utils'
import { AddAddressModal } from './add-address-modal'
import { toast } from 'sonner'

interface Address {
    id: string
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

interface AddressSelectorProps {
    open: boolean
    onClose: () => void
    userId?: string
    onAddressSelected?: (address: Address) => void
}

const ADDRESS_ICONS: Record<string, any> = {
    home: Home,
    work: Briefcase,
    other: MapPinned,
}

export function AddressSelector({ open, onClose, userId, onAddressSelected }: AddressSelectorProps) {
    const [addresses, setAddresses] = useState<Address[]>([])
    const [showAddAddress, setShowAddAddress] = useState(false)
    const [editAddress, setEditAddress] = useState<Address | null>(null)
    const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
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
        onAddressSelected?.(address)
        onClose()
    }

    const handleAddressAdded = () => {
        loadAddresses()
        setShowAddAddress(false)
        setEditAddress(null)
    }

    const handleDeleteAddress = async () => {
        if (!deleteAddressId) return
        setIsDeleting(true)
        const result = await deleteAddress(deleteAddressId)
        setIsDeleting(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Address deleted')
            setDeleteAddressId(null)
            loadAddresses()
        }
    }

    const handleEditClick = (e: React.MouseEvent, address: Address) => {
        e.stopPropagation()
        setEditAddress(address)
        setShowAddAddress(true)
    }

    const handleDeleteClick = (e: React.MouseEvent, addressId: string) => {
        e.stopPropagation()
        setDeleteAddressId(addressId)
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
                                onClick={() => {
                                    setEditAddress(null)
                                    setShowAddAddress(true)
                                }}
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
                                            <div
                                                key={address.id}
                                                className="relative flex items-start gap-3 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                                                onClick={() => handleSelectAddress(address)}
                                            >
                                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium capitalize">
                                                            {address.address_type}
                                                        </p>
                                                        {address.is_default && (
                                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Person Name & Mobile */}
                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-1">
                                                        <span className="flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            {address.person_name}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {address.mobile}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {address.flat_building}
                                                        {address.locality && `, ${address.locality}`}
                                                    </p>
                                                </div>

                                                {/* More Menu */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => handleEditClick(e as any, address)}>
                                                            <Pencil className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => handleDeleteClick(e as any, address.id)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
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

            {/* Add/Edit Address Modal */}
            {userId && (
                <AddAddressModal
                    open={showAddAddress}
                    onClose={() => {
                        setShowAddAddress(false)
                        setEditAddress(null)
                    }}
                    onAddressAdded={handleAddressAdded}
                    userId={userId}
                    editAddress={editAddress}
                />
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteAddressId} onOpenChange={() => setDeleteAddressId(null)}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Address?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this address from your saved addresses.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAddress}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground"
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
