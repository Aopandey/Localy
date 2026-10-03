"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AppData } from "@/lib/types";
import { getOpportunities } from "@/services/opportunities";
import { getCommunityPosts } from "@/services/community";
import { getConversations } from "@/services/conversations";
import { getBookings } from "@/services/bookings";
import { getBusiness } from "@/services/business";
import { getActivity, getSettings } from "@/services/agent";
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
  const refresh = useCallback(async () => {
    setData(await loadWorkspace());
    setError(null);
  }, []);
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
