'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserDropdown } from '@/components/user-dropdown'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'

export type LandingUser = {
    email?: string | null
    name?: string | null
    avatarUrl?: string | null
}

const NAV_LINKS = [
    { href: '#board', label: 'The board' },
    { href: '#service', label: 'Service' },
    { href: '#kitchens', label: 'Open kitchens' },
]

export function LandingHeader({
    user,
    ctaHref,
    ctaLabel,
}: {
    user: LandingUser | null
    ctaHref: string
    ctaLabel: string
}) {
    const [open, setOpen] = useState(false)

    return (
        <header className="sticky top-0 z-40 border-b border-[#1c1410]/10 bg-[#efe7d6]/85 backdrop-blur-md">
            <div className="mx-auto flex h-[3.75rem] max-w-[1120px] items-center justify-between px-4 sm:px-6">
                <Link href="/" className="flex items-baseline gap-2">
                    <span className="font-serif text-2xl leading-none tracking-tight text-[#1c1410]">
                        foodOS
                    </span>
                    <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-[#1c1410]/45 sm:inline">
                        kitchen
                    </span>
                </Link>

                <nav className="hidden items-center gap-7 font-mono text-[11px] uppercase tracking-[0.18em] text-[#1c1410]/65 md:flex">
                    {NAV_LINKS.map((link) => (
                        <a key={link.href} href={link.href} className="transition-colors hover:text-[#1c1410]">
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-5 md:flex">
                    {user ? (
                        <>
                            <Link
                                href={ctaHref}
                                className="bg-[#c4452a] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#f7f0e4] transition-colors hover:bg-[#a83822]"
                            >
                                {ctaLabel}
                            </Link>
                            <UserDropdown user={user} />
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#1c1410]/70 hover:text-[#1c1410]">
                                Log in
                            </Link>
                            <Link
                                href="/signup"
                                className="bg-[#c4452a] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#f7f0e4] transition-colors hover:bg-[#a83822]"
                            >
                                Open a kitchen
                            </Link>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2 md:hidden">
                    {user && <UserDropdown user={user} />}
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-none" aria-label="Open menu">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72 border-l-[#1c1410]/10 bg-[#efe7d6]">
                            <SheetHeader>
                                <SheetTitle className="text-left font-serif text-2xl">foodOS</SheetTitle>
                            </SheetHeader>
                            <div className="mt-8 flex flex-col gap-1">
                                {NAV_LINKS.map((link) => (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setOpen(false)}
                                        className="px-1 py-3 font-mono text-xs uppercase tracking-[0.18em] text-[#1c1410]/70"
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                            <div className="mt-8 flex flex-col gap-3">
                                {user ? (
                                    <Link
                                        href={ctaHref}
                                        onClick={() => setOpen(false)}
                                        className="bg-[#c4452a] px-4 py-3 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-[#f7f0e4]"
                                    >
                                        {ctaLabel}
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href="/signup"
                                            onClick={() => setOpen(false)}
                                            className="bg-[#c4452a] px-4 py-3 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-[#f7f0e4]"
                                        >
                                            Open a kitchen
                                        </Link>
                                        <Link
                                            href="/login"
                                            onClick={() => setOpen(false)}
                                            className="text-center font-mono text-[11px] uppercase tracking-[0.16em] text-[#1c1410]/70"
                                        >
                                            Log in
                                        </Link>
                                    </>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}
