import { useMutation } from "@tanstack/react-query";

import { clientPost } from "@/lib/client-api";

export type TakedownPayload = {
  request_type: string;
  requestor_name: string;
  requestor_email: string;
  content_url: string;
  description: string;
};

export type TakedownResponse = {
  id: string;
  message: string;
};

export function useSubmitTakedown() {
  return useMutation({
    mutationFn: (payload: TakedownPayload) =>
      clientPost<TakedownResponse>("/api/takedown", payload),
  });
}
