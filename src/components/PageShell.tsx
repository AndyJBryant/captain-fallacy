// src/components/PageShell.tsx
// Wraps every non-home screen: back button top-left, centred content area
import type { ReactNode } from 'react'
import { BackButton } from './BackButton'

interface Props {
  backTo?: string
  backLabel?: string
  children: ReactNode
  className?: string
}

export function PageShell({ backTo, backLabel, children, className = '' }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <header className="px-4 pt-4 pb-2">
        <BackButton to={backTo} label={backLabel} />
      </header>
      <main className={`flex-1 px-4 pb-8 ${className}`}>
        {children}
      </main>
    </div>
  )
}
