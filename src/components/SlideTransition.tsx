// src/components/SlideTransition.tsx
// Horizontal carousel/wipe-left transition wrapper using Framer Motion
import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  motionKey: string | number
  children: ReactNode
  direction?: 'left' | 'right'
}

const variants = {
  enterLeft:  { x: '100%', opacity: 0 },
  enterRight: { x: '-100%', opacity: 0 },
  center:     { x: 0, opacity: 1 },
  exitLeft:   { x: '-100%', opacity: 0 },
  exitRight:  { x: '100%', opacity: 0 },
}

export function SlideTransition({ motionKey, children, direction = 'left' }: Props) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={motionKey}
        initial={direction === 'left' ? variants.enterLeft : variants.enterRight}
        animate={variants.center}
        exit={direction === 'left' ? variants.exitLeft : variants.exitRight}
        transition={{ duration: 0.28, ease: 'easeInOut' }}
        style={{ width: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
