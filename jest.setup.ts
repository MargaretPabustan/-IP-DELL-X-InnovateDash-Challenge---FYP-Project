
import "react-native-gesture-handler/jestSetup";
import "@testing-library/jest-native/extend-expect";
/* MOCK AsyncStorage (required or Expo crashes) */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
/* MOCK expo-router */
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));
/* MOCK expo-asset */
jest.mock("expo-asset", () => ({
  Asset: {
    loadAsync: jest.fn(),
    fromModule: jest.fn(() => ({ uri: "mock" })),
  },
}));
/* MOCK expo-font */
jest.mock("expo-font", () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));
