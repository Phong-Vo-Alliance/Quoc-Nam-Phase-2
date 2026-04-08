/**
 * Mutation hook for creating Information Confirmed
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInformationConfirmed } from "@/api/information_confirmed.api";
import { informationConfirmedKeys } from "../queries/keys/informationConfirmedKeys";
import { toast } from "sonner";
import type {
  CreateInformationConfirmedRequest,
  InformationConfirmedDto,
} from "@/types/information_confirmed";

interface UseCreateInformationConfirmedOptions {
  onSuccess?: (data: InformationConfirmedDto) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to create a new confirmed information record
 */
export function useCreateInformationConfirmed(
  options?: UseCreateInformationConfirmedOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInformationConfirmedRequest) =>
      createInformationConfirmed(data),
    onSuccess: (data) => {
      // Invalidate all confirmed information queries
      queryClient.invalidateQueries({
        queryKey: informationConfirmedKeys.all,
      });

      // Invalidate specific conversation's confirmed information
      queryClient.invalidateQueries({
        queryKey: informationConfirmedKeys.list({
          conversationId: data.conversationId,
        }),
      });

      toast.success("Đã tiếp nhận thông tin");
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      console.error("Failed to create confirmed information:", error);
      toast.error("Không thể tiếp nhận thông tin");
      options?.onError?.(error);
    },
  });
}
