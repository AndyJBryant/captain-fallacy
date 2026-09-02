// src/pages/About.tsx
import { motion } from 'framer-motion'
import { PageShell } from '../components/PageShell'
import { MascotPlaceholder } from '../components/MascotPlaceholder'

export function About() {
  return (
    <PageShell backTo="/" backLabel="Home">
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex flex-col items-center py-6 gap-3 mb-4">
          <MascotPlaceholder mood="about" size={140} />
          <h1 className="page-title">About</h1>
        </div>

        {[
          {
            title: 'Mission',
            body: 'Captain Fallacy exists to make critical thinking fun and accessible. By combining an irreverent superhero theme with AI-generated examples, we turn 24 classic logical fallacies from dry textbook entries into something you actually want to learn.',
          },
          {
            title: 'Values',
            body: 'We believe reasoning well is a skill anyone can learn. We value honesty, clarity, and a healthy scepticism of bad arguments — including our own.',
          },
          {
            title: 'Feedback',
            body: 'Found a bug? Spotted a bad example? We want to know. Reach out via GitHub or wherever you found us.',
          },
          {
            title: 'Support Us',
            body: 'Captain Fallacy is free and non-commercial. If you find it useful, share it, star the repo, or simply use it to win your next argument responsibly.',
          },
        ].map((s, i) => (
          <motion.div
            key={s.title}
            className="card mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <h2 className="font-display text-2xl text-brand-primary uppercase tracking-wide mb-2">{s.title}</h2>
            <p className="text-gray-700 leading-relaxed">{s.body}</p>
          </motion.div>
        ))}

        {/* Attribution — required by CC BY-NC 3.0 */}
        <div className="card border border-amber-200 bg-amber-50">
          <h2 className="font-display text-xl text-amber-800 uppercase tracking-wide mb-2">Attribution</h2>
          <p className="text-amber-900 text-sm leading-relaxed">
            Fallacy content derived from{' '}
            <a
              href="https://yourlogicalfallacyis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              yourlogicalfallacyis.com
            </a>{' '}
            ("Thou shalt not commit logical fallacies"), licensed under{' '}
            <a
              href="https://creativecommons.org/licenses/by-nc/3.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Creative Commons BY-NC 3.0
            </a>
            . This app is non-commercial.
          </p>
        </div>
      </div>
    </PageShell>
  )
}
