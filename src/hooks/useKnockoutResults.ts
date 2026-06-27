import { useState, useEffect } from "react";
import { KnockoutMatchRecord } from "@/types/knockout";
import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";

/**
 * Read-only view of the 32-match knockout bracket — official teams and
 * results only, no predictions. Used by the public `/mata-mata` page;
 * the admin equivalent (`useKnockoutAdmin`) additionally exposes the
 * mutation actions that page needs.
 */
export function useKnockoutResults() {
  const [matches, setMatches] = useState<KnockoutMatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const data = await knockoutPredictionsService.getKnockoutMatches();
        if (!cancelled) setMatches(data);
      } catch (err) {
        console.error("Failed to load knockout matches:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { matches, isLoading };
}
