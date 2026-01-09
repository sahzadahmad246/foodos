'use client'

import { Mail, ArrowRight, X } from 'lucide-react'
import { useState } from 'react'

interface EmailChangeAlertProps {
    email?: string | null
}

export function EmailChangeAlert({ email }: EmailChangeAlertProps) {
    const [isVisible, setIsVisible] = useState(true)

    if (!isVisible) return null

    return (
        <div className="border-b border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                            <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">
                                New Email Confirmed!
                            </p>
                            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                                To complete the email change, please click the confirmation link sent to your <strong>old email</strong>:
                            </p>
                            {email && (
                                <p className="mt-1 font-mono text-sm text-amber-900 dark:text-amber-100">
                                    {email}
                                </p>
                            )}
                            <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                <ArrowRight className="h-3 w-3" />
                                <span>Check your inbox and click the link to finish</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="shrink-0 rounded-md p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
