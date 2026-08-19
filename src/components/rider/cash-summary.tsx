'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Banknote, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { requestCashDeposit } from '@/app/rider/actions'
import { toast } from 'sonner'

interface CashEntry {
    id: string
    type: 'collect' | 'deposit'
    amount: number
    created_at: string
    order?: { order_number?: string | null } | null
}

interface DepositRequest {
    id: string
    amount: number
    status: 'pending' | 'approved' | 'rejected' | 'cancelled'
    note?: string | null
    requested_at: string
}

interface CashSummaryProps {
    cashInHand: number
    ledgerEntries: CashEntry[]
    depositRequests: DepositRequest[]
}

export function CashSummary({ cashInHand, ledgerEntries, depositRequests }: CashSummaryProps) {
    const [open, setOpen] = useState(false)
    const [amount, setAmount] = useState('')
    const [note, setNote] = useState('')
    const [isPending, startTransition] = useTransition()

    const recentLedger = ledgerEntries.slice(0, 3)
    const pendingRequests = depositRequests.filter((r) => r.status === 'pending')

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
            } else {
                toast.success('Deposit request sent')
                setOpen(false)
                setAmount('')
                setNote('')
            }
        })
    }

    return (
        <div className="rounded-2xl border border-border/60 bg-white/90 dark:bg-gray-900/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Banknote className="h-4 w-4 text-emerald-600" />
                    Cash in hand
                </div>
                <div className="text-2xl font-bold">₹{cashInHand.toFixed(0)}</div>
            </div>

            {pendingRequests.length > 0 && (
                <div className="space-y-1 text-xs text-amber-700">
                    {pendingRequests.map((req) => (
                        <div key={req.id} className="rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-2">
                            Deposit request pending • ₹{Number(req.amount || 0).toFixed(0)}
                        </div>
                    ))}
                </div>
            )}

            {recentLedger.length > 0 && (
                <div className="space-y-2">
                    {recentLedger.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                {entry.type === 'collect' ? (
                                    <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                                ) : (
                                    <ArrowUpCircle className="h-4 w-4 text-blue-600" />
                                )}
                                {entry.type === 'collect' ? 'Collected' : 'Deposited'}
                                {entry.order?.order_number ? ` • ${entry.order.order_number}` : ''}
                            </div>
                            <span className={`font-semibold ${entry.type === 'collect' ? 'text-emerald-700' : 'text-blue-700'}`}>
                                ₹{Number(entry.amount || 0).toFixed(0)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <Button className="w-full" onClick={() => setOpen(true)}>
                Request Deposit
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Request Cash Deposit</DialogTitle>
                        <DialogDescription>
                            Cash in hand: ₹{cashInHand.toFixed(0)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Input
                            type="number"
                            min="0"
                            step="1"
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
