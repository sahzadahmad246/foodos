'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, X, Sparkles } from 'lucide-react'
import { useState } from 'react'

interface ProfileCompletionCardProps {
    percentage: number
    missing: string[]
}

export function ProfileCompletionCard({ percentage, missing }: ProfileCompletionCardProps) {
    const [dismissed, setDismissed] = useState(false)

    if (dismissed || percentage === 100) return null

    return (
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm">
            <div className="absolute inset-0 bg-grid-white/5" />
            <CardContent className="relative pt-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                        <div className="rounded-lg bg-emerald-500/20 p-3 mt-0.5">
                            <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-base text-foreground">
                                    Complete Your Profile
                                </p>
                                <span className="text-xs font-medium bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">
                                    {percentage}%
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                Add the missing information to unlock all features and go online.
                            </p>
                            <div className="space-y-2 mb-4">
                                <Progress value={percentage} className="h-2.5" />
                            </div>
                            {missing.length > 0 && missing.length <= 5 && (
                                <div className="mb-4 p-3 rounded-lg bg-white/50 dark:bg-white/5 border border-white/10">
                                    <p className="text-xs font-medium text-foreground mb-2">Missing items:</p>
                                    <ul className="space-y-1">
                                        {missing.slice(0, 3).map((item) => (
                                            <li key={item} className="text-xs text-muted-foreground flex items-center gap-2">
                                                <CheckCircle2 className="h-3 w-3 text-muted-foreground/50" />
                                                {item}
                                            </li>
                                        ))}
                                        {missing.length > 3 && (
                                            <li className="text-xs text-muted-foreground font-medium pt-1">
                                                +{missing.length - 3} more
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Link href="/dashboard/outlet">
                                    Complete Profile <Sparkles className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-white/10 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </CardContent>
        </Card>
    )
}
