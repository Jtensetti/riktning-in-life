// useAppTick — en lättviktig "puls" för UI:t som behöver veta vad klockan
// är just nu utan att hela trädet räknar om hela tiden.
//
// - Tickar var 60s medan fliken är synlig.
// - När visibilitychange → visible: omedelbart en tick + flagga
//   `justBecameVisible` (true för en render-loop) så hooks kan trigga refetch.
// - PartOfDay-byten (05/10/14/17/22) ger ett "boundary"-event som
//   konsumenter kan reagera på (t.ex. byta hälsningsfras utan reload).

import { useEffect, useRef, useState } from "react";
import { getTimeContext, type TimeContext } from "@/lib/timeContext";

export type AppTick = {
  tick: number;            // ökar varje minut
  ctx: TimeContext;        // alltid färsk timeContext
  justBecameVisible: boolean;
  partOfDayChanged: boolean;
};

export const useAppTick = (intervalMs = 60_000): AppTick => {
  const [tick, setTick] = useState(0);
  const [ctx, setCtx] = useState<TimeContext>(() => getTimeContext());
  const [justBecameVisible, setJustBecameVisible] = useState(false);
  const [partOfDayChanged, setPartOfDayChanged] = useState(false);
  const lastPartRef = useRef<string>(ctx.partOfDay);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const refresh = (becameVisible = false) => {
      const next = getTimeContext();
      const changed = next.partOfDay !== lastPartRef.current;
      lastPartRef.current = next.partOfDay;
      setCtx(next);
      setTick((t) => t + 1);
      setJustBecameVisible(becameVisible);
      setPartOfDayChanged(changed);
      // Reset transient flags på nästa render-cykel.
      if (becameVisible || changed) {
        queueMicrotask(() => {
          setJustBecameVisible(false);
          setPartOfDayChanged(false);
        });
      }
    };

    const startInterval = () => {
      if (timer) return;
      timer = setInterval(() => refresh(false), intervalMs);
    };
    const stopInterval = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh(true);
        startInterval();
      } else {
        stopInterval();
      }
    };

    const onFocus = () => refresh(true);
    const onPageShow = () => refresh(true);

    if (document.visibilityState === "visible") startInterval();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [intervalMs]);

  return { tick, ctx, justBecameVisible, partOfDayChanged };
};
