import { StyleSheet, Platform } from 'react-native';

// ─── Color Constants ──────────────────────────────────────────────────────────

export const COLORS = {
  brandBlue: '#1A3C6E',
  activeBlue: '#1558B0',
  chipBg: '#E8EFF8',
  sectionBg: '#FFFFFF',
  screenBg: '#F0F2F6',
  borderColor: '#D0D7E3',
  textPrimary: '#1A1A2E',
  textSecondary: '#444444',
  textTertiary: '#666666',
  textLight: '#888888',
  placeholderText: '#AAAAAA',
  lightGray: '#F0F0F0',
  veryLightGray: '#FAFAFA',
  divider: '#E0E0E0',
  intentHigh: '#1A7F37',
  intentMedium: '#9A6700',
  intentLow: '#CF222E',
} as const;

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
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },

  // ─── HEADER ──────────────────────────────────────────────────────────────
  header: {
    backgroundColor: COLORS.brandBlue,
    paddingHorizontal: 16,
    paddingBottom: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ─── AUTOFILL FIELD ──────────────────────────────────────────────────────
  autofillRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  autofillLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    width: 68,
    fontWeight: '500',
  },
  autofillValue: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
    flex: 1,
  },

  // ─── INTEREST CHIPS ──────────────────────────────────────────────────────
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: COLORS.chipBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    paddingVertical: 4,
    paddingHorizontal: 11,
  },
  chipActive: {
    backgroundColor: COLORS.activeBlue,
    borderColor: COLORS.activeBlue,
  },
  chipText: {
    fontSize: 11,
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
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 6,
  },
  othersLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginRight: 8,
    width: 44,
  },
  othersInput: {
    flex: 1,
    fontSize: 12,
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
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 7,
    marginBottom: 3,
    backgroundColor: COLORS.veryLightGray,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  intentRowActive: {
    backgroundColor: '#EBF3FF',
    borderColor: COLORS.activeBlue,
  },
  intentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  intentText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  intentTextActive: {
    color: COLORS.activeBlue,
    fontWeight: '600',
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.placeholderText,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.activeBlue,
  },

  // ─── NOTES INPUT ─────────────────────────────────────────────────────────
  notesInput: {
    fontSize: 12,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 7,
    padding: 8,
    minHeight: 72,
    backgroundColor: COLORS.veryLightGray,
  },

  // ─── SUBMIT BUTTON ───────────────────────────────────────────────────────
  submitButton: {
    backgroundColor: COLORS.activeBlue,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: COLORS.activeBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // ─── BOTTOM NAVIGATION ───────────────────────────────────────────────────
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.sectionBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: 10,
    paddingHorizontal: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navItem: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});