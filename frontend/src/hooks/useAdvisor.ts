import { useEffect, useState } from "react";
import { calculateAdvisor } from "../lib/pokerWorker";
import type { AdvisorInput, AdvisorResult } from "../lib/pokerAdvisor";

export function useAdvisor(input: AdvisorInput | null) {
  const key = JSON.stringify(input);
  const [read, setRead] = useState<{
    key: string;
    result?: AdvisorResult;
    error?: string;
  }>();
  useEffect(() => {
    let stale = false;
    const parsed: AdvisorInput | null = JSON.parse(key);
    if (parsed)
      calculateAdvisor(parsed)
        .then((result) => {
          if (!stale) setRead({ key, result });
        })
        .catch((error: Error) => {
          if (!stale) setRead({ key, error: error.message });
        });
    return () => {
      stale = true;
    };
  }, [key]);
  return {
    advisor: read?.key === key ? read.result : undefined,
    error: read?.key === key ? read.error : undefined,
  };
}
