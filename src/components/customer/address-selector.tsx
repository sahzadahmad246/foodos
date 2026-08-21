'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plus, Home, Briefcase, MapPinned, MoreVertical, Pencil, Trash2, Loader2, User, Phone, ChevronRight } from 'lucide-react'
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

export interface Address {
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
    onClose?: () => void
    userId?: string
    onAddressSelected?: (address: Address) => void
    embedded?: boolean
}

const ADDRESS_ICONS: Record<string, any> = {
    home: Home,
    work: Briefcase,
    other: MapPinned,
}

export function AddressSelector({ open, onClose, userId, onAddressSelected, embedded = false }: AddressSelectorProps) {
    const [addresses, setAddresses] = useState<Address[]>([])
    const [showAddAddress, setShowAddAddress] = useState(false)
    const [editAddress, setEditAddress] = useState<Address | null>(null)
    const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const { setSelectedAddress } = useLocation()
    const handleClose = onClose || (() => undefined)

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
        if (!embedded) {
            handleClose()
        }
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

    const content = (
        <div className="space-y-5">
            <div className="overflow-hidden rounded-xl border border-border/70 bg-card/70">
                <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-muted/40"
                    onClick={() => {
                        setEditAddress(null)
                        setShowAddAddress(true)
                    }}
                >
                    <Plus className="h-5 w-5 text-primary" />
                    <span className="font-medium text-primary">Add Address</span>
                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </button>
            </div>

            {addresses.length > 0 && (
                <div className="space-y-2">
                    <p className="px-1 text-xs font-semibold tracking-[0.22em] text-muted-foreground">
                        Saved Addresses
                    </p>
                    {addresses.map((address) => {
                        const Icon = ADDRESS_ICONS[address.address_type] || MapPinned
                        return (
                            <div
                                key={address.id}
                                className="relative rounded-xl border border-border/70 bg-card/70 p-4 transition-colors hover:bg-muted/50"
                                onClick={() => handleSelectAddress(address)}
                            >
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Delivers To</p>
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex items-center gap-2">
                                            <p className="font-medium capitalize">
                                                {address.address_type}
                                            </p>
                                            {address.is_default && (
                                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                    Default
                                                </span>
                                            )}
                                        </div>

                                        <div className="mb-1 flex items-center gap-3 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {address.person_name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                {address.mobile}
                                            </span>
                                        </div>

                                        <p className="line-clamp-2 text-sm text-muted-foreground">
                                            {address.flat_building}
                                            {address.locality && `, ${address.locality}`}
                                        </p>
                                    </div>

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
                            </div>
                        )
                    })}
                </div>
            )}

            {addresses.length === 0 && userId && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                    No saved addresses. Add one to get started!
                </div>
            )}

            {!userId && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                    Login to save and manage addresses
                </div>
            )}
        </div>
    )

    return (
        <>
            {embedded ? (
                <div className="bg-background px-4 pb-6 pt-4">{content}</div>
            ) : (
                <Dialog open={open} onOpenChange={handleClose}>
                    <DialogContent className="z-[80] top-auto bottom-0 left-0 right-0 translate-x-0 translate-y-0 max-w-none gap-0 overflow-hidden rounded-b-none rounded-t-3xl border border-border/70 bg-background p-0 text-foreground sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:translate-y-0">
                        <DialogHeader className="px-5 pb-3 pt-5">
                            <DialogTitle className="text-3xl font-semibold tracking-tight">Select an address</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[68vh] px-4 pb-5">{content}</ScrollArea>
                    </DialogContent>
                </Dialog>
            )}

            {/* Add/Edit Address Modal */}
            {userId && showAddAddress && (
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
