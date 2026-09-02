// src/App.tsx
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Home } from './pages/Home'
import { Study } from './pages/Study'
import { StudyDetail } from './pages/StudyDetail'
import { QuizLanding } from './pages/QuizLanding'
import { QuizPlay } from './pages/QuizPlay'
import { QuizScore } from './pages/QuizScore'
import { QuizScores } from './pages/QuizScores'
import { FlashcardsLanding } from './pages/FlashcardsLanding'
import { FlashcardsDrill } from './pages/FlashcardsDrill'
import { About } from './pages/About'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/study" element={<Study />} />
        <Route path="/study/:id" element={<StudyDetail />} />
        <Route path="/quiz" element={<QuizLanding />} />
        <Route path="/quiz/play" element={<QuizPlay />} />
        <Route path="/quiz/score" element={<QuizScore />} />
        <Route path="/quiz/scores" element={<QuizScores />} />
        <Route path="/flashcards" element={<FlashcardsLanding />} />
        <Route path="/flashcards/drill/:mode" element={<FlashcardsDrill />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
