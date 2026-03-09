import { useEffect } from 'react';
import { useSignalRConnection } from '@/providers/SignalRProvider';
import { useCategories } from '@/hooks/queries/useCategories';
import { useDirectMessages } from '@/hooks/queries/useDirectMessages';
import { groupManager } from '@/lib/signalr-group-manager';

export function useGroupSync() {
  const signalRContext = useSignalRConnection();
  const isConnected = signalRContext?.isConnected ?? false;
  const { data: categories } = useCategories();
  const { data: directsData } = useDirectMessages();

  // Sync groups when data or connection changes
  useEffect(() => {
    if (!isConnected) return;
    if (categories === undefined && directsData === undefined) return;

    const desiredGroups = new Set<string>();

    categories?.forEach((cat) =>
      cat.conversations?.forEach((conv) => {
        if (conv.conversationId) desiredGroups.add(conv.conversationId);
      }),
    );

    directsData?.pages?.forEach((page) =>
      page.items?.forEach((dm) => {
        if (dm.id) desiredGroups.add(dm.id);
      }),
    );

    groupManager.syncGroups(desiredGroups);
  }, [categories, directsData, isConnected]);

  // Reset tracking on disconnect (server drops memberships)
  useEffect(() => {
    if (!isConnected) {
      groupManager.reset();
    }
  }, [isConnected]);

  // Leave all on unmount (logout)
  useEffect(() => {
    return () => { groupManager.leaveAll(); };
  }, []);
}
