import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAppSettings } from "@/hooks/useAppSettings";

vi.mock("@/services/supabase/appSettingsService", () => ({
  appSettingsService: {
    getAppSettings: vi.fn(),
    setPredictionsEnabled: vi.fn(),
  },
}));

import { appSettingsService } from "@/services/supabase/appSettingsService";

describe("useAppSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appSettingsService.getAppSettings).mockResolvedValue({
      predictions_enabled: true,
    });
    vi.mocked(appSettingsService.setPredictionsEnabled).mockResolvedValue(undefined);
  });

  it("loads predictionsEnabled on mount", async () => {
    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(appSettingsService.getAppSettings).toHaveBeenCalledTimes(1);
    expect(result.current.predictionsEnabled).toBe(true);
  });

  it("reflects predictions_enabled = false from the backend", async () => {
    vi.mocked(appSettingsService.getAppSettings).mockResolvedValue({
      predictions_enabled: false,
    });

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.predictionsEnabled).toBe(false);
  });

  it("setPredictionsEnabled persists then updates local state", async () => {
    const { result } = renderHook(() => useAppSettings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setPredictionsEnabled(false);
    });

    expect(appSettingsService.setPredictionsEnabled).toHaveBeenCalledWith(false);
    expect(result.current.predictionsEnabled).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });
});
