import { cn } from "@/lib/utils"

// Lasercom's logo, redrawn from the original artwork as vectors: the "L" mark
// (a bar with a folded foot) and the wide geometric wordmark. Both follow the
// text colour; the lower fold of the foot is the laser
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="40 20 370 400"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect x="48" y="25" width="97" height="313" fill="currentColor" />
      <path
        d="M145 338 222 265H400L323 338Z"
        fill="currentColor"
        opacity="0.55"
      />
      <path d="M145 338H323L400 410H222Z" fill="var(--laser)" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="60 8 1725 162"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      fill="currentColor"
    >
      <path d="M65 12H95V135H240V165H65Z" />
      <path d="M258 165 440 12H475V165H455V40L300 165Z" />
      <path d="M505 12H690V42H590L675 100Q695 115 690 140Q685 165 655 165H505V135H645L520 55Q505 45 505 30Z" />
      <path d="M720 12H895V42H750V135H895V165H720ZM755 60H895V75H770Z" />
      <path d="M925 12H1088Q1110 12 1110 32V42H925ZM925 12H955V165H925ZM1088 42 1110 48 970 106H955V92ZM962 96H1000L1110 165H1065Z" />
      <path d="M1150 12H1310V42H1165V135H1310V165H1150Q1135 165 1135 150V27Q1135 12 1150 12Z" />
      <path
        fillRule="evenodd"
        d="M1350 12H1520Q1535 12 1535 27V150Q1535 165 1520 165H1350Q1335 165 1335 150V27Q1335 12 1350 12ZM1365 42V135H1505V42Z"
      />
      <path d="M1555 12H1585V165H1555ZM1755 12H1780V165H1755ZM1585 12 1670 90 1755 12V40L1670 112 1585 40Z" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-7 w-auto" />
      <Wordmark className="h-[0.9rem] w-auto" />
    </span>
  )
}
