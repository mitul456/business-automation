/**
 * OmniFlow Design System Tokens
 * Clean white/neutral dashboard with sophisticated indigo accent
 */

export const typography = {
  fontSans: 'var(--font-geist-sans, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
  fontMono: 'var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)',
  scale: {
    xs: { fontSize: '0.75rem', lineHeight: '1rem', letterSpacing: '0.01em' },
    sm: { fontSize: '0.875rem', lineHeight: '1.25rem', letterSpacing: '0' },
    base: { fontSize: '1rem', lineHeight: '1.5rem', letterSpacing: '-0.01em' },
    lg: { fontSize: '1.125rem', lineHeight: '1.75rem', letterSpacing: '-0.015em' },
    xl: { fontSize: '1.25rem', lineHeight: '1.75rem', letterSpacing: '-0.02em' },
    '2xl': { fontSize: '1.5rem', lineHeight: '2rem', letterSpacing: '-0.025em' },
    '3xl': { fontSize: '1.875rem', lineHeight: '2.25rem', letterSpacing: '-0.03em' },
    '4xl': { fontSize: '2.25rem', lineHeight: '2.5rem', letterSpacing: '-0.035em' },
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const colors = {
  // Surface & Neutrals
  surface: {
    background: '#ffffff',
    subtle: '#f8fafc', // slate-50
    muted: '#f1f5f9', // slate-100
    card: '#ffffff',
    overlay: 'rgba(15, 23, 42, 0.4)', // slate-900 / 40
  },
  // Typography
  text: {
    primary: '#0f172a', // slate-900
    secondary: '#475569', // slate-600
    muted: '#64748b', // slate-500
    disabled: '#94a3b8', // slate-400
    inverse: '#ffffff',
  },
  // Sophisticated Indigo Accent
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5', // Brand Core Accent
    700: '#4338ca', // Brand Active / Hover
    800: '#3730a3',
    900: '#312e81',
  },
  // Neutral Borders
  border: {
    subtle: '#f1f5f9', // slate-100
    default: '#e2e8f0', // slate-200
    strong: '#cbd5e1', // slate-300
    focus: '#6366f1', // primary-500
  },
  // Semantic Feedback
  status: {
    success: {
      bg: '#ecfdf5', // emerald-50
      text: '#065f46', // emerald-800
      border: '#a7f3d0', // emerald-200
      solid: '#10b981', // emerald-500
    },
    warning: {
      bg: '#fffbeb', // amber-50
      text: '#92400e', // amber-800
      border: '#fde68a', // amber-200
      solid: '#f59e0b', // amber-500
    },
    error: {
      bg: '#fef2f2', // rose-50
      text: '#991b1b', // rose-800
      border: '#fecaca', // rose-200
      solid: '#ef4444', // rose-500
    },
    info: {
      bg: '#f0f9ff', // sky-50
      text: '#075985', // sky-800
      border: '#bae6fd', // sky-200
      solid: '#0284c7', // sky-600
    },
  },
} as const;

export const spacing = {
  0: '0px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
} as const;

export const radius = {
  none: '0px',
  sm: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;
