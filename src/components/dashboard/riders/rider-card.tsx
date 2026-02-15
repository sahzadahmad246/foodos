'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
    DialogClose,
} from '@/components/ui/dialog'
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
import { MoreVertical, Phone, Bike, Car, Power, Trash2, User, Mail, Banknote, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { toggleRiderActive, deleteRider, recordRiderCashDeposit, approveDepositRequest, rejectDepositRequest } from '@/app/dashboard/riders/actions'
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
    cash_in_hand?: number | null
    cash_collected_total?: number | null
    cash_deposited_total?: number | null
    delivered_count?: number | null
}

interface RiderCardProps {
    rider: Rider
    ledgerEntries: Array<{
        id: string
        type: 'collect' | 'deposit'
        amount: number
        created_at: string
        order?: {
            order_number?: string | null
        } | null
    }>
    depositRequests: Array<{
        id: string
        amount: number
        status: 'pending' | 'approved' | 'rejected' | 'cancelled'
        note?: string | null
        requested_at: string
    }>
}

export function RiderCard({ rider, ledgerEntries, depositRequests }: RiderCardProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [depositOpen, setDepositOpen] = useState(false)
    const [depositAmount, setDepositAmount] = useState('')
    const [depositNote, setDepositNote] = useState('')
    const [ledgerOpen, setLedgerOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const statusConfig = {
        online: { label: 'Online', color: 'bg-green-500' },
        offline: { label: 'Offline', color: 'bg-gray-400' },
        on_delivery: { label: 'On Delivery', color: 'bg-blue-500' },
        returning: { label: 'Returning', color: 'bg-amber-500' }
    } as const

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
    const cashInHand = Number(rider.cash_in_hand || 0)
    const deliveredCount = Number(rider.delivered_count || 0)
    const recentLedger = ledgerEntries.slice(0, 3)
    const pendingRequests = depositRequests.filter((r) => r.status === 'pending')
    const formatLedgerTime = (value: string) => {
        try {
            return new Date(value).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return value
        }
    }

    const handleDeposit = () => {
        const amount = Number(depositAmount)
        if (!amount || amount <= 0) {
            toast.error('Enter a valid amount')
            return
        }

        startTransition(async () => {
            const result = await recordRiderCashDeposit(rider.id, amount, depositNote)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Deposit recorded')
                setDepositOpen(false)
                setDepositAmount('')
                setDepositNote('')
            }
        })
    }

    const handleApproveRequest = (requestId: string) => {
        startTransition(async () => {
            const result = await approveDepositRequest(requestId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Request approved')
            }
        })
    }

    const handleRejectRequest = (requestId: string) => {
        startTransition(async () => {
            const result = await rejectDepositRequest(requestId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Request rejected')
            }
        })
    }

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

                    <div className="mt-4 rounded-xl border border-border/60 bg-background/60 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <Banknote className="h-4 w-4 text-emerald-600" />
                                Cash in hand
                            </div>
                            <div className="text-lg font-bold">₹{cashInHand.toFixed(0)}</div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Delivered</span>
                            <span className="font-medium text-foreground">{deliveredCount}</span>
                        </div>

                        {pendingRequests.length > 0 && (
                            <div className="space-y-2">
                                {pendingRequests.map((req) => (
                                    <div key={req.id} className="rounded-lg border border-amber-200 bg-amber-50/60 p-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-medium text-amber-900">
                                                Deposit request • ₹{Number(req.amount || 0).toFixed(0)}
                                            </span>
                                            <span className="text-amber-700">Pending</span>
                                        </div>
                                        {req.note && (
                                            <div className="text-[11px] text-amber-800/70 mt-1">{req.note}</div>
                                        )}
                                        <div className="mt-2 flex gap-2">
                                            <Button
                                                size="sm"
                                                className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700"
                                                disabled={isPending}
                                                onClick={() => handleApproveRequest(req.id)}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 px-2"
                                                disabled={isPending}
                                                onClick={() => handleRejectRequest(req.id)}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {recentLedger.length > 0 && (
                            <div className="space-y-2">
                                {recentLedger.map((entry) => (
                                    <div key={entry.id} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            {entry.type === 'collect' ? (
                                                <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                                            ) : (
                                                <ArrowUpCircle className="h-4 w-4 text-blue-600" />
                                            )}
                                            <span className="text-muted-foreground">
                                                {entry.type === 'collect' ? 'Collected' : 'Deposited'}
                                                {entry.order?.order_number ? ` • ${entry.order.order_number}` : ''}
                                            </span>
                                        </div>
                                        <span className={`font-semibold ${entry.type === 'collect' ? 'text-emerald-700' : 'text-blue-700'}`}>
                                            ₹{Number(entry.amount || 0).toFixed(0)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDepositOpen(true)}
                            >
                                Record Deposit
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLedgerOpen(true)}
                            >
                                View Ledger
                            </Button>
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

            <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Record Cash Deposit</DialogTitle>
                        <DialogDescription>
                            Rider: {rider.name} • Cash in hand: ₹{cashInHand.toFixed(0)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="Deposit amount"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                        />
                        <Input
                            placeholder="Note (optional)"
                            value={depositNote}
                            onChange={(e) => setDepositNote(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="ghost" disabled={isPending}>Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleDeposit} disabled={isPending}>
                            {isPending ? 'Saving...' : 'Save Deposit'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={ledgerOpen} onOpenChange={setLedgerOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Cash Ledger</DialogTitle>
                        <DialogDescription>
                            Rider: {rider.name} • Cash in hand: ₹{cashInHand.toFixed(0)}
                        </DialogDescription>
                    </DialogHeader>

                    {ledgerEntries.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No cash entries yet.</div>
                    ) : (
                        <div className="max-h-[320px] overflow-y-auto space-y-2">
                            {ledgerEntries.map((entry) => (
                                <div key={entry.id} className="flex items-center justify-between rounded-lg border border-border/60 p-2.5">
                                    <div className="flex items-center gap-2">
                                        {entry.type === 'collect' ? (
                                            <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                            <ArrowUpCircle className="h-4 w-4 text-blue-600" />
                                        )}
                                        <div className="text-xs">
                                            <div className="font-medium">
                                                {entry.type === 'collect' ? 'Collected' : 'Deposited'}
                                                {entry.order?.order_number ? ` • ${entry.order.order_number}` : ''}
                                            </div>
                                            <div className="text-muted-foreground">{formatLedgerTime(entry.created_at)}</div>
                                        </div>
                                    </div>
                                    <div className={`text-sm font-semibold ${entry.type === 'collect' ? 'text-emerald-700' : 'text-blue-700'}`}>
                                        ₹{Number(entry.amount || 0).toFixed(0)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="ghost">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
