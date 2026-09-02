// src/pages/Home.tsx
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MascotPlaceholder } from '../components/MascotPlaceholder'

interface NavButton {
  label: string
  sub: string
  to: string
  disabled?: boolean
  comingSoon?: boolean
}

const NAV_BUTTONS: NavButton[] = [
  { label: 'QUIZ', sub: 'Test your knowledge with generated examples', to: '/quiz' },
  { label: 'FLASHCARDS', sub: 'Drill the fallacies using Anki-style flashcards', to: '/flashcards' },
  { label: 'STUDY', sub: 'Read about different fallacies with descriptions and worked examples', to: '/study' },
  { label: 'ANALYZE', sub: "Captain Fallacy will critique external content!", to: '#', disabled: true, comingSoon: true },
]

export function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-start pt-8 px-4 pb-12">
      {/* Hero */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <MascotPlaceholder mood="default" size={200} className="drop-shadow-xl" />
        <h1 className="font-display text-6xl md:text-7xl text-brand-primary tracking-wider uppercase mt-2">
          Captain Fallacy
        </h1>
        <p className="text-brand-muted font-body text-lg mt-1 mb-8 text-center">
          Spot the trick. Win the argument.
        </p>
      </motion.div>

      {/* Nav buttons */}
      <div className="w-full max-w-lg flex flex-col gap-4">
        {NAV_BUTTONS.map((btn, i) => (
          <motion.div
            key={btn.label}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.35 }}
          >
            {btn.disabled ? (
              <div className="relative btn-disabled w-full text-left flex items-center gap-4 rounded-xl px-5 py-4">
                <div className="flex-1">
                  <div className="font-display text-2xl tracking-wider">{btn.label}</div>
                  <div className="text-sm font-body mt-0.5 opacity-70">{btn.sub}</div>
                </div>
                {btn.comingSoon && (
                  <span className="shrink-0 text-xs font-bold bg-gray-400 text-white rounded-full px-3 py-1 uppercase tracking-wide">
                    Coming soon
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate(btn.to)}
                className="btn-primary w-full text-left flex items-center gap-4 rounded-xl px-5 py-4"
              >
                <div className="flex-1">
                  <div className="font-display text-2xl tracking-wider">{btn.label}</div>
                  <div className="text-sm font-body mt-0.5 opacity-80 normal-case">{btn.sub}</div>
                </div>
                <span className="text-2xl shrink-0">→</span>
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer / About link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-10"
      >
        <button
          onClick={() => navigate('/about')}
          className="text-brand-muted text-sm underline-offset-2 hover:underline font-body"
        >
          About Captain Fallacy
        </button>
      </motion.div>
    </div>
  )
}
