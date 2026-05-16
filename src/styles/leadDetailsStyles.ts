import { StyleSheet, Platform } from 'react-native';

// ─── Color Constants ────────────────────────────────────────────────────────

export const COLORS = {
  // Primary
  brandBlue: '#1A3C6E',
  activeBlue: '#1558B0',
  
  // Backgrounds
  chipBg: '#E8EFF8',
  sectionBg: '#FFFFFF',
  screenBg: '#F0F2F6',
  
  // Borders & Text
  borderColor: '#D0D7E3',
  textPrimary: '#1A1A2E',
  textSecondary: '#444444',
  textTertiary: '#666666',
  textLight: '#888888',
  
  // UI Elements
  placeholderText: '#AAAAAA',
  iconGray: '#CCCCCC',
  lightGray: '#F0F0F0',
  veryLightGray: '#FAFAFA',
  divider: '#E0E0E0',
  
  // Intent Colors
  intentHigh: '#1A7F37',
  intentMedium: '#9A6700',
  intentLow: '#CF222E',
} as const;

// Legacy exports for backwards compatibility
export const BRAND_BLUE = COLORS.brandBlue;
export const ACTIVE_BLUE = COLORS.activeBlue;
export const CHIP_BG = COLORS.chipBg;
export const BORDER_COLOR = COLORS.borderColor;
export const SECTION_BG = COLORS.sectionBg;
export const SCREEN_BG = COLORS.screenBg;

// ─── Styles ─────────────────────────────────────────────────────────────────

export const styles = StyleSheet.create({
  // ─── LAYOUT ──────────────────────────────────────────────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.brandBlue,
  },
  flex: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },

  // ─── HEADER ──────────────────────────────────────────────────────────────
  header: {
    backgroundColor: COLORS.brandBlue,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // ─── SECTION CARD ────────────────────────────────────────────────────────
  sectionCard: {
    backgroundColor: COLORS.sectionBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ─── AUTOFILL FIELD ──────────────────────────────────────────────────────
  autofillRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  autofillLabel: {
    fontSize: 13,
    color: COLORS.textTertiary,
    width: 72,
    fontWeight: '500',
  },
  autofillValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    flex: 1,
  },

  // ─── INTEREST CHIPS ──────────────────────────────────────────────────────
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: COLORS.chipBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    paddingVertical: 5,
    paddingHorizontal: 13,
  },
  chipActive: {
    backgroundColor: COLORS.activeBlue,
    borderColor: COLORS.activeBlue,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // ─── OTHERS INPUT ────────────────────────────────────────────────────────
  othersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 8,
  },
  othersLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginRight: 8,
    width: 48,
  },
  othersInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },

  // ─── INTENT RADIO ────────────────────────────────────────────────────────
  intentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: COLORS.veryLightGray,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  intentRowActive: {
    backgroundColor: '#EBF3FF',
    borderColor: COLORS.activeBlue,
  },
  intentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  intentText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  intentTextActive: {
    color: COLORS.activeBlue,
    fontWeight: '600',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.placeholderText,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.activeBlue,
  },

  // ─── NOTES INPUT ─────────────────────────────────────────────────────────
  notesInput: {
    fontSize: 13,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 7,
    padding: 10,
    minHeight: 90,
    backgroundColor: COLORS.veryLightGray,
    marginBottom: 6,
  },

  // ─── SUBMIT BUTTON ───────────────────────────────────────────────────────
  submitButton: {
    backgroundColor: COLORS.activeBlue,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: COLORS.activeBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // ─── BOTTOM NAVIGATION ───────────────────────────────────────────────────
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.sectionBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 16 : 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },

  // ─── NAV ICONS ───────────────────────────────────────────────────────────
  navIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.iconGray,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  navIconActive: {
    backgroundColor: COLORS.brandBlue,
  },
  navIconHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginBottom: -3,
  },
  navIconBody: {
    width: 16,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },

  // QR / Scan icon
  qrInner: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 2,
  },

  // ─── HOUSE ICON ──────────────────────────────────────────────────────────
  houseIconWrapper: {
    alignItems: 'center',
  },
  houseRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 13,
    borderRightWidth: 13,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.textLight,
  },
  houseBody: {
    width: 18,
    height: 12,
    backgroundColor: COLORS.textLight,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});

// ─── COMPONENT-SPECIFIC STYLES ───────────────────────────────────────────────

/**
 * AutofillField component styles
 * @see src/components/LeadDetailsForm/autofill-field.tsx
 */
export const autofillFieldStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  label: {
    fontSize: 13,
    color: COLORS.textTertiary,
    width: 72,
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
});

/**
 * OthersInput component styles
 * @see src/components/LeadDetailsForm/others-input.tsx
 */
export const othersInputStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 8,
  },
  label: {
    fontSize: 12,
    color: COLORS.textLight,
    marginRight: 8,
    width: 48,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
});
