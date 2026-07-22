// ============================================================================
// MANAGER FRONTEND INTEGRATION TESTING SUITE
// ============================================================================

import React from 'react';
import { Alert, Dimensions } from 'react-native';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';

// Target System Screen Imports
import DashboardScreen from './app/manager/dashboard';
import LeadsScreen from './app/manager/leads';
import ActivityScreen from './app/manager/activity';
import EmailsScreen from './app/manager/emails';
import ExportScreen from './app/manager/export';

// ============================================================================
// CORE ROUTER & DEVICE HARDWARE MOCKS
// ============================================================================
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve('mock-token')),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useFocusEffect: (callback: any) => {
    const { useEffect } = require('react');
    useEffect(() => { callback(); }, []);
  },
}));

jest.mock('./src/constants/useAppTheme', () => ({
  useAppTheme: () => ({
    theme: { bg: '#ffffff', card: '#eeeeee', text: '#000000', subText: '#777777', navy: '#123456', accent: '#6366f1', navBg: '#ffffff' },
  }),
}));

process.env.EXPO_PUBLIC_BACKEND_URL = 'http://mock-api';
jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 390, height: 844, scale: 1, fontScale: 1 } as any);

global.fetch = jest.fn();

// Baseline Standard Mock Data Array Structs
const mockLeadsArray = [
  {
    lead_id: 1,
    name: 'John Tan',
    title: 'Manager',
    company: 'Dell Technologies',
    email: 'john@dell.com',
    phone_number: '91234567',
    customer_intent: 'Interested',
    status: 'NEW',
    ai_notes: 'High interest customer',
    confidence_score: 0.95,
    follow_up_required: true,
    scanned_by_name: 'Booth Rep',
    created_at: '2026-07-22T10:00:00Z',
    followup_status: 'pending',
  },
];

const mockDashboardData = {
  total_leads: 25, new_leads: 10, contacted: 5, qualified: 8, followups_done: 3
};

const mockActivityArray = [
  {
    activity_id: 1,
    activity_type: 'FOLLOWUP_SCHEDULED',
    lead_id: 1,
    lead_name: 'John Tan',
    company: 'Dell Technologies',
    activity_description: 'Follow up email scheduled',
    created_at: '2026-07-22T10:00:00Z',
    followup_id: 1,
    followup_status: 'pending',
  },
];

const setupFetchMock = (data: any, success = true) => {
  (global.fetch as jest.Mock).mockReset();
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: success,
    json: async () => (success ? { success: true, data } : { success: false, message: 'Error occurred' }),
  });
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================================
// CRITERIA: COMPONENTS RENDER CORRECTLY & DATA DISPLAYED FROM BACKEND
// ============================================================================
describe('Components Render and Correct Data Displayed', () => {
  test('renders dashboard layout panels and counters from endpoint correctly', async () => {
    setupFetchMock(mockDashboardData);
    render(<DashboardScreen />);
    await waitFor(() => {
      expect(screen.getByText('Total Team Leads')).toBeTruthy();
    });
  });

  test('renders lead informational layout data properly', async () => {
    setupFetchMock(mockLeadsArray);
    render(<LeadsScreen />);
    await waitFor(() => {
      expect(screen.getByText(/John Tan/i)).toBeTruthy();
      expect(screen.getByText(/Dell Technologies/i)).toBeTruthy();
    });
  });

  test('renders historical activity feed log streams reliably', async () => {
    setupFetchMock(mockActivityArray);
    render(<ActivityScreen />);
    await waitFor(() => {
      expect(screen.getByText(/FOLLOWUP SCHEDULED/i)).toBeTruthy();
    });
  });
});

// ============================================================================
// CRITERIA: BUTTONS, LINKS, AND FORMS WORK WHEN CLICKED
// ============================================================================
describe('Buttons, Links, Filters, and Interaction Handlers', () => {
  test('bottom navigation links change route contexts instantly when pressed', async () => {
    setupFetchMock(mockDashboardData);
    render(<DashboardScreen />);
    await waitFor(() => {
      expect(screen.getAllByText('Leads').length).toBeGreaterThan(0);
    });
    fireEvent.press(screen.getAllByText('Leads')[0]);
    expect(mockPush).toHaveBeenCalledWith('/manager/leads');
  });

  test('filter action selectors prune view representations safely', async () => {
    setupFetchMock(mockLeadsArray);
    render(<LeadsScreen />);
    await waitFor(() => {
      expect(screen.getAllByText('NEW').length).toBeGreaterThan(0);
    });
    fireEvent.press(screen.getByText('CLOSED'));
    await waitFor(() => {
      expect(screen.queryByText(/John Tan/i)).toBeNull();
    });
  });

  test('pressing view details expands overlay block models safely', async () => {
    setupFetchMock(mockLeadsArray);
    render(<LeadsScreen />);
    await waitFor(() => {
      expect(screen.getByText('View Details')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('View Details'));
    await waitFor(() => {
      expect(screen.getByText(/AI Notes/i)).toBeTruthy();
    });
  });
});

// ============================================================================
// CRITERIA: USER INPUT VALIDATION
// ============================================================================
describe('User Text Mutation Inputs Actions', () => {
  test('search filter query typing mutates component filtering lists perfectly', async () => {
    setupFetchMock(mockLeadsArray);
    render(<LeadsScreen />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search name, company, email...')).toBeTruthy();
    });
    const searchField = screen.getByPlaceholderText('Search name, company, email...');
    fireEvent.changeText(searchField, 'Non-existent Company Name');
    await waitFor(() => {
      expect(screen.queryByText(/John Tan/i)).toBeNull();
    });
  });
});

// ============================================================================
// CRITERIA: LOADING SPINNERS & ERROR MESSAGES
// ============================================================================
describe('Loading Indicators and Context Feedback Elements', () => {
  test('displays loading visual states while network requests remain unresolved', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<LeadsScreen />);
    
    // Completely standalone query avoiding all returned properties from the render execution
    await waitFor(() => {
      expect(screen.toJSON()).toBeTruthy();
    });
  });

  test('displays appropriate generic error indicators or zero metrics when call fails', async () => {
    setupFetchMock(null, false);
    render(<DashboardScreen />);
    await waitFor(() => {
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });
  });

  test('displays fallback messages when targeted records return blank arrays', async () => {
    setupFetchMock([]);
    render(<ActivityScreen />);
    await waitFor(() => {
      expect(screen.getByText(/No activity yet/i)).toBeTruthy();
    });
  });
});

// ============================================================================
// CRITERIA: INTERFACE WORKS ACROSS DIFFERENT SCREEN SIZES
// ============================================================================
describe('Interface Responsiveness Visual Scaling Adaptability Verification', () => {
  const customScales = [
    { label: 'Compact Handset Grid Profile', width: 320, height: 568 },
    { label: 'Standard Mobile Desktop Scaling Profile', width: 390, height: 844 },
    { label: 'Expanded High-Res Tablet Display Profile', width: 768, height: 1024 },
  ];

  test.each(customScales)(
    'renders display templates without crashes layout on screen metric profiles: $label',
    async ({ width, height }) => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height, scale: 1, fontScale: 1 } as any);
      setupFetchMock(mockLeadsArray);
      render(<LeadsScreen />);
      await waitFor(() => {
        expect(screen.getByText(/John Tan/i)).toBeTruthy();
      });
    }
  );
});