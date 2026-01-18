'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { MoreVertical, Phone, Bike, Car, Power, Trash2, User, Mail } from 'lucide-react'
import { toggleRiderActive, deleteRider } from '@/app/dashboard/riders/actions'
import { toast } from 'sonner'

interface Rider {
    id: string
    name: string
    email: string
    phone: string
    vehicle_type: string
    vehicle_number: string
    status: 'online' | 'offline' | 'on_delivery'
    is_active: boolean
}

interface RiderCardProps {
    rider: Rider
}

export function RiderCard({ rider }: RiderCardProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const statusConfig = {
        online: { label: 'Online', color: 'bg-green-500' },
        offline: { label: 'Offline', color: 'bg-gray-400' },
        on_delivery: { label: 'On Delivery', color: 'bg-blue-500' }
    }

    const handleToggleActive = async () => {
        setIsLoading(true)
        const result = await toggleRiderActive(rider.id, !rider.is_active)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(rider.is_active ? 'Rider deactivated' : 'Rider activated')
        }
        setIsLoading(false)
    }

    const handleDelete = async () => {
        setIsLoading(true)
        const result = await deleteRider(rider.id)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Rider removed')
        }
        setShowDeleteDialog(false)
        setIsLoading(false)
    }

    const VehicleIcon = rider.vehicle_type === 'car' ? Car : Bike

    return (
        <>
            <Card className={`transition-all ${!rider.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold">{rider.name}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {rider.email}
                                </p>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleToggleActive} disabled={isLoading}>
                                    <Power className="h-4 w-4 mr-2" />
                                    {rider.is_active ? 'Deactivate' : 'Activate'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="text-red-600"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Badge
                            variant="secondary"
                            className={`${statusConfig[rider.status].color} text-white`}
                        >
                            {statusConfig[rider.status].label}
                        </Badge>
                        {!rider.is_active && (
                            <Badge variant="outline" className="text-red-500 border-red-500">
                                Inactive
                            </Badge>
                        )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{rider.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <VehicleIcon className="h-4 w-4" />
                            <span className="capitalize">{rider.vehicle_type}</span>
                            {rider.vehicle_number && (
                                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                    {rider.vehicle_number}
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Rider</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove {rider.name}?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isLoading}
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
