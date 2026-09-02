// src/pages/QuizPlay.tsx
// 15-question quiz game loop with prefetch-next
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { generateQuestion, QUIZ_LENGTH, type QuizQuestion, type QuizAnswer } from '../game/quiz'
import { PageShell } from '../components/PageShell'
import { Spinner } from '../components/Spinner'

type Phase = 'loading' | 'question' | 'answered' | 'done'

export function QuizPlay() {
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('loading')
  const [currentQ, setCurrentQ] = useState<QuizQuestion | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)  // 0-based
  const [selected, setSelected] = useState<string | null>(null)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const prefetchRef = useRef<Promise<QuizQuestion> | null>(null)

  // Load first question
  useEffect(() => {
    let cancelled = false
    generateQuestion().then((q) => {
      if (cancelled) return
      setCurrentQ(q)
      setPhase('question')
      // Prefetch question 2
      prefetchRef.current = generateQuestion()
    })
    return () => { cancelled = true }
  }, [])

  const handleAnswer = useCallback((fallacyId: string) => {
    if (!currentQ || phase !== 'question') return
    const correct = fallacyId === currentQ.subject.id
    setSelected(fallacyId)
    setAnswers((prev) => [...prev, { question: currentQ, selectedId: fallacyId, correct }])
    setPhase('answered')
  }, [currentQ, phase])

  const handleContinue = useCallback(async () => {
    const nextIndex = questionIndex + 1
    if (nextIndex >= QUIZ_LENGTH) {
      // Navigate to score screen with results in state
      navigate('/quiz/score', {
        state: { answers: [...answers] },
        replace: true,
      })
      return
    }
    setPhase('loading')
    setSelected(null)

    // Use prefetched question (or wait if still loading)
    const next = await (prefetchRef.current ?? generateQuestion())
    setCurrentQ(next)
    setQuestionIndex(nextIndex)
    setPhase('question')

    // Prefetch the one after
    if (nextIndex + 1 < QUIZ_LENGTH) {
      prefetchRef.current = generateQuestion()
    } else {
      prefetchRef.current = null
    }
  }, [questionIndex, answers, navigate])

  const displayNumber = questionIndex + 1

  return (
    <PageShell backTo="/quiz" backLabel="Quiz">
      <div className="max-w-2xl mx-auto w-full pt-2">
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-brand-accent rounded-full"
              animate={{ width: `${(displayNumber / QUIZ_LENGTH) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="font-display text-brand-primary text-lg shrink-0">
            {displayNumber}/{QUIZ_LENGTH}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {phase === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Spinner label="Generating question…" />
            </motion.div>
          )}

          {(phase === 'question' || phase === 'answered') && currentQ && (
            <motion.div
              key={`q-${questionIndex}`}
              initial={{ x: '60%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-60%', opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
            >
              {/* Question prompt */}
              <div className="card mb-5">
                <p className="text-xs text-brand-muted font-body uppercase tracking-widest mb-2">
                  Which fallacy does this commit?
                </p>
                <p className="text-gray-800 text-base leading-relaxed italic">
                  "{currentQ.exampleText}"
                </p>
                {currentQ.exampleSource !== 'live' && (
                  <p className="text-xs text-gray-400 mt-2">
                    {currentQ.exampleSource === 'cached' ? 'Cached example' : 'Classic example'}
                  </p>
                )}
              </div>

              {/* Option buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {currentQ.options.map((opt) => {
                  const isSelected = selected === opt.id
                  const isCorrect = opt.id === currentQ.subject.id
                  const answered = phase === 'answered'

                  let optClass = 'w-full text-left rounded-xl px-4 py-3 border-2 font-body font-bold text-base transition-colors duration-150 '
                  if (!answered) {
                    optClass += 'border-gray-300 bg-white hover:border-brand-primary hover:bg-blue-50 cursor-pointer'
                  } else if (isCorrect) {
                    optClass += 'border-brand-green bg-green-50 text-green-800 cursor-default'
                  } else if (isSelected && !isCorrect) {
                    optClass += 'border-brand-red bg-red-50 text-red-800 cursor-default'
                  } else {
                    optClass += 'border-gray-200 bg-gray-50 text-gray-400 cursor-default'
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleAnswer(opt.id)}
                      disabled={answered}
                      className={optClass}
                    >
                      <span className="font-display text-lg tracking-wide uppercase">{opt.name}</span>
                      <p className="text-xs font-normal mt-0.5 opacity-75 normal-case">{opt.description}</p>
                    </button>
                  )
                })}
              </div>

              {/* Feedback + Continue */}
              {phase === 'answered' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <p className={`font-display text-2xl ${selected === currentQ.subject.id ? 'text-brand-green' : 'text-brand-red'}`}>
                    {selected === currentQ.subject.id ? '✓ Correct!' : `✗ It was ${currentQ.subject.name}`}
                  </p>
                  <button onClick={handleContinue} className="btn-primary">
                    {questionIndex + 1 >= QUIZ_LENGTH ? 'See Results' : 'Continue →'}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  )
}
