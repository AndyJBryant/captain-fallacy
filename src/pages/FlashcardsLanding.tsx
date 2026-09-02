// src/pages/FlashcardsLanding.tsx — P2 placeholder
import { PageShell } from '../components/PageShell'
import { MascotPlaceholder } from '../components/MascotPlaceholder'

export function FlashcardsLanding() {
  return (
    <PageShell backTo="/" backLabel="Home">
      <div className="flex flex-col items-center py-12 gap-4">
        <MascotPlaceholder mood="flashcards" size={160} />
        <h1 className="page-title">Flashcards</h1>
        <p className="text-brand-muted text-center max-w-sm">
          Anki-style flashcard drills. Coming in Phase 2!
        </p>
      </div>
    </PageShell>
  )
}
