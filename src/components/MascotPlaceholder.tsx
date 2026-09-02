// src/components/MascotPlaceholder.tsx
// SVG placeholder mascot — different "mood" variants
// Real art to be dropped in later by captain-content

type Mood = 'default' | 'quiz' | 'flashcards' | 'study' | 'about' |
            'dejected' | 'neutral' | 'pleased' | 'triumphant'

const COLORS: Record<Mood, { cape: string; face: string; bg: string }> = {
  default:    { cape: '#1a3a6b', face: '#fde68a', bg: '#dbeafe' },
  quiz:       { cape: '#7c3aed', face: '#fde68a', bg: '#ede9fe' },
  flashcards: { cape: '#0e7490', face: '#fde68a', bg: '#cffafe' },
  study:      { cape: '#065f46', face: '#fde68a', bg: '#d1fae5' },
  about:      { cape: '#92400e', face: '#fde68a', bg: '#fef3c7' },
  dejected:   { cape: '#374151', face: '#fde68a', bg: '#f3f4f6' },
  neutral:    { cape: '#1a3a6b', face: '#fde68a', bg: '#dbeafe' },
  pleased:    { cape: '#166534', face: '#fde68a', bg: '#bbf7d0' },
  triumphant: { cape: '#f5a623', face: '#fde68a', bg: '#fef3c7' },
}

const EXPRESSIONS: Record<string, string> = {
  default:    'M 90 115 Q 100 122 110 115',
  quiz:       'M 88 113 Q 100 124 112 113',
  flashcards: 'M 90 115 Q 100 120 110 115',
  study:      'M 90 112 Q 100 122 110 112',
  about:      'M 90 115 Q 100 120 110 115',
  dejected:   'M 90 118 Q 100 110 110 118',
  neutral:    'M 90 116 L 110 116',
  pleased:    'M 88 114 Q 100 124 112 114',
  triumphant: 'M 86 113 Q 100 126 114 113',
}

interface Props {
  mood?: Mood
  size?: number
  className?: string
}

export function MascotPlaceholder({ mood = 'default', size = 200, className = '' }: Props) {
  const c = COLORS[mood]
  const expr = EXPRESSIONS[mood]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      aria-label={`Captain Fallacy — ${mood}`}
      role="img"
    >
      {/* Background circle */}
      <circle cx="100" cy="100" r="95" fill={c.bg} stroke="#e2e8f0" strokeWidth="2" />

      {/* Cape */}
      <path d="M 60 130 Q 50 170 100 185 Q 150 170 140 130 Z" fill={c.cape} opacity="0.9" />

      {/* Body */}
      <rect x="70" y="120" width="60" height="55" rx="8" fill={c.cape} />

      {/* CF emblem on chest */}
      <circle cx="100" cy="145" r="14" fill="white" opacity="0.25" />
      <text x="100" y="150" textAnchor="middle" fontSize="13" fontWeight="bold" fill="white" fontFamily="Impact,serif">CF</text>

      {/* Head */}
      <ellipse cx="100" cy="95" rx="32" ry="34" fill={c.face} />

      {/* Glasses */}
      <circle cx="90" cy="97" r="9" fill="none" stroke="#374151" strokeWidth="2.5" />
      <circle cx="110" cy="97" r="9" fill="none" stroke="#374151" strokeWidth="2.5" />
      <line x1="99" y1="97" x2="101" y2="97" stroke="#374151" strokeWidth="2.5" />
      <line x1="81" y1="97" x2="76" y2="99" stroke="#374151" strokeWidth="2" />
      <line x1="119" y1="97" x2="124" y2="99" stroke="#374151" strokeWidth="2" />

      {/* Eyes (dots inside lenses) */}
      <circle cx="90" cy="96" r="2.5" fill="#374151" />
      <circle cx="110" cy="96" r="2.5" fill="#374151" />

      {/* Eyebrows */}
      <path d="M 83 86 Q 90 82 97 86" stroke="#92400e" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 103 86 Q 110 82 117 86" stroke="#92400e" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Mouth expression */}
      <path d={expr} stroke="#374151" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Hair */}
      <ellipse cx="100" cy="65" rx="32" ry="10" fill="#fbbf24" />
      <path d="M 70 75 Q 65 55 75 50 Q 80 65 85 70" fill="#fbbf24" />
      <path d="M 130 75 Q 135 55 125 50 Q 120 65 115 70" fill="#fbbf24" />

      {/* Arms */}
      <rect x="40" y="122" width="32" height="14" rx="7" fill={c.cape} />
      <rect x="128" y="122" width="32" height="14" rx="7" fill={c.cape} />

      {/* Fist on triumphant */}
      {mood === 'triumphant' && (
        <circle cx="161" cy="107" r="10" fill={c.face} stroke={c.cape} strokeWidth="2" />
      )}
    </svg>
  )
}
