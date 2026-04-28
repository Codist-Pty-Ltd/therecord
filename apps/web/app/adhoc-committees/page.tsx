import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * The editorial list for ad hoc committees lives on `/commissions` (tab 2).
 * This URL keeps a short path for deep links and search while forwarding
 * readers to the combined index.
 */
export default function AdhocCommitteesIndexRedirect() {
  redirect("/commissions?tab=adhoc");
}
