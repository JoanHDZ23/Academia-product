/** Logo de Klock — ícono radar/tracker violeta */
export function KlockLogo({ size = 64, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-label="Klock logo"
      role="img"
    >
      <defs>
        <linearGradient id="klock-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="klock-arrow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
      </defs>
      {/* Fondo circular blanco */}
      <circle cx="256" cy="256" r="240" fill="white" />
      {/* Anillos concéntricos */}
      <circle cx="256" cy="256" r="210" fill="none" stroke="url(#klock-bg)" strokeWidth="22" />
      <circle cx="256" cy="256" r="145" fill="none" stroke="url(#klock-bg)" strokeWidth="18" />
      <circle cx="256" cy="256" r="78"  fill="none" stroke="url(#klock-bg)" strokeWidth="16" />
      {/* Flecha curva (cuadrante inferior-izquierdo) */}
      <path d="M 120 310 A 155 155 0 0 1 256 101" fill="none" stroke="url(#klock-bg)" strokeWidth="28" strokeLinecap="round" />
      <polygon points="100,298 88,340 132,318" fill="#7c3aed" />
      {/* Flecha diagonal hacia arriba-derecha */}
      <line x1="240" y1="272" x2="360" y2="152" stroke="url(#klock-arrow)" strokeWidth="26" strokeLinecap="round" />
      <polygon points="356,140 400,128 384,172" fill="#9333ea" />
      {/* Punto central */}
      <circle cx="256" cy="256" r="22" fill="url(#klock-bg)" />
    </svg>
  )
}
