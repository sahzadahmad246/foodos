'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, Plus, Home, Briefcase, MapPinned, MoreVertical, Pencil, Trash2, Loader2, User, Phone, ChevronRight, Navigation, type LucideIcon } from 'lucide-react'
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
    addLabel?: string
}

const ADDRESS_ICONS: Record<string, LucideIcon> = {
    home: Home,
    work: Briefcase,
    other: MapPinned,
}

export function AddressSelector({ open, onClose, userId, onAddressSelected, embedded = false, addLabel = 'Add address' }: AddressSelectorProps) {
    const [addresses, setAddresses] = useState<Address[]>([])
    const [showAddAddress, setShowAddAddress] = useState(false)
    const [editAddress, setEditAddress] = useState<Address | null>(null)
    const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const { setSelectedAddress } = useLocation()
    const handleClose = onClose || (() => undefined)

    const loadAddresses = useCallback(async () => {
        if (!userId) return
        const userAddresses = await getUserAddresses(userId)
        setAddresses(userAddresses)
    }, [userId])

    useEffect(() => {
        if (!open || !userId) return

        const timeoutId = window.setTimeout(() => {
            void loadAddresses()
        }, 0)

        return () => window.clearTimeout(timeoutId)
    }, [loadAddresses, open, userId])

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

    const handleEditClick = (e: Event, address: Address) => {
        e.stopPropagation()
        setEditAddress(address)
        setShowAddAddress(true)
    }

    const handleDeleteClick = (e: Event, addressId: string) => {
        e.stopPropagation()
        setDeleteAddressId(addressId)
    }

    const content = (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-dashed border-primary/35 bg-primary/5">
                <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-primary/10"
                    onClick={() => {
                        setEditAddress(null)
                        setShowAddAddress(true)
                    }}
                >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Plus className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-primary">{addLabel}</span>
                        <span className="block text-xs text-muted-foreground">Pin a location and save contact details</span>
                    </span>
                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </button>
            </div>

            {addresses.length > 0 && (
                <div>
                    <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Saved addresses
                    </p>
                    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                        {addresses.map((address, index) => {
                            const Icon = ADDRESS_ICONS[address.address_type] || MapPinned
                            return (
                                <div
                                    key={address.id}
                                    role="button"
                                    tabIndex={0}
                                    className={`relative w-full cursor-pointer p-3 text-left transition hover:bg-muted/35 ${index > 0 ? 'border-t border-border/70' : ''}`}
                                    onClick={() => handleSelectAddress(address)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault()
                                            handleSelectAddress(address)
                                        }
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-center gap-2">
                                                <p className="text-sm font-semibold capitalize">
                                                    {address.address_type}
                                                </p>
                                                {address.is_default && (
                                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                                        Default
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                <span className="inline-flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {address.person_name}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {address.mobile}
                                                </span>
                                            </div>

                                            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                                {address.flat_building}
                                                {address.locality && `, ${address.locality}`}
                                                {address.city && `, ${address.city}`}
                                                {address.pincode && ` ${address.pincode}`}
                                            </p>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 rounded-full">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={(e) => handleEditClick(e, address)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onSelect={(e) => handleDeleteClick(e, address.id)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {addresses.length === 0 && userId && (
                <div className="rounded-2xl border border-border/70 bg-card px-6 py-10 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-primary">
                        <Navigation className="h-6 w-6" />
                    </div>
                    <p className="font-semibold">No saved addresses</p>
                    <p className="mt-1 text-sm text-muted-foreground">Add one now and checkout gets much faster.</p>
                </div>
            )}

            {!userId && (
                <div className="rounded-2xl border border-border/70 bg-card px-6 py-10 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-primary">
                        <MapPin className="h-6 w-6" />
                    </div>
                    <p className="font-semibold">Login required</p>
                    <p className="mt-1 text-sm text-muted-foreground">Login to save and manage delivery addresses.</p>
                </div>
            )}
        </div>
    )

    return (
        <>
            {embedded ? (
                <div>{content}</div>
            ) : (
                <Dialog open={open} onOpenChange={handleClose}>
                    <DialogContent className="top-auto bottom-0 left-0 right-0 z-[80] max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-b-none rounded-t-3xl border border-border/70 bg-background p-0 text-foreground shadow-2xl sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:translate-y-0">
                        <DialogHeader className="border-b border-border/70 px-4 pb-4 pt-5 text-left">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Delivery location</p>
                            <DialogTitle className="text-2xl font-bold tracking-tight">Select an address</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[68vh] px-3 py-4">{content}</ScrollArea>
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
