'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
    image_url?: string | null
    is_veg: boolean
}

interface CartStore {
    items: CartItem[]
    addItem: (item: Omit<CartItem, 'quantity'>) => void
    removeItem: (itemId: string) => void
    updateQuantity: (itemId: string, quantity: number) => void
    clearCart: () => void
    getTotal: () => number
}

export const useCart = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (item) => {
                set((state) => {
                    const existingItem = state.items.find((i) => i.id === item.id)

                    if (existingItem) {
                        return {
                            items: state.items.map((i) =>
                                i.id === item.id
                                    ? { ...i, quantity: i.quantity + 1 }
                                    : i
                            ),
                        }
                    }

                    return {
                        items: [...state.items, { ...item, quantity: 1 }],
                    }
                })
            },

            removeItem: (itemId) => {
                set((state) => ({
                    items: state.items.filter((i) => i.id !== itemId),
                }))
            },

            updateQuantity: (itemId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(itemId)
                    return
                }

                set((state) => ({
                    items: state.items.map((i) =>
                        i.id === itemId ? { ...i, quantity } : i
                    ),
                }))
            },

            clearCart: () => {
                set({ items: [] })
            },

            getTotal: () => {
                return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
            },
        }),
        {
            name: 'foodos-cart',
        }
    )
)
