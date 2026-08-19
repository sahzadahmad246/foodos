'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownCircle, ArrowUpCircle, Banknote, Clock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { requestCashDeposit } from '@/app/rider/actions'
import { toast } from 'sonner'

export interface CollectedEntry {
    id: string
    amount: number
    created_at: string
    order: {
        id: string
        order_number: string
        customer_name: string
        customer_address: string | null
    } | null
}

export interface DepositLedgerEntry {
    id: string
    amount: number
    created_at: string
    note: string | null
}

export interface DepositRequest {
    id: string
    amount: number
    status: 'pending' | 'approved' | 'rejected' | 'cancelled'
    note: string | null
    requested_at: string
    decided_at: string | null
}

interface CashPageClientProps {
    cashInHand: number
    collectedEntries: CollectedEntry[]
    depositLedgerEntries: DepositLedgerEntry[]
    depositRequests: DepositRequest[]
}

function getStatusClasses(status: DepositRequest['status']) {
    switch (status) {
        case 'approved':
            return 'bg-emerald-100 text-emerald-700'
        case 'rejected':
            return 'bg-red-100 text-red-700'
        case 'cancelled':
            return 'bg-gray-200 text-gray-700'
        default:
            return 'bg-amber-100 text-amber-700'
    }
}

export function CashPageClient({
    cashInHand,
    collectedEntries,
    depositLedgerEntries,
    depositRequests,
}: CashPageClientProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [amount, setAmount] = useState('')
    const [note, setNote] = useState('')
    const [isPending, startTransition] = useTransition()

    const pendingCount = depositRequests.filter((item) => item.status === 'pending').length

    const handleSubmit = () => {
        const value = Number(amount)
        if (!value || value <= 0) {
            toast.error('Enter a valid amount')
            return
        }

        startTransition(async () => {
            const result = await requestCashDeposit(value, note)
            if (result.error) {
                toast.error(result.error)
                return
            }

            toast.success('Deposit request sent')
            setOpen(false)
            setAmount('')
            setNote('')
            router.refresh()
        })
    }

    return (
        <div className="space-y-4">
            <Card className="relative overflow-hidden border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-emerald-700">Cash in hand</p>
                            <p className="text-3xl font-bold text-emerald-800">₹{cashInHand.toFixed(2)}</p>
                        </div>
                        <Banknote className="h-8 w-8 text-emerald-600" />
                    </div>
                    {pendingCount > 0 && (
                        <p className="mt-2 text-xs text-amber-700">
                            {pendingCount} deposit request{pendingCount > 1 ? 's' : ''} pending approval
                        </p>
                    )}
                    <Button className="mt-4 w-full" onClick={() => setOpen(true)}>
                        Request Deposit
                    </Button>
                </CardContent>
                <div
                    className="absolute bottom-0 left-1/2 h-10 w-[70%] -translate-x-1/2 blur-2xl"
                    style={{ background: 'rgba(16, 185, 129, 0.25)' }}
                />
            </Card>

            <Tabs defaultValue="collected" className="space-y-3">
                <TabsList className="grid h-auto grid-cols-2 rounded-lg border border-border/70 bg-muted/50 p-1">
                    <TabsTrigger value="collected">Collected</TabsTrigger>
                    <TabsTrigger value="deposit">Deposit</TabsTrigger>
                </TabsList>

                <TabsContent value="collected" className="space-y-3">
                    {collectedEntries.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                                No collected cash records yet.
                            </CardContent>
                        </Card>
                    ) : (
                        collectedEntries.map((entry) => (
                            <Card key={entry.id} className="border-border/70 bg-background/80">
                                <CardContent className="pt-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{entry.order?.order_number || 'Order'}</p>
                                        <div className="flex items-center gap-1 font-semibold text-emerald-700">
                                            <ArrowDownCircle className="h-4 w-4" />
                                            ₹{Number(entry.amount || 0).toFixed(2)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Customer: {entry.order?.customer_name || 'N/A'}
                                    </p>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        Address: {entry.order?.customer_address || 'N/A'}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5" />
                                        {new Date(entry.created_at).toLocaleString('en-IN')}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="deposit" className="space-y-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Deposit Requests</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {depositRequests.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No deposit requests yet.</p>
                            ) : (
                                depositRequests.map((request) => (
                                    <div key={request.id} className="rounded-xl border border-border/70 bg-background/70 p-3">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold">₹{Number(request.amount || 0).toFixed(2)}</p>
                                            <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusClasses(request.status)}`}>
                                                {request.status}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Requested: {new Date(request.requested_at).toLocaleString('en-IN')}
                                        </p>
                                        {request.decided_at && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Updated: {new Date(request.decided_at).toLocaleString('en-IN')}
                                            </p>
                                        )}
                                        {request.note && (
                                            <p className="mt-1 text-xs text-muted-foreground">Note: {request.note}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Deposited Transactions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {depositLedgerEntries.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No deposited transactions yet.</p>
                            ) : (
                                depositLedgerEntries.map((entry) => (
                                    <div key={entry.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 p-3">
                                        <div>
                                            <p className="font-semibold text-blue-700">₹{Number(entry.amount || 0).toFixed(2)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(entry.created_at).toLocaleString('en-IN')}
                                            </p>
                                            {entry.note && (
                                                <p className="mt-1 text-xs text-muted-foreground">Note: {entry.note}</p>
                                            )}
                                        </div>
                                        <ArrowUpCircle className="h-4 w-4 text-blue-600" />
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Request Cash Deposit</DialogTitle>
                        <DialogDescription>
                            Cash in hand: ₹{cashInHand.toFixed(2)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <Input
                            placeholder="Note (optional)"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isPending}>
                            {isPending ? 'Sending...' : 'Send Request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
