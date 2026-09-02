// src/pages/FlashcardsDrill.tsx
// Anki-style flashcard drill loop — DRILL NAMES and DRILL EXAMPLES
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { initFlashcards, revealCard, rateAndAdvance, type FlashcardState, type DrillMode } from '../game/flashcards'
import { PageShell } from '../components/PageShell'

export function FlashcardsDrill() {
  const { mode } = useParams<{ mode: string }>()
  const drillMode: DrillMode = mode === 'examples' ? 'examples' : 'names'

  const [state, setState] = useState<FlashcardState>(() => initFlashcards(drillMode))
  const [showExample, setShowExample] = useState(false)
  const [direction, setDirection] = useState<'left' | 'right'>('left')

  // Reset drill mode if route param changes
  useEffect(() => {
    setState(initFlashcards(drillMode))
    setShowExample(false)
  }, [drillMode])

  const { current, revealed } = state

  function handleReveal() {
    setState(revealCard(state))
    setShowExample(false)
  }

  function handleRate(correct: boolean) {
    setDirection('left')
    setState(rateAndAdvance(state, correct))
    setShowExample(false)
  }

  // Front of card
  const front = drillMode === 'names' ? current.name.toUpperCase() : current.description
  const frontLabel = drillMode === 'names' ? 'Name' : 'Description'

  // Back of card
  const back = drillMode === 'names' ? current.description : current.name.toUpperCase()
  const backLabel = drillMode === 'names' ? 'Description' : 'Name'

  return (
    <PageShell backTo="/flashcards" backLabel="Flashcards">
      <div className="max-w-xl mx-auto w-full pt-4 flex flex-col items-center gap-6">
        {/* Session count */}
        <p className="text-brand-muted text-sm font-body">
          {drillMode === 'names' ? 'Drill Names' : 'Drill Examples'} · Card {state.sessionCount + 1}
        </p>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id + '-' + (revealed ? 'rev' : 'front')}
            initial={{ x: direction === 'left' ? '80%' : '-80%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction === 'left' ? '-80%' : '80%', opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="w-full"
          >
            <div className="card min-h-52 flex flex-col gap-4">
              {/* Front */}
              <div>
                <p className="text-xs text-brand-muted uppercase tracking-widest mb-1">{frontLabel}</p>
                <p className="font-display text-3xl text-brand-primary">{front}</p>
              </div>

              {/* Back (revealed) */}
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-gray-100 pt-4 flex flex-col gap-3"
                >
                  <div>
                    <p className="text-xs text-brand-muted uppercase tracking-widest mb-1">{backLabel}</p>
                    <p className={drillMode === 'names' ? 'text-gray-700 leading-relaxed' : 'font-display text-2xl text-brand-primary'}>
                      {back}
                    </p>
                  </div>

                  {/* Example expand */}
                  <div>
                    <button
                      onClick={() => setShowExample((v) => !v)}
                      className="text-xs text-brand-primary underline underline-offset-2 font-body"
                    >
                      {showExample ? 'Hide example' : 'Show example'}
                    </button>
                    <AnimatePresence>
                      {showExample && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="text-sm text-gray-600 italic mt-2 leading-relaxed overflow-hidden"
                        >
                          "{current.example}"
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        {!revealed ? (
          <motion.button
            onClick={handleReveal}
            className="btn-accent w-full max-w-xs"
            whileTap={{ scale: 0.96 }}
          >
            Reveal Answer
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 w-full"
          >
            <p className="font-body text-brand-muted text-sm">Were you right?</p>
            <div className="flex gap-6 justify-center">
              <button
                onClick={() => handleRate(false)}
                className="w-16 h-16 rounded-2xl bg-red-100 text-brand-red text-3xl flex items-center justify-center hover:bg-red-200 active:scale-95 transition-all"
                aria-label="Incorrect"
              >
                ✗
              </button>
              <button
                onClick={() => handleRate(true)}
                className="w-16 h-16 rounded-2xl bg-green-100 text-brand-green text-3xl flex items-center justify-center hover:bg-green-200 active:scale-95 transition-all"
                aria-label="Correct"
              >
                ✓
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </PageShell>
  )
}
