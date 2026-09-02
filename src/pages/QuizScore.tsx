// src/pages/QuizScore.tsx
// Score screen: tiered comment, mascot emotion, name entry, high-score save
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { scoreTier, type QuizAnswer } from '../game/quiz'
import { addHighScore } from '../lib/storage'
import { PageShell } from '../components/PageShell'
import { MascotPlaceholder } from '../components/MascotPlaceholder'

export function QuizScore() {
  const navigate = useNavigate()
  const location = useLocation()
  const answers: QuizAnswer[] = location.state?.answers ?? []
  const score = answers.filter((a) => a.correct).length
  const { label, mood } = scoreTier(score)

  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    if (!name.trim() || saved) return
    addHighScore({ name: name.trim(), score, date: new Date().toISOString() })
    setSaved(true)
  }

  return (
    <PageShell backTo="/quiz" backLabel="Quiz">
      <div className="max-w-lg mx-auto w-full flex flex-col items-center pt-4 gap-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        >
          <MascotPlaceholder mood={mood} size={180} />
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-center"
        >
          <div className="font-display text-6xl text-brand-primary">{score}<span className="text-3xl text-brand-muted">/15</span></div>
          <div className="font-display text-3xl text-brand-accent mt-1">{label}</div>
        </motion.div>

        {/* Name entry */}
        {!saved ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="card w-full flex flex-col gap-3"
          >
            <p className="font-body text-brand-muted text-sm text-center">Save your score to the high-score table?</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 24))}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="Your name"
                maxLength={24}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <button onClick={handleSave} disabled={!name.trim()} className="btn-accent text-base px-4 py-2 disabled:opacity-50">
                Save
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-display text-xl text-brand-green"
          >
            ✓ Score saved!
          </motion.p>
        )}

        {/* Actions */}
        <div className="flex gap-4 w-full">
          <button onClick={() => navigate('/quiz')} className="btn-ghost flex-1">Back</button>
          <button onClick={() => navigate('/quiz/play')} className="btn-primary flex-1">Retry</button>
        </div>
      </div>
    </PageShell>
  )
}
