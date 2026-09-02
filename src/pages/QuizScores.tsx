// src/pages/QuizScores.tsx — Full high-score table
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getHighScores } from '../lib/storage'
import { PageShell } from '../components/PageShell'

export function QuizScores() {
  const navigate = useNavigate()
  const scores = getHighScores()

  return (
    <PageShell backTo="/quiz" backLabel="Quiz">
      <div className="max-w-lg mx-auto w-full pt-4">
        <h1 className="page-title mb-6 text-center">High Scores</h1>

        {scores.length === 0 ? (
          <div className="card text-center">
            <p className="text-brand-muted font-body">No scores yet — start a quiz!</p>
            <button onClick={() => navigate('/quiz/play')} className="btn-primary mt-4">
              Play Now
            </button>
          </div>
        ) : (
          <div className="card">
            <ol className="flex flex-col divide-y divide-gray-100">
              {scores.map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between py-3 gap-4"
                >
                  <span className="font-display text-2xl text-brand-muted w-8">{i + 1}</span>
                  <span className="flex-1 font-body font-semibold text-gray-800">{s.name}</span>
                  <span className="font-display text-2xl text-brand-primary">{s.score}<span className="text-sm text-brand-muted">/15</span></span>
                  <span className="text-xs text-gray-400">{new Date(s.date).toLocaleDateString()}</span>
                </motion.li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </PageShell>
  )
}
