// src/pages/QuizStub.tsx — P2 placeholder
import { PageShell } from '../components/PageShell'
import { MascotPlaceholder } from '../components/MascotPlaceholder'

export function QuizLanding() {
  return (
    <PageShell backTo="/" backLabel="Home">
      <div className="flex flex-col items-center py-12 gap-4">
        <MascotPlaceholder mood="quiz" size={160} />
        <h1 className="page-title">Quiz</h1>
        <p className="text-brand-muted text-center max-w-sm">
          Test your knowledge with AI-generated examples. Coming in Phase 2!
        </p>
      </div>
    </PageShell>
  )
}
