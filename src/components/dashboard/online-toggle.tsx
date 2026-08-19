'use client'

import { useState, useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateRestaurant } from '@/app/onboarding/actions'

interface OnlineToggleProps {
    restaurantId: string
    isOnline: boolean
    profileComplete: boolean
}

export function OnlineToggle({ restaurantId, isOnline, profileComplete }: OnlineToggleProps) {
    const [showConfirm, setShowConfirm] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [currentValue, setCurrentValue] = useState(isOnline)

    const handleToggle = () => {
        if (!profileComplete && !currentValue) {
            toast.error('Complete your profile to go online')
            return
        }
        setShowConfirm(true)
    }

    const handleConfirm = () => {
        startTransition(async () => {
            const newValue = !currentValue
            const result = await updateRestaurant(restaurantId, { is_online: newValue } as any)

            if (result.error) {
                toast.error(result.error)
            } else {
                setCurrentValue(newValue)
                toast.success(newValue ? 'Restaurant is now online!' : 'Restaurant is now offline')
            }
            setShowConfirm(false)
        })
    }

    return (
        <TooltipProvider>
            <div className="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={currentValue}
                                onCheckedChange={handleToggle}
                                disabled={isPending || (!profileComplete && !currentValue)}
                            />
                            <Badge variant={currentValue ? 'default' : 'secondary'} className="hidden sm:inline-flex">
                                {currentValue ? 'Online' : 'Offline'}
                            </Badge>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        {!profileComplete && !currentValue
                            ? 'Complete your profile to go online'
                            : currentValue
                                ? 'Click to go offline'
                                : 'Click to go online'
                        }
                    </TooltipContent>
                </Tooltip>
            </div>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {currentValue ? 'Go Offline?' : 'Go Online?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {currentValue
                                ? 'Your restaurant will stop accepting new orders.'
                                : 'Your restaurant will start accepting orders.'
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </TooltipProvider>
    )
}
