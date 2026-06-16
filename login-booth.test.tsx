import React from "react";
import { render } from "@testing-library/react-native";

// ─────────────────────────────────────────────
// SCREENS
// ─────────────────────────────────────────────
import LoginScreen from "./app/auth/login";
import ScannedBeforeScreen from "./app/booth/ScannedBefore";
import SuccessfullySubmittedScreen from "./app/booth/successfullysubmitted";
import RecentLeadsScreen from "./app/booth/recent-leads";
import QRScannerScreen from "./app/booth/qr-scanner";
import LeadDetailsScreen from "./app/booth/lead-details";
import ActivityScreen from "./app/booth/activity";
import DashboardScreen from "./app/booth/dashboardscreen";

// ─────────────────────────────────────────────
// MOCKS
// ─────────────────────────────────────────────

// expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useLocalSearchParams: () => ({
    leadName: "John Doe",
    companyName: "Dell",
    email: "john@dell.com",
    title: "Manager",
    phone: "12345678",
    checkInTime: "10:00 AM",
    source: "qr",
    assignedTeam: "Team A",
    intent: "High",
    interests: "Cloud, AI",
    aiNotes: "Follow up soon",
  }),
}));

// secure store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(() => Promise.resolve("fake-token")),
}));

// theme
jest.mock("./src/constants/useAppTheme", () => ({
  useAppTheme: () => ({
    theme: {
      bg: "#fff",
      text: "#000",
      card: "#f5f5f5",
      accent: "#3b82f6",
      navy: "#111827",
      subText: "#6b7280",
      navBg: "#ffffff",
    },
  }),
}));

// fetch mock (important for ActivityScreen + LeadDetailsScreen + DashboardScreen)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ([]),
  })
) as jest.Mock;

// required for JWT decoding
global.atob = (str: string) =>
  Buffer.from(str, "base64").toString("binary");

// ─────────────────────────────────────────────
// SAFE RENDER
// ─────────────────────────────────────────────
const safeRender = (Component: React.ComponentType<any>) => {
  let error: any = null;
  try {
    render(<Component />);
  } catch (e) {
    error = e;
  }
  return error;
};

// ─────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────
describe("FULL AUTH + BOOTH FLOW COVERAGE", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ───── LOGIN ─────
  test("1. Login renders without crashing", () => {
    expect(safeRender(LoginScreen)).toBeNull();
  });

  test("2. Login screen mounts successfully", () => {
    expect(() => render(<LoginScreen />)).not.toThrow();
  });

  // ───── RECENT LEADS ─────
  test("3. Recent Leads renders without crashing", () => {
    expect(safeRender(RecentLeadsScreen)).toBeNull();
  });

  test("4. Recent Leads mounts successfully", () => {
    expect(() => render(<RecentLeadsScreen />)).not.toThrow();
  });

  // ───── SCANNED BEFORE ─────
  test("5. ScannedBefore renders without crashing", () => {
    expect(safeRender(ScannedBeforeScreen)).toBeNull();
  });

  test("6. ScannedBefore mounts successfully", () => {
    expect(() => render(<ScannedBeforeScreen />)).not.toThrow();
  });

  // ───── SUCCESS SCREEN ─────
  test("7. Success screen renders without crashing", () => {
    expect(safeRender(SuccessfullySubmittedScreen)).toBeNull();
  });

  test("8. Success screen mounts successfully", () => {
    expect(() => render(<SuccessfullySubmittedScreen />)).not.toThrow();
  });

  // ───── QR SCANNER ─────
  test("9. QR Scanner renders without crashing", () => {
    expect(safeRender(QRScannerScreen)).toBeNull();
  });

  test("10. QR Scanner mounts successfully", () => {
    expect(() => render(<QRScannerScreen />)).not.toThrow();
  });

  // ───── LEAD DETAILS ─────
  test("11. Lead Details renders without crashing", () => {
    expect(safeRender(LeadDetailsScreen)).toBeNull();
  });

  test("12. Lead Details mounts successfully", () => {
    expect(() => render(<LeadDetailsScreen />)).not.toThrow();
  });

  // ───── ACTIVITY SCREEN ─────
  test("13. Activity screen renders without crashing", () => {
    expect(safeRender(ActivityScreen)).toBeNull();
  });

  test("14. Activity screen mounts successfully", () => {
    expect(() => render(<ActivityScreen />)).not.toThrow();
  });

  // ───── DASHBOARD SCREEN ─────
  test("15. Dashboard screen renders without crashing", () => {
    expect(safeRender(DashboardScreen)).toBeNull();
  });

  test("16. Dashboard screen mounts successfully", () => {
    expect(() => render(<DashboardScreen />)).not.toThrow();
  });

  // ───── FULL FLOW CHECK ─────
  test("17. Full flow step 1 (Login)", () => {
    expect(safeRender(LoginScreen)).toBeNull();
  });

  test("18. Full flow step 2 (Booth entry)", () => {
    expect(safeRender(RecentLeadsScreen)).toBeNull();
  });

  test("19. Full flow step 3 (Scan state)", () => {
    expect(safeRender(ScannedBeforeScreen)).toBeNull();
  });

  test("20. Full flow step 4 (Success state)", () => {
    expect(safeRender(SuccessfullySubmittedScreen)).toBeNull();
  });

  test("21. Full flow step 5 (QR Scanner)", () => {
    expect(safeRender(QRScannerScreen)).toBeNull();
  });

  test("22. Full flow step 6 (Lead Details)", () => {
    expect(safeRender(LeadDetailsScreen)).toBeNull();
  });

  test("23. Full flow step 7 (Activity Screen)", () => {
    expect(safeRender(ActivityScreen)).toBeNull();
  });

  test("24. Full flow step 8 (Dashboard Screen)", () => {
    expect(safeRender(DashboardScreen)).toBeNull();
  });
});