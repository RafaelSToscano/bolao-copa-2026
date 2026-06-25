import { useState, useCallback, useEffect } from "react";
import { appSettingsService } from "@/services/supabase/appSettingsService";

export function useAppSettings() {
  const [predictionsEnabled, setPredictionsEnabledState] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const settings = await appSettingsService.getAppSettings();
      setPredictionsEnabledState(settings.predictions_enabled);
    } catch (err) {
      console.error("Failed to load app settings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const settings = await appSettingsService.getAppSettings();
        if (!cancelled) setPredictionsEnabledState(settings.predictions_enabled);
      } catch (err) {
        console.error("Failed to load app settings:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const setPredictionsEnabled = useCallback(async (enabled: boolean) => {
    setIsSaving(true);
    try {
      await appSettingsService.setPredictionsEnabled(enabled);
      setPredictionsEnabledState(enabled);
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { predictionsEnabled, isLoading, isSaving, setPredictionsEnabled, refresh };
}
