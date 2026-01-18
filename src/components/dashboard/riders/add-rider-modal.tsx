'use client'

import { useState, useTransition } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { addRider } from '@/app/dashboard/riders/actions'
import { toast } from 'sonner'

interface AddRiderModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    restaurantId: string
}

export function AddRiderModal({ open, onOpenChange, restaurantId }: AddRiderModalProps) {
    const [isPending, startTransition] = useTransition()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [vehicleType, setVehicleType] = useState('bike')
    const [vehicleNumber, setVehicleNumber] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!name || !email || !phone) {
            toast.error('Please fill in all required fields')
            return
        }

        startTransition(async () => {
            const result = await addRider(restaurantId, {
                name,
                email,
                phone,
                vehicleType,
                vehicleNumber
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Rider added successfully')
                onOpenChange(false)
                resetForm()
            }
        })
    }

    const resetForm = () => {
        setName('')
        setEmail('')
        setPhone('')
        setVehicleType('bike')
        setVehicleNumber('')
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            onOpenChange(isOpen)
            if (!isOpen) resetForm()
        }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Rider</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            placeholder="Rider's full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="rider@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Rider will use this email to login
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                            id="phone"
                            placeholder="+91 9876543210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Vehicle Type</Label>
                            <Select value={vehicleType} onValueChange={setVehicleType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bike">Bike</SelectItem>
                                    <SelectItem value="scooter">Scooter</SelectItem>
                                    <SelectItem value="car">Car</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                            <Input
                                id="vehicleNumber"
                                placeholder="MH 01 AB 1234"
                                value={vehicleNumber}
                                onChange={(e) => setVehicleNumber(e.target.value)}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isPending || !name || !email || !phone}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            'Add Rider'
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
