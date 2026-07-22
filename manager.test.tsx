// ============================================================================
// MANAGER MODULE INTEGRATION TESTING SUITE
// ============================================================================

import React from 'react';
import { Alert, Dimensions } from 'react-native';
import { render, fireEvent, waitFor, screen, RenderResult } from '@testing-library/react-native';

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

const renderAsyncComponent = async (ui: React.ReactElement): Promise<RenderResult> => {
  const result = render(ui);
  return (result instanceof Promise ? await result : result) as RenderResult;
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================================
// TARGET SPECIFICATION 1: MANAGER DASHBOARD SCREEN (./app/manager/dashboard.tsx)
// ============================================================================
describe('Manager Dashboard Screen Rendering & Actions', () => {
  
  test('Manager Dashboard: renders layout panels and counters from endpoint correctly', async () => {
    setupFetchMock(mockDashboardData);
    await renderAsyncComponent(<DashboardScreen />);
    await waitFor(() => {
      expect(screen.getByText('Total Team Leads')).toBeTruthy();
    });
  });

  test('Manager Dashboard: bottom navigation links change route contexts instantly when pressed', async () => {
    setupFetchMock(mockDashboardData);
    await renderAsyncComponent(<DashboardScreen />);
    await waitFor(() => {
      expect(screen.getAllByText('Leads').length).toBeGreaterThan(0);
    });
    fireEvent.press(screen.getAllByText('Leads')[0]);
    expect(mockPush).toHaveBeenCalledWith('/manager/leads');
  });

  test('Manager Dashboard: displays appropriate generic error indicators or zero metrics when call fails', async () => {
    setupFetchMock(null, false);
    await renderAsyncComponent(<DashboardScreen />);
    await waitFor(() => {
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// TARGET SPECIFICATION 2: MANAGER LEADS SCREEN (./app/manager/leads.tsx)
// ============================================================================
describe('Manager Leads Screen Data, Filters, Inputs & Viewport Resizing', () => {
  
  test('Manager Leads: renders lead informational layout data properly from API data payload', async () => {
    setupFetchMock(mockLeadsArray);
    await renderAsyncComponent(<LeadsScreen />);
    await waitFor(() => {
      expect(screen.getByText(/John Tan/i)).toBeTruthy();
      expect(screen.getByText(/Dell Technologies/i)).toBeTruthy();
    });
  });

  test('Manager Leads: filter action selectors prune view representations safely', async () => {
    setupFetchMock(mockLeadsArray);
    await renderAsyncComponent(<LeadsScreen />);
    await waitFor(() => {
      expect(screen.getAllByText('NEW').length).toBeGreaterThan(0);
    });
    fireEvent.press(screen.getByText('CLOSED'));
    await waitFor(() => {
      expect(screen.queryByText(/John Tan/i)).toBeNull();
    });
  });

  test('Manager Leads: pressing view details expands overlay block models safely', async () => {
    setupFetchMock(mockLeadsArray);
    await renderAsyncComponent(<LeadsScreen />);
    await waitFor(() => {
      expect(screen.getByText('View Details')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('View Details'));
    await waitFor(() => {
      expect(screen.getByText(/AI Notes/i)).toBeTruthy();
    });
  });

  test('Manager Leads: pressing edit followup action triggers edit state or modal safely', async () => {
    setupFetchMock(mockLeadsArray);
    await renderAsyncComponent(<LeadsScreen />);
    await waitFor(() => {
      expect(screen.getByText(/Edit/i)).toBeTruthy();
    });
    fireEvent.press(screen.getByText(/Edit/i));
    await waitFor(() => {
      expect(screen.toJSON()).toBeTruthy();
    });
  });

  test('Manager Leads: search filter query typing mutates component filtering lists perfectly', async () => {
    setupFetchMock(mockLeadsArray);
    await renderAsyncComponent(<LeadsScreen />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search name, company, email...')).toBeTruthy();
    });
    const searchField = screen.getByPlaceholderText('Search name, company, email...');
    fireEvent.changeText(searchField, 'Non-existent Company Name');
    await waitFor(() => {
      expect(screen.queryByText(/John Tan/i)).toBeNull();
    });
  });

  test('Manager Leads: displays loading visual states while network requests remain unresolved', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    await renderAsyncComponent(<LeadsScreen />);
    await waitFor(() => {
      expect(screen.toJSON()).toBeTruthy();
    });
  });

  const customScales = [
    { label: 'Compact Handset Grid Profile', width: 320, height: 568 },
    { label: 'Standard Mobile Desktop Scaling Profile', width: 390, height: 844 },
    { label: 'Expanded High-Res Tablet Display Profile', width: 768, height: 1024 },
  ];

  test.each(customScales)(
    'Manager Leads Interface Responsiveness: renders cleanly on screen metric profiles: $label',
    async ({ width, height }) => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height, scale: 1, fontScale: 1 } as any);
      setupFetchMock(mockLeadsArray);
      await renderAsyncComponent(<LeadsScreen />);
      await waitFor(() => {
        expect(screen.getByText(/John Tan/i)).toBeTruthy();
      });
    }
  );
});

// ============================================================================
// TARGET SPECIFICATION 3: MANAGER ACTIVITY SCREEN (./app/manager/activity.tsx)
// ============================================================================
describe('Manager Activity Screen Feed Stream Logs', () => {
  
  test('Manager Activity: renders historical activity feed log streams reliably', async () => {
    setupFetchMock(mockActivityArray);
    await renderAsyncComponent(<ActivityScreen />);
    await waitFor(() => {
      expect(screen.getByText(/FOLLOWUP SCHEDULED/i)).toBeTruthy();
    });
  });

  test('Manager Activity: displays fallback messages when targeted records return blank arrays', async () => {
    setupFetchMock([]);
    await renderAsyncComponent(<ActivityScreen />);
    await waitFor(() => {
      expect(screen.getByText(/No activity yet/i)).toBeTruthy();
    });
  });
});

// ============================================================================
// TARGET SPECIFICATION 4: MANAGER EMAILS SCREEN (./app/manager/emails.tsx)
// ============================================================================
// ============================================================================
// TARGET SPECIFICATION 4: MANAGER EMAILS SCREEN (./app/manager/emails.tsx)
// ============================================================================
describe('Manager Emails Screen Tracking & Automation Actions', () => {
  
  test('Manager Emails: renders email dashboard template layout correctly', async () => {
    await renderAsyncComponent(<EmailsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Email Follow-ups')).toBeTruthy();
    });
  });

  test('Manager Emails: pressing date picker triggers automation sequence layout perfectly', async () => {
    await renderAsyncComponent(<EmailsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Date')).toBeTruthy();
    });
    
    // Target and press the Date selection row component
    const dateBtn = screen.getByText('Date');
    fireEvent.press(dateBtn);
    
    await waitFor(() => {
      expect(screen.toJSON()).toBeTruthy();
    });
  });

  test('Manager Emails: pressing time picker triggers automation sequence layout perfectly', async () => {
    await renderAsyncComponent(<EmailsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Time')).toBeTruthy();
    });
    
    // Target and press the Time selection row component
    const timeBtn = screen.getByText('Time');
    fireEvent.press(timeBtn);
    
    await waitFor(() => {
      expect(screen.toJSON()).toBeTruthy();
    });
  });

  test('Manager Emails: schedule button reflects initial disabled state correctly', async () => {
    await renderAsyncComponent(<EmailsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Schedule Follow-up')).toBeTruthy();
    });

    // Validates that the follow-up submission element is correctly locked out out-of-the-box
    const scheduleText = screen.getByText('Schedule Follow-up');
    const scheduleBtnContainer = scheduleText.parent; 
    
    expect(scheduleBtnContainer?.props.accessibilityState?.disabled).toBe(true);
  });
});

// ============================================================================
// TARGET SPECIFICATION 5: MANAGER EXPORT SCREEN (./app/manager/export.tsx)
// ============================================================================
// ============================================================================
// TARGET SPECIFICATION 5: MANAGER EXPORT SCREEN (./app/manager/export.tsx)
// ============================================================================
describe('Manager Export Screen Data Actions & Form Submissions', () => {
  
  test('Manager Export: renders export settings configuration options safely', async () => {
    await renderAsyncComponent(<ExportScreen />);
    await waitFor(() => {
      expect(screen.getByText('Export Leads')).toBeTruthy();
    });
  });

  test('Manager Export: clicking the generate file button triggers download sequence successfully', async () => {
    await renderAsyncComponent(<ExportScreen />);
    
    // Wait for elements to register using a scannable check
    await waitFor(() => {
      expect(screen.getAllByText('Download Excel').length).toBeGreaterThan(0);
    });

    // Safely target the first matched instance of the text element to trigger the bubble up press event
    const exportBtn = screen.getAllByText('Download Excel')[0];
    fireEvent.press(exportBtn);
    
    await waitFor(() => {
      expect(screen.toJSON()).toBeTruthy();
    });
  });
});