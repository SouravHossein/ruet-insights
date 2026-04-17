import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthPage from "@/pages/AuthPage";

const {
  mockUseAuthStatus,
  mockListFactors,
} = vi.hoisted(() => ({
  mockUseAuthStatus: vi.fn(),
  mockListFactors: vi.fn(),
}));

vi.mock("@/hooks/use-auth-status", () => ({
  useAuthStatus: mockUseAuthStatus,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      mfa: {
        listFactors: mockListFactors,
        enroll: vi.fn(),
        challenge: vi.fn(),
        verify: vi.fn(),
      },
    },
  },
}));

const session = {
  user: {
    email: "student@example.com",
    phone: null,
  },
};

describe("AuthPage", () => {
  beforeEach(() => {
    mockListFactors.mockReset();
    mockUseAuthStatus.mockReset();
  });

  it("shows Google sign-in for unauthenticated users", () => {
    mockUseAuthStatus.mockReturnValue({
      session: null,
      aal: null,
      nextLevel: null,
      loading: false,
      redirectToNext: (next: string | null) => next ?? "/verify",
    });

    render(
      <MemoryRouter initialEntries={["/auth"]}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
  });

  it("shows phone MFA prompt for aal1 sessions", async () => {
    mockUseAuthStatus.mockReturnValue({
      session,
      aal: "aal1",
      nextLevel: "aal2",
      loading: false,
      redirectToNext: (next: string | null) => next ?? "/verify",
    });
    mockListFactors.mockResolvedValue({
      data: { phone: [{ id: "factor-1" }] },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={["/auth"]}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /send login code/i })).toBeInTheDocument();
    });
  });

  it("redirects aal2 sessions to verify", async () => {
    mockUseAuthStatus.mockReturnValue({
      session,
      aal: "aal2",
      nextLevel: "aal2",
      loading: false,
      redirectToNext: (next: string | null) => next ?? "/verify",
    });

    render(
      <MemoryRouter initialEntries={["/auth?next=/verify"]}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/verify" element={<div>verify-route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("verify-route")).toBeInTheDocument();
    });
  });
});
