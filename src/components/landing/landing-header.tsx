'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserDropdown } from '@/components/user-dropdown'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export type LandingUser = { email?: string | null; name?: string | null; avatarUrl?: string | null }

const NAV_LINKS = [
  { href: '#platform', label: 'Platform' },
  { href: '#service', label: 'How it works' },
  { href: '#kitchens', label: 'Live kitchens' },
]

export function LandingHeader({ user, ctaHref, ctaLabel }: { user: LandingUser | null; ctaHref: string; ctaLabel: string }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="landing-header sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-14">
        <Link href="/" className="flex items-center gap-2.5" aria-label="foodOS home">
          <span className="flex size-8 items-center justify-center bg-primary font-mono text-sm font-bold text-primary-foreground">f</span>
          <span className="font-sans text-lg font-semibold tracking-[-.04em]">food<span className="text-primary">OS</span></span>
        </Link>

        <nav className="hidden items-center gap-8 font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground md:flex">
          {NAV_LINKS.map((link) => <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">{link.label}</a>)}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          {user ? <><Link href={ctaHref} className="font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground hover:text-foreground">{ctaLabel}</Link><UserDropdown user={user} /></> : <><Link href="/login" className="font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground hover:text-foreground">Log in</Link><Button asChild size="sm"><Link href="/signup">Start free <ArrowUpRight data-icon="inline-end" /></Link></Button></>}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {user && <UserDropdown user={user} />}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Open menu"><Menu /></Button></SheetTrigger>
            <SheetContent side="right" className="w-[min(88vw,380px)] overflow-y-auto bg-background p-0">
              <SheetHeader className="border-b border-border px-5 py-5 pr-14">
                <SheetTitle className="text-left">foodOS</SheetTitle>
              </SheetHeader>
              <div className="flex min-h-[calc(100dvh-81px)] flex-col px-5 py-7">
                <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                  {NAV_LINKS.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="border-b border-border/60 py-4 text-lg text-foreground transition-colors hover:text-primary">{link.label}</a>)}
                </nav>
                <div className="mt-auto flex flex-col gap-4 border-t border-border pt-6">
                  {user ? <><Link href={ctaHref} onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-center border border-border font-mono text-[10px] uppercase tracking-[.15em]">{ctaLabel}</Link><UserDropdown user={user} /></> : <><Button asChild className="w-full"><Link href="/signup" onClick={() => setOpen(false)}>Start free <ArrowUpRight data-icon="inline-end" /></Link></Button><Link href="/login" onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-center font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Log in</Link></>}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
