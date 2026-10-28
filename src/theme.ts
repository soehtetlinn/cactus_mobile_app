// Brand palette, matching the ERPNext theme (custom_theme/public/scss/_brand.scss).

export const colors = {
  primary: '#B91C1C',
  primaryPressed: '#991B1B',
  primarySoft: '#FEF2F2',
  primarySoftText: '#991B1B',
  charcoal: '#1C1917',
  charcoalSoft: '#292524',
  accent: '#0EA5E9',

  background: '#FAFAF9',
  surface: '#FFFFFF',
  border: '#E7E5E4',
  text: '#1C1917',
  textMuted: '#78716C',
  textOnDark: '#FAFAF9',

  success: '#15803D',
  successSoft: '#F0FDF4',
  warning: '#B45309',
  warningSoft: '#FFFBEB',
  danger: '#B91C1C',
  dangerSoft: '#FEF2F2',
  info: '#0369A1',
  infoSoft: '#F0F9FF',
  neutralSoft: '#F5F5F4',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

export const toneColors: Record<Tone, { fg: string; bg: string }> = {
  success: { fg: colors.success, bg: colors.successSoft },
  warning: { fg: colors.warning, bg: colors.warningSoft },
  danger: { fg: colors.danger, bg: colors.dangerSoft },
  info: { fg: colors.info, bg: colors.infoSoft },
  neutral: { fg: colors.textMuted, bg: colors.neutralSoft },
  primary: { fg: colors.primarySoftText, bg: colors.primarySoft },
};
