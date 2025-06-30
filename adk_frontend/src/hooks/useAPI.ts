/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface UseAPIResult<T = any> {
  loading: boolean;
  error: string | null;
  response: T | null;
  callAPI: (config: AxiosRequestConfig) => Promise<void>;
}

export function useAPI<T = any>(): UseAPIResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<T | null>(null);

  const callAPI = useCallback(async (config: AxiosRequestConfig) => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res: AxiosResponse<T> = await axios(config);
      console.log(res.data)
      setResponse(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, response, callAPI };
}