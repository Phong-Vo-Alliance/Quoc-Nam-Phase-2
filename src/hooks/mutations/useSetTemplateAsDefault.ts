/**
 * Mutation hook for setting a checklist template as default
 * POST /api/checklist-templates/{id}/set-default
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checklistTemplatesApi } from '@/api/checklist-templates.api';
import { checklistTemplateKeys } from '@/hooks/queries/useChecklistTemplates';
import { toast } from 'sonner';

interface UseSetTemplateAsDefaultOptions {
  conversationId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useSetTemplateAsDefault({
  conversationId,
  onSuccess,
  onError,
}: UseSetTemplateAsDefaultOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) =>
      checklistTemplatesApi.setTemplateAsDefault(templateId),
    onSuccess: () => {
      // Invalidate templates query to refetch with updated isDefault
      queryClient.invalidateQueries({
        queryKey: checklistTemplateKeys.all,
      });

      toast.success('Đã đặt làm mẫu mặc định');
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Failed to set template as default:', error);
      toast.error('Không thể đặt làm mặc định. Vui lòng thử lại.');
      onError?.(error);
    },
  });
}
