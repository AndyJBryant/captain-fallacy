// src/App.tsx
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Home } from './pages/Home'
import { Study } from './pages/Study'
import { StudyDetail } from './pages/StudyDetail'
import { QuizLanding } from './pages/QuizLanding'
import { FlashcardsLanding } from './pages/FlashcardsLanding'
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
        <Route path="/flashcards" element={<FlashcardsLanding />} />
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
