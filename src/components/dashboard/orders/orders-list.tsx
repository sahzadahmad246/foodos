'use client'

import { useState, useMemo } from 'react'
import { Package, Search, Clock, ChefHat, Bike, Check, XCircle, Archive } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { OrderCard } from './order-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface OrderItem {
    id: string
    name: string
    price: number
    quantity: number
}

interface Order {
    id: string
    order_number: string
    customer_name: string
    customer_phone: string | null
    customer_address: string | null
    items_total: number
    delivery_fee: number
    tax_amount: number
    total_amount: number
    payment_method: string
    payment_status: string
    status: string
    created_at: string
    confirmed_at?: string | null
    preparing_at?: string | null
    ready_at?: string | null
    picked_up_at?: string | null
    delivered_at?: string | null
    cancelled_at?: string | null
    notes?: string | null
    rider_id?: string | null
    restaurant_id: string
    order_items: OrderItem[]
    rider?: {
        id: string
        name: string
    } | null
}

interface OrdersListProps {
    orders: Order[]
}

const TAB_CONFIG = [
    { value: 'pending', label: 'New', icon: Clock, color: 'text-yellow-600' },
    { value: 'preparing', label: 'Preparing', icon: ChefHat, color: 'text-purple-600' },
    { value: 'ready', label: 'Ready', icon: Package, color: 'text-green-600' },
    { value: 'out_for_delivery', label: 'Picked Up', icon: Bike, color: 'text-blue-600' },
    { value: 'delivered', label: 'Delivered', icon: Check, color: 'text-green-700' },
    { value: 'archive', label: 'Archive', icon: Archive, color: 'text-muted-foreground' },
]

export function OrdersList({ orders }: OrdersListProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('pending')

    // Filter orders by status and search
    const filteredOrders = useMemo(() => {
        let filtered = orders

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(order =>
                order.order_number.toLowerCase().includes(query) ||
                order.customer_name.toLowerCase().includes(query) ||
                order.customer_phone?.includes(query)
            )
        }

        // Filter by tab/status
        if (activeTab === 'archive') {
            // Archive shows cancelled orders
            filtered = filtered.filter(order => order.status === 'cancelled')
        } else {
            filtered = filtered.filter(order => order.status === activeTab)
        }

        return filtered
    }, [orders, searchQuery, activeTab])

    // Count orders by status for badges
    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = {
            pending: 0,
            preparing: 0,
            ready: 0,
            out_for_delivery: 0,
            delivered: 0,
            archive: 0,
        }

        orders.forEach(order => {
            if (order.status === 'cancelled') {
                counts.archive++
            } else if (counts[order.status] !== undefined) {
                counts[order.status]++
            }
        })

        return counts
    }, [orders])

    if (orders.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No orders yet</h3>
                <p className="text-muted-foreground text-sm">
                    Orders from customers will appear here
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by order number, customer name, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                    {TAB_CONFIG.map((tab) => {
                        const Icon = tab.icon
                        const count = statusCounts[tab.value]
                        return (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2"
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                                {count > 0 && (
                                    <Badge
                                        variant={activeTab === tab.value ? "secondary" : "outline"}
                                        className="h-5 min-w-5 px-1.5 text-xs"
                                    >
                                        {count}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        )
                    })}
                </TabsList>

                {TAB_CONFIG.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value} className="mt-4">
                        {filteredOrders.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-12 text-center">
                                <tab.icon className={`h-12 w-12 mx-auto mb-4 ${tab.color}`} />
                                <p className="text-muted-foreground">
                                    {searchQuery
                                        ? 'No orders match your search'
                                        : `No ${tab.label.toLowerCase()} orders`
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 lg:grid-cols-2">
                                {filteredOrders.map((order) => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}
