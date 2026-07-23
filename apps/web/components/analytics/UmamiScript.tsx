import Script from "next/script";

const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

/**
 * Self-hosted Umami — no cookies, POPIA-friendly page analytics.
 * Omit env vars locally to disable tracking.
 */
export default function UmamiScript() {
  if (!scriptUrl || !websiteId) {
    return null;
  }

  return (
    <Script
      defer
      src={scriptUrl}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  );
}
