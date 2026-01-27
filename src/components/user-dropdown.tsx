'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, LogOut, Mail, Key, Package } from 'lucide-react'
import { logout } from '@/app/auth/logout/actions'
import { changeEmail } from '@/app/auth/password/actions'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface UserDropdownProps {
    user: {
        email?: string | null
        name?: string | null
        avatarUrl?: string | null
    }
}

export function UserDropdown({ user }: UserDropdownProps) {
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
    const [emailChangePending, setEmailChangePending] = useState(false)
    const [isPending, startTransition] = useTransition()

    const initials = user.name
        ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : user.email?.[0]?.toUpperCase() || 'U'

    const handleChangeEmail = async (formData: FormData) => {
        startTransition(async () => {
            const result = await changeEmail(formData)
            if (result?.error) {
                toast.error(result.error)
            } else if (result?.success) {
                setEmailChangePending(true)
            }
        })
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatarUrl || undefined} alt={user.name || 'User'} />
                            <AvatarFallback>
                                {user.avatarUrl ? initials : <User className="h-5 w-5" />}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <a href="/customer/orders">
                            <Package className="mr-2 h-4 w-4" />
                            <span>My Orders</span>
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setIsEmailDialogOpen(true)}>
                        <Mail className="mr-2 h-4 w-4" />
                        <span>Change Email</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <a href="/reset-password">
                            <Key className="mr-2 h-4 w-4" />
                            <span>Change Password</span>
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <form action={logout}>
                            <button type="submit" className="flex w-full items-center">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </button>
                        </form>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isEmailDialogOpen} onOpenChange={(open) => {
                setIsEmailDialogOpen(open)
                if (!open) setEmailChangePending(false)
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    {emailChangePending ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>Confirm Email Change</DialogTitle>
                                <DialogDescription>
                                    Almost done! Please confirm from both email addresses.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20">
                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                        Action Required
                                    </p>
                                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                                        Click the confirmation link sent to your <strong>current email</strong>:
                                    </p>
                                    <p className="mt-2 font-mono text-sm text-amber-900 dark:text-amber-100">
                                        {user.email}
                                    </p>
                                </div>
                                <p className="text-center text-sm text-muted-foreground">
                                    After that, confirm from your new email to complete the change.
                                </p>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                    setIsEmailDialogOpen(false)
                                    setEmailChangePending(false)
                                }}>
                                    Got it
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle>Change Email</DialogTitle>
                                <DialogDescription>
                                    Enter your new email address. You&apos;ll receive confirmation links on both emails.
                                </DialogDescription>
                            </DialogHeader>
                            <form action={handleChangeEmail}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">New Email</Label>
                                        <Input id="email" name="email" type="email" placeholder="new@example.com" required disabled={isPending} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isPending}>
                                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Update Email
                                    </Button>
                                </DialogFooter>
                            </form>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
