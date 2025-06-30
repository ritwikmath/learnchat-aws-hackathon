/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAPI } from './useAPI';
import { useCallback } from 'react';

interface SessionState {
  [key: string]: any;
}

interface UseSessionResult {
  create: any
  fetchAll: any
  fetchOne: any
  deleteOne: any
}

export function useSession(): UseSessionResult {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  console.log(backendUrl)
  const createAPI = useAPI();
  const createCallApi = createAPI.callAPI;

  const fetchAllAPI = useAPI();
  const fetchAllCallApi = fetchAllAPI.callAPI

  const fetchOneAPI = useAPI();
  const fetchOneCallAPI = fetchOneAPI.callAPI

  const deleteOneAPI = useAPI();
  const deleteOneCallAPI = deleteOneAPI.callAPI

  const fetchSessions = useCallback(
    async (userId: string) => {
      await fetchAllCallApi({
        method: 'GET',
        url: `${backendUrl}/apps/git_agent/users/${userId}/sessions`,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    },
    [fetchAllCallApi, backendUrl]
  )

  const fetchSessionDetails = useCallback(
    async (userId: string, sessionId: string) => {
      await fetchOneCallAPI({
        method: 'GET',
        url: `${backendUrl}/apps/git_agent/users/${userId}/sessions/${sessionId}`,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    },
    [fetchOneCallAPI, backendUrl]
  )

  const deleteSessionDetails = useCallback(
    async (userId: string, sessionId: string) => {
      await deleteOneCallAPI({
        method: 'DELETE',
        url: `${backendUrl}/apps/git_agent/users/${userId}/sessions/${sessionId}`,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    },
    [deleteOneCallAPI, backendUrl]
  )

  const createSession = useCallback(
    async (userId: string, sessionId: string, state: SessionState) => {
      await createCallApi({
        method: 'POST',
        url: `${backendUrl}/apps/git_agent/users/${userId}/sessions/${sessionId}`,
        headers: {
          'Content-Type': 'application/json',
        },
        data: state,
      });
    },
    [createCallApi, backendUrl]
  );

  return {
    create: {
      ...createAPI,
      createSession
    },
    fetchAll: {
      ...fetchAllAPI,
      fetchSessions
    },
    fetchOne: {
      ...fetchOneAPI,
      fetchSessionDetails
    },
    deleteOne: {
      ...deleteOneAPI,
      deleteSessionDetails
    }
  };
} 