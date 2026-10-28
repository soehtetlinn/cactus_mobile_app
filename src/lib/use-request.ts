import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

/** Turns any thrown error into a message for the user. */
export function useErrorMessage() {
  const { t } = useI18n();
  return useCallback(
    (error: unknown) => {
      if (error instanceof ApiError) return error.status === 0 ? t('errors.network') : error.message;
      return t('errors.generic');
    },
    [t],
  );
}

/**
 * Loads data when the screen comes into focus and on pull-to-refresh.
 * `load` should be wrapped in useCallback; changing it reloads.
 */
export function useRequest<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toMessage = useErrorMessage();
  const latest = useRef(0);

  const run = useCallback(
    async (isRefresh: boolean) => {
      const id = ++latest.current;
      if (isRefresh) setRefreshing(true);
      try {
        const result = await load();
        if (id === latest.current) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (id === latest.current) setError(toMessage(e));
      } finally {
        if (id === latest.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [load, toMessage],
  );

  useFocusEffect(
    useCallback(() => {
      run(false);
    }, [run]),
  );

  return { data, error, loading, refreshing, refresh: () => run(true), reload: () => run(false) };
}
