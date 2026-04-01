import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock hooks/stores before importing component
vi.mock("@/stores/notificationStore", () => ({
  useNotificationStore: vi.fn((selector: (s: any) => any) => {
    const state = {
      soundEnabled: true,
      systemNotificationEnabled: true,
      setSoundEnabled: vi.fn(),
      setSystemNotificationEnabled: vi.fn(),
    };
    return selector(state);
  }),
}));

vi.mock("@/hooks/useNotificationPermission", () => ({
  useNotificationPermission: vi.fn(() => ({
    permissionStatus: "granted",
    requestPermission: vi.fn(),
  })),
}));

import { AccountPage } from "@/pages/AccountPage";
import { useNotificationStore } from "@/stores/notificationStore";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";

function renderAccountPage() {
  return render(
    <MemoryRouter>
      <AccountPage />
    </MemoryRouter>,
  );
}

describe("AccountPage — notification toggles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Switch toggles and does NOT show 'Sắp ra mắt'", () => {
    renderAccountPage();
    expect(screen.queryByText("Sắp ra mắt")).not.toBeInTheDocument();
    // Both switches rendered
    expect(
      screen.getByTestId("account-system-notification-switch"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("account-sound-switch")).toBeInTheDocument();
  });

  it("clicking Sound toggle calls setSoundEnabled(false) when currently enabled", () => {
    const setSoundEnabled = vi.fn();
    (
      useNotificationStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation((selector: (s: any) => any) => {
      return selector({
        soundEnabled: true,
        systemNotificationEnabled: true,
        setSoundEnabled,
        setSystemNotificationEnabled: vi.fn(),
      });
    });

    renderAccountPage();
    fireEvent.click(screen.getByTestId("account-sound-switch"));
    expect(setSoundEnabled).toHaveBeenCalledWith(false);
  });

  it("clicking System Notification toggle calls setSystemNotificationEnabled(false)", () => {
    const setSystemNotificationEnabled = vi.fn();
    (
      useNotificationStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation((selector: (s: any) => any) => {
      return selector({
        soundEnabled: true,
        systemNotificationEnabled: true,
        setSoundEnabled: vi.fn(),
        setSystemNotificationEnabled,
      });
    });

    renderAccountPage();
    fireEvent.click(screen.getByTestId("account-system-notification-switch"));
    expect(setSystemNotificationEnabled).toHaveBeenCalledWith(false);
  });

  it("shows permission hint when permissionStatus is 'denied'", () => {
    (useNotificationPermission as ReturnType<typeof vi.fn>).mockReturnValue({
      permissionStatus: "denied",
      requestPermission: vi.fn(),
    });

    renderAccountPage();
    expect(screen.getByText(/hãy cho phép thông báo/i)).toBeInTheDocument();
  });
});
