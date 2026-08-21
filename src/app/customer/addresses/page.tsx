import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { AddressSelector } from "@/components/customer/address-selector"

export const dynamic = "force-dynamic"

export default async function CustomerAddressesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login?redirect=/customer/addresses")
    }

    return (
        <div className="mx-auto min-h-screen w-full max-w-lg bg-background text-foreground md:shadow-[0_0_0_1px_hsl(var(--border)),0_18px_45px_-20px_rgba(0,0,0,0.45)]">
            <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur">
                <div className="flex items-center gap-3 px-4 py-3">
                    <Link
                        href="/"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <h1 className="text-lg font-semibold">Saved Addresses</h1>
                </div>
            </header>

            <AddressSelector
                open={true}
                userId={user.id}
                embedded
            />
        </div>
    )
}
