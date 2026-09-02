// src/pages/QuizLanding.tsx
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PageShell } from '../components/PageShell'
import { MascotPlaceholder } from '../components/MascotPlaceholder'
import { getHighScores } from '../lib/storage'

export function QuizLanding() {
  const navigate = useNavigate()
  const scores = getHighScores().slice(0, 10)

  return (
    <PageShell backTo="/" backLabel="Home">
      <div className="max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col items-center py-6 gap-3">
          <MascotPlaceholder mood="quiz" size={150} />
          <h1 className="page-title">Quiz</h1>
          <p className="text-brand-muted text-center max-w-sm">
            15 questions. AI-generated examples. Can you spot every fallacy?
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-4 mb-8">
          <motion.button
            onClick={() => navigate('/quiz/play')}
            className="btn-primary w-full"
            whileTap={{ scale: 0.97 }}
          >
            START
          </motion.button>
          <motion.button
            onClick={() => navigate('/quiz/scores')}
            className="btn-ghost w-full"
            whileTap={{ scale: 0.97 }}
          >
            HIGH SCORES
          </motion.button>
        </div>

        {/* Preview of top scores */}
        {scores.length > 0 && (
          <div className="card">
            <h2 className="font-display text-xl text-brand-primary uppercase tracking-wide mb-3">Top Scores</h2>
            <ol className="flex flex-col gap-1">
              {scores.slice(0, 5).map((s, i) => (
                <li key={i} className="flex justify-between text-sm font-body">
                  <span className="text-brand-muted">{i + 1}. {s.name}</span>
                  <span className="font-bold text-brand-primary">{s.score}/15</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </PageShell>
  )
}
