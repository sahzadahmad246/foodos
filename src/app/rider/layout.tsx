import { RiderBottomNav } from '@/components/rider/bottom-nav'

export default function RiderLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            {children}
            <RiderBottomNav />
        </>
    )
}
