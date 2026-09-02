// src/pages/Study.tsx — Study landing page: scrollable fallacy list
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fallacies } from '../data/fallacies'
import { PageShell } from '../components/PageShell'
import { MascotPlaceholder } from '../components/MascotPlaceholder'

export function Study() {
  const navigate = useNavigate()

  return (
    <PageShell backTo="/" backLabel="Home">
      {/* Header */}
      <div className="flex flex-col items-center py-6 gap-3">
        <MascotPlaceholder mood="study" size={140} />
        <h1 className="page-title">Study</h1>
        <p className="text-brand-muted text-center max-w-sm">
          Pick a fallacy to read its description and examples — or generate fresh ones with AI.
        </p>
      </div>

      {/* Scrollable fallacy list */}
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-3 pb-8">
        {fallacies.map((f, i) => (
          <motion.button
            key={f.id}
            onClick={() => navigate(`/study/${f.id}`)}
            className="w-full text-left card flex items-center gap-4 hover:shadow-xl active:scale-98 transition-all group"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.025, duration: 0.25 }}
          >
            {/* Icon placeholder */}
            <div className="shrink-0 w-12 h-12 rounded-xl bg-brand-bg flex items-center justify-center border border-gray-200">
              <span className="text-2xl" role="img" aria-label={f.name}>🧠</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-xl text-brand-primary tracking-wide uppercase group-hover:text-blue-700">
                {f.name}
              </div>
              <div className="text-brand-muted text-sm truncate">{f.description}</div>
            </div>
            <span className="text-brand-muted group-hover:text-brand-primary transition-colors text-xl shrink-0">›</span>
          </motion.button>
        ))}
      </div>
    </PageShell>
  )
}
