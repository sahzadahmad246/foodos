import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RidersList } from "@/components/dashboard/riders/riders-list"
import { Bike } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function RidersPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .single()

    if (!restaurant) redirect("/onboarding")

    // Fetch riders
    const { data: riders } = await supabase
        .from("riders")
        .select(`
            id,
            name,
            email,
            phone,
            vehicle_type,
            vehicle_number,
            status,
            is_active
        `)
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false })

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                    <Bike className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                    Riders
                </h2>
                <p className="text-muted-foreground mt-1">
                    Manage your delivery partners
                </p>
            </div>

            <RidersList
                riders={(riders || []) as any}
                restaurantId={restaurant.id}
            />
        </div>
    )
}
