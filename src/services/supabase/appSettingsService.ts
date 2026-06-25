import { getSupabaseClient } from "./supabaseClient";
import { AppSettings } from "@/types/appSettings";
import { USE_MOCK_DATA, MOCK_APP_SETTINGS } from "@/services/mock";

export const appSettingsService = {
  /**
   * Fetches the single global settings row (public read).
   */
  async getAppSettings(): Promise<AppSettings> {
    if (USE_MOCK_DATA) {
      return MOCK_APP_SETTINGS;
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("predictions_enabled")
      .eq("id", 1)
      .single();

    if (error) {
      throw new Error(`Failed to fetch app settings: ${error.message}`);
    }

    return data;
  },

  /**
   * Admin-only: master on/off switch for predictions across the whole
   * app (group, knockout, final) — independent of, and on top of, any
   * other lock criteria (group deadline, per-match locked flag).
   */
  async setPredictionsEnabled(enabled: boolean): Promise<void> {
    if (USE_MOCK_DATA) return;

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("app_settings")
      .update({ predictions_enabled: enabled })
      .eq("id", 1);

    if (error) {
      throw new Error(`Failed to update app settings: ${error.message}`);
    }
  },
};
