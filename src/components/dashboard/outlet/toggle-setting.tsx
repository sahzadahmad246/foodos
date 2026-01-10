'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { toggleRestaurantSetting, updateRestaurant } from '@/app/onboarding/actions'

interface ToggleSettingProps {
    restaurantId: string
    settingName: string
    label: string
    description: string
    enabled: boolean
    isRestaurantField?: boolean
    requiresProfileComplete?: boolean
    profileComplete?: boolean
}

export function ToggleSetting({
    restaurantId,
    settingName,
    label,
    description,
    enabled,
    isRestaurantField = false,
    requiresProfileComplete = false,
    profileComplete = true
}: ToggleSettingProps) {
    const router = useRouter()
    const [showConfirm, setShowConfirm] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [currentValue, setCurrentValue] = useState(enabled)

    const handleToggle = () => {
        if (requiresProfileComplete && !currentValue && !profileComplete) {
            toast.error('Complete your profile to go online')
            return
        }
        setShowConfirm(true)
    }

    const handleConfirm = () => {
        startTransition(async () => {
            const newValue = !currentValue

            let result
            if (isRestaurantField) {
                result = await updateRestaurant(restaurantId, { [settingName]: newValue } as any)
            } else {
                result = await toggleRestaurantSetting(restaurantId, settingName, newValue)
            }

            if (result.error) {
                toast.error(result.error)
            } else {
                setCurrentValue(newValue)
                toast.success(`${label} ${newValue ? 'enabled' : 'disabled'}`)
                router.refresh()
            }
            setShowConfirm(false)
        })
    }

    const isDisabled = isPending || (requiresProfileComplete && !currentValue && !profileComplete)

    return (
        <>
            <div className={`flex items-center justify-between gap-4 p-3 rounded-lg transition-colors ${currentValue ? 'bg-primary/5' : 'bg-muted/50'
                }`}>
                <div className="min-w-0">
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground truncate">{description}</p>
                    {requiresProfileComplete && !profileComplete && (
                        <p className="text-xs text-amber-600 mt-0.5">Complete profile first</p>
                    )}
                </div>
                <Switch
                    checked={currentValue}
                    onCheckedChange={handleToggle}
                    disabled={isDisabled}
                    className="shrink-0"
                />
            </div>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{currentValue ? 'Disable' : 'Enable'} {label}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {currentValue
                                ? `This will turn off ${label.toLowerCase()}.`
                                : `This will turn on ${label.toLowerCase()}.`
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
        </>
    )
}
