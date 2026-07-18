import { getSupabaseClient } from "./supabaseClient";

const APP_SETTINGS_COLUMNS =
  "id, predictions_enabled, suspense_mode, suspense_message, revealed_at, updated_at";

export type AppSettings = {
  id: number;
  predictions_enabled: boolean;
  suspense_mode: boolean;
  suspense_message: string | null;
  revealed_at: string | null;
  updated_at: string;
};

const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  predictions_enabled: true,
  suspense_mode: false,
  suspense_message: null,
  revealed_at: null,
  updated_at: new Date(0).toISOString(),
};

export const appSettingsService = {
  async get(): Promise<AppSettings> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select(APP_SETTINGS_COLUMNS)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar configurações: ${error.message}`);
    }

    return data ?? DEFAULT_SETTINGS;
  },

  async updateSuspenseMode(enabled: boolean): Promise<AppSettings> {
    const supabase = getSupabaseClient();
    const current = await this.get();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("app_settings")
      .update({
        suspense_mode: enabled,
        revealed_at: enabled ? null : now,
        updated_at: now,
      })
      .eq("id", current.id)
      .select(APP_SETTINGS_COLUMNS)
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar o Modo Suspense: ${error.message}`);
    }

    return data;
  },
};
