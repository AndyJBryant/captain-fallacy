// src/pages/StudyDetail.tsx — Fallacy detail page with live example generation
import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { fallacies, getFallacy } from '../data/fallacies'
import { PageShell } from '../components/PageShell'
import { Spinner } from '../components/Spinner'
import { studyRandom, studyCustom, type SourceType } from '../lib/api'

function sourceBadge(source: SourceType) {
  if (source === 'live') return { label: 'AI Generated', color: 'bg-green-100 text-green-800' }
  if (source === 'cached') return { label: 'Cached Example', color: 'bg-blue-100 text-blue-800' }
  return { label: 'Classic Example', color: 'bg-gray-100 text-gray-600' }
}

export function StudyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fallacy = getFallacy(id ?? '')

  const currentIdx = fallacies.findIndex((f) => f.id === id)
  const prevFallacy = currentIdx > 0 ? fallacies[currentIdx - 1] : null
  const nextFallacy = currentIdx < fallacies.length - 1 ? fallacies[currentIdx + 1] : null

  const [exampleText, setExampleText] = useState(fallacy?.example ?? '')
  const [exampleSource, setExampleSource] = useState<SourceType>('static')
  const [loading, setLoading] = useState(false)
  const [keywords, setKeywords] = useState('')
  const [showKeywordsInput, setShowKeywordsInput] = useState(false)
  const keywordsRef = useRef<HTMLInputElement>(null)

  if (!fallacy) {
    return (
      <PageShell backTo="/study">
        <div className="flex items-center justify-center py-20">
          <p className="text-brand-muted text-lg">Fallacy not found.</p>
        </div>
      </PageShell>
    )
  }

  const badge = sourceBadge(exampleSource)

  async function handleRandomExample() {
    setLoading(true)
    setShowKeywordsInput(false)
    try {
      const res = await studyRandom(fallacy!.id, fallacy!.example)
      setExampleText(res.text)
      setExampleSource(res.source)
    } finally {
      setLoading(false)
    }
  }

  async function handleCustomExample() {
    if (!showKeywordsInput) {
      setShowKeywordsInput(true)
      setTimeout(() => keywordsRef.current?.focus(), 80)
      return
    }
    if (!keywords.trim()) return
    setLoading(true)
    try {
      const res = await studyCustom(fallacy!.id, keywords, fallacy!.example)
      setExampleText(res.text)
      setExampleSource(res.source)
    } finally {
      setLoading(false)
    }
  }

  function navigateTo(targetId: string) {
    // Reset state on navigation
    const target = getFallacy(targetId)
    setExampleText(target?.example ?? '')
    setExampleSource('static')
    setKeywords('')
    setShowKeywordsInput(false)
    navigate(`/study/${targetId}`)
  }

  return (
    <PageShell backTo="/study" backLabel="All Fallacies">
      <div className="max-w-2xl mx-auto w-full pt-2">
        {/* Fallacy header */}
        <div className="mb-6">
          <div className="flex items-start gap-4 mb-3">
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-brand-bg flex items-center justify-center border border-gray-200 text-4xl mt-1">
              🧠
            </div>
            <div>
              <h1 className="font-display text-4xl md:text-5xl text-brand-primary uppercase tracking-wide leading-none">
                {fallacy.name}
              </h1>
              <p className="text-brand-muted text-base mt-2">{fallacy.description}</p>
            </div>
          </div>
          <p className="text-gray-700 text-base leading-relaxed card">{fallacy.detail}</p>
        </div>

        {/* Example section */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl text-brand-primary uppercase tracking-wide">Example</h2>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="spinner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Spinner label="Generating example…" />
              </motion.div>
            ) : (
              <motion.p
                key={exampleText.slice(0, 30)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="text-gray-800 text-base leading-relaxed italic"
              >
                "{exampleText}"
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Generation buttons */}
        <div className="flex flex-col gap-3 mb-8">
          <button
            onClick={handleRandomExample}
            disabled={loading}
            className="btn-accent w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            New Random Example
          </button>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleCustomExample}
              disabled={loading}
              className="btn-ghost w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              New Custom Example
            </button>
            <AnimatePresence>
              {showKeywordsInput && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-2">
                    <input
                      ref={keywordsRef}
                      type="text"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value.slice(0, 100))}
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomExample()}
                      placeholder="custom keywords (e.g. climate, football)"
                      maxLength={100}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                    <button
                      onClick={handleCustomExample}
                      disabled={loading || !keywords.trim()}
                      className="btn-primary text-base px-4 py-2 disabled:opacity-50"
                    >
                      Go
                    </button>
                  </div>
                  <p className="text-xs text-brand-muted mt-1">{keywords.length}/100</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Prev / Next navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => prevFallacy && navigateTo(prevFallacy.id)}
            disabled={!prevFallacy}
            className="flex items-center gap-2 btn-ghost text-base disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← {prevFallacy?.name ?? 'Previous'}
          </button>
          <button
            onClick={() => nextFallacy && navigateTo(nextFallacy.id)}
            disabled={!nextFallacy}
            className="flex items-center gap-2 btn-ghost text-base disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {nextFallacy?.name ?? 'Next'} →
          </button>
        </div>
      </div>
    </PageShell>
  )
}
