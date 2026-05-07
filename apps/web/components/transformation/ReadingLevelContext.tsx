"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import type { PlainEnglishLevel } from "@/components/ui/PlainEnglishBox";

export type TransformationPageReadingLevel = PlainEnglishLevel;

export type TransformationUrlLevel = "child" | "plain" | "legal";

export function urlLevelToReadingLevel(
  v: string | null | undefined,
): TransformationPageReadingLevel {
  if (v === "child") return "child";
  if (v === "legal") return "legal";
  return "layperson";
}

export function readingLevelToUrlLevel(
  v: TransformationPageReadingLevel,
): TransformationUrlLevel {
  if (v === "layperson") return "plain";
  return v;
}

interface TransformationReadingLevelContextValue {
  level: TransformationPageReadingLevel;
  setLevel: (next: TransformationPageReadingLevel) => void;
}

const TransformationReadingLevelContext = createContext<
  TransformationReadingLevelContextValue | undefined
>(undefined);

/**
 * Reading level is controlled by `?level=child|plain|legal` (`plain` = layperson).
 * Default when the param is absent: layperson.
 */
export function TransformationReadingLevelProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const level = urlLevelToReadingLevel(searchParams.get("level"));

  const setLevel = useCallback(
    (next: TransformationPageReadingLevel) => {
      const params = new URLSearchParams(searchParams.toString());
      const u = readingLevelToUrlLevel(next);
      if (u === "plain") {
        params.delete("level");
      } else {
        params.set("level", u);
      }
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const value = useMemo(() => ({ level, setLevel }), [level, setLevel]);

  return (
    <TransformationReadingLevelContext.Provider value={value}>
      {children}
    </TransformationReadingLevelContext.Provider>
  );
}

export function useTransformationReadingLevel(): TransformationReadingLevelContextValue {
  const ctx = useContext(TransformationReadingLevelContext);
  if (!ctx) {
    throw new Error(
      "useTransformationReadingLevel must be used within TransformationReadingLevelProvider",
    );
  }
  return ctx;
}
