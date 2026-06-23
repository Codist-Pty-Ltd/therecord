"use client";

import { QueryProvider } from "@/providers/QueryProvider";

export default function RootProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <QueryProvider>{children}</QueryProvider>;
}
