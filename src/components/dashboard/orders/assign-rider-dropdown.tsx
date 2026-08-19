'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Loader2, User, Circle, Search, Check } from 'lucide-react'
import { assignRiderToOrder } from '@/app/dashboard/riders/actions'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Rider {
    id: string
    name: string
    phone: string
    status: 'online' | 'offline' | 'on_delivery' | 'delivering' | 'returning'
}

interface AssignRiderModalProps {
    orderId: string
    restaurantId: string
    currentRiderId?: string | null
    currentRiderName?: string | null
}

export function AssignRiderModal({ orderId, restaurantId, currentRiderId, currentRiderName }: AssignRiderModalProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [riders, setRiders] = useState<Rider[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')

    const loadRiders = async () => {
        setIsLoading(true)
        const supabase = createClient()

        // Only fetch assignable riders (online or in pickup phase).
        const { data, error } = await supabase
            .from('riders')
            .select('id, name, phone, status')
            .eq('restaurant_id', restaurantId)
            .eq('is_active', true)
            .in('status', ['online', 'on_delivery'])
            .order('status', { ascending: true })

        if (!error && data) {
            setRiders(data)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        if (open) {
            loadRiders()
            setSearch('')
        }

        // Subscribe to rider status changes for realtime updates
        const supabase = createClient()
        const channel = supabase
            .channel('rider-status-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'riders',
                    filter: `restaurant_id=eq.${restaurantId}`
                },
                () => {
                    // Reload riders when any rider status changes
                    if (open) {
                        loadRiders()
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [open, restaurantId])

    const handleAssign = (riderId: string) => {
        startTransition(async () => {
            const result = await assignRiderToOrder(orderId, riderId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Rider assigned successfully')
                setOpen(false)
                router.refresh()
            }
        })
    }

    const filteredRiders = riders.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.phone.includes(search)
    )

    // Only online riders can be assigned
    const onlineRiders = filteredRiders.filter(r => r.status === 'online')
    // Pickup phase riders can still be assigned while they are at restaurant.
    const busyRiders = filteredRiders.filter(r => r.status === 'on_delivery')

    return (
        <>
            {currentRiderId && currentRiderName ? (
                <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">{currentRiderName}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                        Change
                    </Button>
                </div>
            ) : (
                <Button variant="outline" className="flex-1" onClick={() => setOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Rider
                </Button>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Assign Rider</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or phone"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredRiders.length === 0 ? (
                            <div className="text-center py-8">
                                <User className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    {search ? 'No riders match your search' : 'No riders available'}
                                </p>
                            </div>
                        ) : (
                            <div className="max-h-[300px] overflow-y-auto space-y-1">
                                {onlineRiders.length > 0 && (
                                    <>
                                        <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                            <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                                            Online ({onlineRiders.length})
                                        </div>
                                        {onlineRiders.map((rider) => (
                                            <button
                                                key={rider.id}
                                                onClick={() => handleAssign(rider.id)}
                                                disabled={isPending || rider.id === currentRiderId}
                                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left disabled:opacity-50"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{rider.name}</p>
                                                    <p className="text-sm text-muted-foreground">{rider.phone}</p>
                                                </div>
                                                {rider.id === currentRiderId && (
                                                    <Badge variant="secondary" className="shrink-0">
                                                        <Check className="h-3 w-3 mr-1" />
                                                        Assigned
                                                    </Badge>
                                                )}
                                            </button>
                                        ))}
                                    </>
                                )}

                                {busyRiders.length > 0 && (
                                    <>
                                        <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground mt-2">
                                            <Circle className="h-2 w-2 fill-amber-400 text-amber-400" />
                                            Pickup Phase ({busyRiders.length})
                                        </div>
                                        {busyRiders.map((rider) => (
                                            <button
                                                key={rider.id}
                                                onClick={() => handleAssign(rider.id)}
                                                disabled={isPending || rider.id === currentRiderId}
                                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left disabled:opacity-50"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-amber-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{rider.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        At restaurant • Can accept
                                                    </p>
                                                </div>
                                                {rider.id === currentRiderId && (
                                                    <Badge variant="secondary" className="shrink-0">
                                                        <Check className="h-3 w-3 mr-1" />
                                                        Assigned
                                                    </Badge>
                                                )}
                                            </button>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
