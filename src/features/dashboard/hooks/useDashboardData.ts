import { useCallback, useEffect, useState } from 'react';
import { getDashboardData } from '../services/dashboardService';
import type { DashboardData } from '../types/dashboard';

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);

  const [error, setError] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      setData(await getDashboardData());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let current = true;

    getDashboardData()
      .then((result) => {
        if (current) setData(result);
      })
      .catch((cause: unknown) => {
        if (current) {
          setError(
            cause instanceof Error ? cause.message : 'Não foi possível carregar o dashboard.',
          );
        }
      })
      .finally(() => {
        if (current) setIsLoading(false);
      });

    return () => {
      current = false;
    };
  }, []);

  return { data, error, isLoading, refresh: load };
}
