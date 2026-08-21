import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { AddressSelector } from "@/components/customer/address-selector"
import { BackButton } from "@/components/customer/back-button"
import { Button } from "@/components/ui/button"
import { MapPin, Package } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CustomerAddressesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login?redirect=/customer/addresses")
    }

    return (
        <div className="mx-auto min-h-screen w-full max-w-lg bg-background text-foreground md:border-x md:border-border/60 md:shadow-[0_0_0_1px_hsl(var(--border)),0_18px_45px_-20px_rgba(0,0,0,0.45)]">
            <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur">
                <div className="flex items-center gap-3 px-3 py-3">
                    <BackButton className="h-9 w-9 border border-border" />
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Delivery</p>
                        <h1 className="truncate text-lg font-semibold">Saved addresses</h1>
                    </div>
                    <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full">
                        <Link href="/customer/orders" aria-label="Orders">
                            <Package className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </header>

            <main className="px-3 pb-10 pt-4">
                <section className="mb-5 overflow-hidden rounded-2xl border border-border/70 bg-card">
                    <div className="flex items-start gap-3 p-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="font-semibold">Where should we deliver?</h2>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                Keep your home, work, and favorite delivery spots ready for faster checkout.
                            </p>
                        </div>
                    </div>
                </section>

                <AddressSelector open={true} userId={user.id} embedded addLabel="Add new address" />
            </main>
        </div>
    )
}
