/* Custom SVG emblems for the KPI cards. Each one has its own visual identity
   with gradient fills — no flat colors, no generic lucide icons. */

export function UsersEmblem({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="ke-users" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      {/* three overlapping silhouettes */}
      <circle cx="12" cy="8" r="3.2" fill="url(#ke-users)" opacity="0.95" />
      <path d="M6.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="url(#ke-users)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="6" cy="10" r="2.4" fill="url(#ke-users)" opacity="0.65" />
      <path d="M2 19c0-2.3 1.6-4 4-4" stroke="url(#ke-users)" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.7" />
      <circle cx="18" cy="10" r="2.4" fill="url(#ke-users)" opacity="0.65" />
      <path d="M22 19c0-2.3-1.6-4-4-4" stroke="url(#ke-users)" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function LearnerEmblem({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="ke-learn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      {/* lightning fused with upward arrow */}
      <path
        d="M13 2L5 13h5l-1 9 8-11h-5l1-9z"
        fill="url(#ke-learn)"
        stroke="#0f766e"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProgramEmblem({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="ke-prog" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {/* abstract book from three angled slabs */}
      <path d="M4 6L12 4L12 19L4 21Z" fill="url(#ke-prog)" opacity="0.95" />
      <path d="M12 4L20 6L20 21L12 19Z" fill="url(#ke-prog)" opacity="0.75" />
      <line x1="12" y1="4" x2="12" y2="19" stroke="#1e3a8a" strokeWidth="0.6" />
      <line x1="7" y1="10" x2="10" y2="9.5" stroke="#fff" strokeWidth="0.7" opacity="0.7" />
      <line x1="7" y1="13" x2="10" y2="12.5" stroke="#fff" strokeWidth="0.7" opacity="0.7" />
    </svg>
  );
}

export function CuroEmblem({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="ke-curo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {/* coin with a stylized cent-like mark */}
      <circle cx="12" cy="12" r="9.5" fill="url(#ke-curo)" stroke="#b45309" strokeWidth="0.8" />
      <circle cx="12" cy="12" r="7" fill="none" stroke="#92400e" strokeWidth="0.4" opacity="0.5" />
      <path
        d="M12 6.5v11M9 9c0-1.1 1.3-2 3-2s3 0.9 3 2-1.3 2-3 2-3 0.9-3 2 1.3 2 3 2 3-0.9 3-2"
        stroke="#78350f"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
