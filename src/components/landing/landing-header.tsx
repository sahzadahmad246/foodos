'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserDropdown } from '@/components/user-dropdown'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export type LandingUser = { email?: string | null; name?: string | null; avatarUrl?: string | null }
const NAV_LINKS = [{ href: '#platform', label: 'Platform' }, { href: '#service', label: 'How it works' }, { href: '#kitchens', label: 'Live kitchens' }]

export function LandingHeader({ user, ctaHref, ctaLabel }: { user: LandingUser | null; ctaHref: string; ctaLabel: string }) {
  const [open, setOpen] = useState(false)
  return (
    <header className="landing-header sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="foodOS home">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary font-mono text-sm font-bold text-primary-foreground">f</span>
          <span className="font-sans text-lg font-semibold tracking-tight">food<span className="text-primary">OS</span></span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {NAV_LINKS.map((link) => <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">{link.label}</a>)}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          {user ? <><Link href={ctaHref} className="text-sm text-muted-foreground hover:text-foreground">{ctaLabel}</Link><UserDropdown user={user} /></> : <><Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Log in</Link><Button asChild size="sm"><Link href="/signup">Start free <ArrowUpRight data-icon="inline-end" /></Link></Button></>}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          {user && <UserDropdown user={user} />}
          <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Open menu"><Menu /></Button></SheetTrigger><SheetContent><SheetHeader><SheetTitle className="text-left">foodOS</SheetTitle></SheetHeader><div className="flex flex-col gap-4 pt-8">{NAV_LINKS.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="py-2 text-lg" >{link.label}</a>)}<Button asChild><Link href={user ? ctaHref : '/signup'} onClick={() => setOpen(false)}>{user ? ctaLabel : 'Start free'} <ArrowUpRight data-icon="inline-end" /></Link></Button>{!user && <Link href="/login" onClick={() => setOpen(false)} className="text-center text-sm text-muted-foreground">Log in</Link>}</div></SheetContent></Sheet>
        </div>
      </div>
    </header>
  )
}
