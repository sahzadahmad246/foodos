'use client'

import Image from 'next/image'
import { Plus, Leaf, Flame, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/hooks/use-cart'
import { toast } from 'sonner'

interface MenuItem { id: string; name: string; description?: string | null; price: number; image_url?: string | null; is_veg: boolean; is_spicy: boolean; is_bestseller: boolean; is_featured: boolean }
interface MenuItemCardProps { item: MenuItem }

export function MenuItemCard({ item }: MenuItemCardProps) {
    const { addItem } = useCart()
    const handleAddToCart = () => { addItem({ id: item.id, name: item.name, price: item.price, image_url: item.image_url, is_veg: item.is_veg }); toast.success(`${item.name} added to cart`) }
    return <article className="group overflow-hidden rounded-2xl border border-border/70 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"><div className="relative aspect-[1.35] overflow-hidden bg-muted">{item.image_url ? <Image src={item.image_url} alt={item.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image available</div>}<div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">{item.is_bestseller ? <Badge className="gap-1 rounded-full bg-[#d7f36b] text-[#101715] hover:bg-[#d7f36b]"><Star className="size-3" /> Bestseller</Badge> : <span />}{item.is_veg ? <Badge variant="secondary" className="gap-1 rounded-full bg-background/85 text-foreground backdrop-blur"><Leaf className="size-3 text-primary" /> Veg</Badge> : <Badge variant="secondary" className="rounded-full bg-background/85 text-foreground backdrop-blur">Non-veg</Badge>}</div>{item.is_spicy && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#f07f68] px-2.5 py-1 text-[10px] font-semibold text-[#101715]"><Flame className="size-3" /> Spicy</span>}</div><div className="p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-serif text-xl leading-tight">{item.name}</h3>{item.description && <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">{item.description}</p>}</div><span className="shrink-0 text-sm font-semibold text-primary">₹{item.price}</span></div><Button onClick={handleAddToCart} className="mt-4 w-full rounded-full" size="sm"><Plus data-icon="inline-start" /> Add to cart</Button></div></article>
}
