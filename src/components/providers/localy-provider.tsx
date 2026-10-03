"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import type { AppData } from "@/lib/types";
import { getOpportunities } from "@/services/opportunities";
import { getCommunityPosts } from "@/services/community";
import { getConversations } from "@/services/conversations";
import { getBookings } from "@/services/bookings";
import { getBusiness } from "@/services/business";
import { getActivity, getSettings } from "@/services/agent";
import { isSupabaseMode } from "@/services/api";
import {
  subscribeToFeed,
  verifyWorkspaceAccess,
} from "@/services/supabase-feed";
interface LocalyContext {
  data: AppData | null;
  error: string | null;
  refresh: () => Promise<void>;
  act: <T>(
    action: () => Promise<T>,
    message?: string,
  ) => Promise<T | undefined>;
  busy: boolean;
  notice: string | null;
  demoStep: number | null;
  setDemoStep: (step: number | null) => void;
}
const Context = createContext<LocalyContext | null>(null);
async function loadWorkspace(): Promise<AppData> {
  if (isSupabaseMode) await verifyWorkspaceAccess();
  const [
    business,
    opportunities,
    posts,
    conversations,
    bookings,
    activity,
    settings,
  ] = await Promise.all([
    getBusiness(),
    getOpportunities(),
    getCommunityPosts(),
    getConversations(),
    getBookings(),
    getActivity(),
    getSettings(),
  ]);
  return {
    business,
    opportunities,
    posts,
    conversations,
    bookings,
    activity,
    settings,
  };
}
export function LocalyProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [demoStep, setDemoStep] = useState<number | null>(null);
  const refreshing = useRef(false);
  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      setData(await loadWorkspace());
      setError(null);
    } catch (e) {
      if (isSupabaseMode) setData(null);
      setError(
        e instanceof Error ? e.message : "Could not refresh your workspace.",
      );
      throw e;
    } finally {
      refreshing.current = false;
    }
  }, []);
  useEffect(() => {
    if (!isSupabaseMode) return;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        void refresh().catch(() => {});
      }, 400);
    };
    const unsubscribe = subscribeToFeed(update);
    // Polling covers a missed event or unavailable Realtime. Hidden tabs stay quiet.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") update();
    }, 15000);
    const onVisible = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      unsubscribe();
      clearInterval(interval);
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);
  useEffect(() => {
    let active = true;
    loadWorkspace()
      .then((value) => {
        if (active) setData(value);
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : "Could not load Localy.");
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(t);
  }, [notice]);
  const act = useCallback(
    async <T,>(
      action: () => Promise<T>,
      message?: string,
    ): Promise<T | undefined> => {
      setBusy(true);
      setError(null);
      try {
        const result = await action();
        await refresh();
        if (message) setNotice(message);
        return result;
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Something went wrong. Please try again.",
        );
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );
  return (
    <Context.Provider
      value={{ data, error, refresh, act, busy, notice, demoStep, setDemoStep }}
    >
      {children}
    </Context.Provider>
  );
}
export function useLocaly() {
  const value = useContext(Context);
  if (!value) throw new Error("LocalyProvider is required.");
  return value;
}
