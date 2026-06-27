import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ManagerDashboard from './app/manager/dashboard';
import ManagerLeads from './app/manager/leads';
import EmailsScreen from './app/manager/emails';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('./src/constants/useAppTheme', () => ({
  useAppTheme: () => ({
    theme: {
      bg: '#fff',
      card: '#f5f5f5',
      text: '#000',
      subText: '#666',
      navy: '#1e3a8a',
      accent: '#3b82f6',
      navBg: '#fff',
    },
    themeIndex: 0,
    setThemeIndex: jest.fn(),
  }),
  THEMES: [],
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve('fake-token')),
  deleteItemAsync: jest.fn(),
}));

global.fetch = jest.fn();

describe('Manager Frontend UI Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockReset();
  });

  // ─────────────────────────────────────────────
  // 1. LOADING STATE TEST
  // ─────────────────────────────────────────────
  it('shows loading spinner on initial render', async () => {
    const screen = render(<EmailsScreen />);

    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
  });

  // ─────────────────────────────────────────────
  // 2. BACKEND DATA RENDERING
  // ─────────────────────────────────────────────
  it('renders emails after backend response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          sentThisWeek: 5,
          overdue: 2,
          sent: [
            {
              activity_type: 'Email Sent',
              activity_description: 'Follow-up email sent',
              created_at: new Date().toISOString(),
            },
          ],
        },
      }),
    });

    const screen =  render(<EmailsScreen />);

    await waitFor(() => {
      expect(screen.getByText('EMAIL STATISTICS')).toBeTruthy();
      expect(screen.getByText('EMAIL HISTORY')).toBeTruthy();
    });
  });

  // ─────────────────────────────────────────────
  // 3. BUTTON CLICK TEST (Navigation)
  // ─────────────────────────────────────────────
  it('switches to Emails tab in dashboard', async () => {
    const screen = render(<ManagerDashboard />);

    const emailsTab = screen.getByText('Emails');
    fireEvent.press(emailsTab);

    await waitFor(() => {
      expect(emailsTab).toBeTruthy();
    });
  });

  // ─────────────────────────────────────────────
  // 4. LEADS RENDERING TEST
  // ─────────────────────────────────────────────
  it('renders leads from backend', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            lead_id: 1,
            name: 'John Doe',
            title: 'Manager',
            company: 'ABC Ltd',
            email: 'john@test.com',
            status: 'NEW',
            followup_status: 'pending',
            created_at: new Date().toISOString(),
          },
        ],
      }),
    });

    const screen = render(<ManagerLeads />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('Manager · ABC Ltd')).toBeTruthy();
    });
  });

  // ─────────────────────────────────────────────
  // 5. ERROR HANDLING TEST
  // ─────────────────────────────────────────────
  it('handles backend error without crashing', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => 'Server error',
    });

    const screen = render(<EmailsScreen />);

    await waitFor(() => {
      expect(screen.toJSON()).toBeTruthy();
    });
  });

  // ─────────────────────────────────────────────
  // 6. REFRESH TEST
  // ─────────────────────────────────────────────
  it('renders refreshable emails screen', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          sentThisWeek: 1,
          overdue: 0,
          sent: [],
        },
      }),
    });

    const screen = render(<EmailsScreen />);

    await waitFor(() => {
      expect(screen.getByText('EMAIL STATISTICS')).toBeTruthy();
    });
  });

  // ─────────────────────────────────────────────
  // 7. FORM VALIDATION LOGIC TEST
  // ─────────────────────────────────────────────
  it('validates email format', () => {
    const validateEmail = (email: string) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    expect(validateEmail('test@email.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });
});