"use client";

import { useState } from "react";

const REQUEST_TYPES = [
  { value: "copyright", label: "Copyright" },
  { value: "factual_correction", label: "Factual correction" },
  { value: "popia_access", label: "POPIA — access request" },
  { value: "popia_deletion", label: "POPIA — deletion request" },
  { value: "popia_objection", label: "POPIA — objection" },
  { value: "other", label: "Other" },
] as const;

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; id: string; message: string }
  | { status: "error"; message: string };

export default function TakedownForm() {
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const apiBase =
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "")
      : "";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!apiBase) {
      setState({
        status: "error",
        message:
          "This form is not configured (NEXT_PUBLIC_API_URL is missing). Email us using the addresses below.",
      });
      return;
    }

    const form = e.currentTarget;
    const fd = new FormData(form);
    const request_type = String(fd.get("request_type") ?? "");
    const requestor_name = String(fd.get("requestor_name") ?? "").trim();
    const requestor_email = String(fd.get("requestor_email") ?? "").trim();
    const content_url = String(fd.get("content_url") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();

    setState({ status: "submitting" });

    try {
      const res = await fetch(`${apiBase}/api/takedown`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type,
          requestor_name,
          requestor_email,
          content_url,
          description,
        }),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = apiErrorMessage(
          data,
          `Request failed (${res.status}).`,
        );
        setState({ status: "error", message: msg });
        return;
      }

      if (
        data &&
        typeof data === "object" &&
        "id" in data &&
        typeof (data as { id: unknown }).id === "string" &&
        "message" in data &&
        typeof (data as { message: unknown }).message === "string"
      ) {
        setState({
          status: "success",
          id: (data as { id: string }).id,
          message: (data as { message: string }).message,
        });
        form.reset();
        return;
      }

      setState({
        status: "error",
        message: "Unexpected response from server. Please email us instead.",
      });
    } catch {
      setState({
        status: "error",
        message: "Network error. Please try again or email us.",
      });
    }
  }

  if (state.status === "success") {
    return (
      <div
        className="rounded-sm border border-amber/40 bg-amber/5 px-4 py-4 font-sans text-[15px] leading-relaxed text-charcoal"
        role="status"
      >
        <p className="font-medium text-charcoal">Request received</p>
        <p className="mt-2 text-charcoal/90">{state.message}</p>
        <p className="mt-3 font-mono text-[12px] text-charcoal/70">
          Reference: {state.id}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="flex flex-col gap-5 font-sans text-[15px]"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="request_type" className="text-sm font-medium text-charcoal">
          Request type
        </label>
        <select
          id="request_type"
          name="request_type"
          required
          className="w-full rounded-sm border border-charcoal/20 bg-cream px-3 py-2 text-charcoal focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
          defaultValue="copyright"
        >
          {REQUEST_TYPES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="requestor_name" className="text-sm font-medium text-charcoal">
          Your name
        </label>
        <input
          id="requestor_name"
          name="requestor_name"
          type="text"
          required
          maxLength={300}
          autoComplete="name"
          className="w-full rounded-sm border border-charcoal/20 bg-cream px-3 py-2 text-charcoal focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="requestor_email" className="text-sm font-medium text-charcoal">
          Your email
        </label>
        <input
          id="requestor_email"
          name="requestor_email"
          type="email"
          required
          maxLength={300}
          autoComplete="email"
          className="w-full rounded-sm border border-charcoal/20 bg-cream px-3 py-2 text-charcoal focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="content_url" className="text-sm font-medium text-charcoal">
          URL of content on The Record
        </label>
        <input
          id="content_url"
          name="content_url"
          type="url"
          required
          maxLength={2000}
          placeholder="https://therecord.co.za/…"
          className="w-full rounded-sm border border-charcoal/20 bg-cream px-3 py-2 text-charcoal focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-medium text-charcoal">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          minLength={10}
          maxLength={10000}
          rows={6}
          className="w-full rounded-sm border border-charcoal/20 bg-cream px-3 py-2 text-charcoal focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
        />
      </div>

      {state.status === "error" ? (
        <p className="text-sm text-red-800" role="alert">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={state.status === "submitting"}
        className="inline-flex items-center justify-center rounded-sm bg-charcoal px-5 py-2.5 font-mono text-[12px] tracking-wider uppercase text-cream hover:bg-charcoal/90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
      >
        {state.status === "submitting" ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}

function apiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object" || !("message" in data)) {
    return fallback;
  }
  const m = (data as { message: unknown }).message;
  if (typeof m === "string") return m;
  if (Array.isArray(m) && m.every((x) => typeof x === "string")) {
    return m.join(" ");
  }
  return fallback;
}
