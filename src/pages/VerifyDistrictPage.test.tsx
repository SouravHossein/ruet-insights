import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VerifyDistrictPage from "@/pages/VerifyDistrictPage";

const {
  mockUseAuthStatus,
  mockOrder,
  mockSelect,
  mockFrom,
  mockInvoke,
} = vi.hoisted(() => ({
  mockUseAuthStatus: vi.fn(),
  mockOrder: vi.fn(),
  mockSelect: vi.fn(),
  mockFrom: vi.fn(),
  mockInvoke: vi.fn(),
}));

vi.mock("@/hooks/use-auth-status", () => ({
  useAuthStatus: mockUseAuthStatus,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/components/DistrictMap", () => ({
  DistrictMap: ({ onDistrictClick }: { onDistrictClick?: (district: string) => void }) => (
    <button type="button" onClick={() => onDistrictClick?.("Dhaka")}>
      select-dhaka
    </button>
  ),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
    functions: {
      invoke: mockInvoke,
    },
  },
}));

const session = {
  user: {
    email: "student@example.com",
  },
};

describe("VerifyDistrictPage", () => {
  beforeEach(() => {
    mockUseAuthStatus.mockReset();
    mockOrder.mockReset();
    mockSelect.mockReset();
    mockFrom.mockReset();
    mockInvoke.mockReset();
  });

  it("redirects unauthenticated users to auth", async () => {
    mockUseAuthStatus.mockReturnValue({
      session: null,
      aal: null,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/verify"]}>
        <Routes>
          <Route path="/verify" element={<VerifyDistrictPage />} />
          <Route path="/auth" element={<div>auth-route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("auth-route")).toBeInTheDocument();
    });
  });

  it("disables submit for a locked student record", async () => {
    mockUseAuthStatus.mockReturnValue({
      session,
      aal: "aal2",
      loading: false,
    });

    mockOrder.mockResolvedValue({
      data: [
        {
          id: "student-1",
          name: "ALICE RAHMAN",
          department: "CSE",
          merit_rank: 12,
          admission_roll: "500123",
          application_id: "700111",
          district: "Dhaka",
          is_locked: true,
          verification_status: "verified",
        },
      ],
      error: null,
    });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });

    render(
      <MemoryRouter initialEntries={["/verify"]}>
        <Routes>
          <Route path="/verify" element={<VerifyDistrictPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/start typing a name/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/start typing a name/i), {
      target: { value: "ALICE" },
    });

    await waitFor(() => {
      expect(screen.getByText("ALICE RAHMAN")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("ALICE RAHMAN"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /confirm and lock district/i })).toBeDisabled();
    });
  });
});
