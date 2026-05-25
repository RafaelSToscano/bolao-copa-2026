import { useState, useCallback } from "react";
import { GROUPS_PHASE_DEADLINE } from "@/config/scoring";

export function usePhaseState() {
  const [, setUpdateTrigger] = useState({});

  const isGroupsLocked = useCallback(() => {
    return new Date() > GROUPS_PHASE_DEADLINE;
  }, []);

  // Force update when needed
  const refresh = useCallback(() => {
    setUpdateTrigger({});
  }, []);

  return {
    isGroupsLocked,
    refresh,
  };
}
