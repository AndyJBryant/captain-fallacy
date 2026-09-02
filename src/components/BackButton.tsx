// src/components/BackButton.tsx
import { useNavigate } from 'react-router-dom'

interface Props {
  to?: string
  label?: string
}

export function BackButton({ to, label = 'Back' }: Props) {
  const navigate = useNavigate()
  const handleClick = () => (to ? navigate(to) : navigate(-1))
  return (
    <button onClick={handleClick} className="btn-back">
      <span className="text-lg">←</span>
      <span>{label}</span>
    </button>
  )
}
