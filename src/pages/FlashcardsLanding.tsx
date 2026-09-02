// src/pages/FlashcardsLanding.tsx
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PageShell } from '../components/PageShell'
import { MascotPlaceholder } from '../components/MascotPlaceholder'

export function FlashcardsLanding() {
  const navigate = useNavigate()

  return (
    <PageShell backTo="/" backLabel="Home">
      <div className="max-w-lg mx-auto w-full">
        <div className="flex flex-col items-center py-6 gap-3">
          <MascotPlaceholder mood="flashcards" size={150} />
          <h1 className="page-title">Flashcards</h1>
          <p className="text-brand-muted text-center max-w-sm">
            Anki-style drills — harder fallacies come up more often as you learn.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <motion.button
            onClick={() => navigate('/flashcards/drill/names')}
            className="btn-primary w-full text-left flex items-center gap-4 rounded-xl px-5 py-4"
            whileTap={{ scale: 0.97 }}
          >
            <div className="flex-1">
              <div className="font-display text-2xl tracking-wider">DRILL NAMES</div>
              <div className="text-sm font-body mt-0.5 opacity-80 normal-case">See the name → recall the description</div>
            </div>
            <span className="text-2xl">→</span>
          </motion.button>

          <motion.button
            onClick={() => navigate('/flashcards/drill/examples')}
            className="btn-ghost w-full text-left flex items-center gap-4 rounded-xl px-5 py-4"
            whileTap={{ scale: 0.97 }}
          >
            <div className="flex-1">
              <div className="font-display text-2xl tracking-wider">DRILL EXAMPLES</div>
              <div className="text-sm font-body mt-0.5 normal-case">See the description → recall the name</div>
            </div>
            <span className="text-2xl">→</span>
          </motion.button>
        </div>
      </div>
    </PageShell>
  )
}
