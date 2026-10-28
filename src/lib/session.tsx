import Constants from 'expo-constants';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { createApi, normalizeServer, type Api, type Employee } from '@/lib/api';
import { getItem, removeItem, setItem } from '@/lib/storage';

const SERVER_KEY = 'cactus.server';
const TOKEN_KEY = 'cactus.token';
const EMPLOYEE_KEY = 'cactus.employee';

/** Server address shown on first launch, from app.json → expo.extra.serverUrl. */
export const DEFAULT_SERVER: string = Constants.expoConfig?.extra?.serverUrl ?? '';

type SessionState = {
  /** false until the saved session has been read from storage */
  ready: boolean;
  server: string;
  employee: Employee | null;
  /** client for signed-in calls; when signed out it can only reach public methods */
  api: Api;
  signIn: (server: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setEmployee: (employee: Employee) => void;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [server, setServer] = useState(DEFAULT_SERVER);
  const [token, setToken] = useState<string | null>(null);
  const [employee, setEmployeeState] = useState<Employee | null>(null);

  useEffect(() => {
    (async () => {
      const [savedServer, savedToken, savedEmployee] = await Promise.all([
        getItem(SERVER_KEY),
        getItem(TOKEN_KEY),
        getItem(EMPLOYEE_KEY),
      ]);
      if (savedServer) setServer(savedServer);
      if (savedToken && savedEmployee) {
        setToken(savedToken);
        setEmployeeState(JSON.parse(savedEmployee) as Employee);
      }
      setReady(true);
    })();
  }, []);

  const signOut = useCallback(async () => {
    setToken(null);
    setEmployeeState(null);
    await Promise.all([removeItem(TOKEN_KEY), removeItem(EMPLOYEE_KEY)]);
  }, []);

  // A 401/403 on a signed-in call means the token was revoked: send the user back to sign in.
  const api = useMemo(() => createApi(server, token, () => void signOut()), [server, token, signOut]);

  const signIn = useCallback(async (serverInput: string, email: string, password: string) => {
    const nextServer = normalizeServer(serverInput);
    const result = await createApi(nextServer, null).login(email.trim(), password);
    await Promise.all([
      setItem(SERVER_KEY, nextServer),
      setItem(TOKEN_KEY, result.token),
      setItem(EMPLOYEE_KEY, JSON.stringify(result.employee)),
    ]);
    setServer(nextServer);
    setToken(result.token);
    setEmployeeState(result.employee);
  }, []);

  const setEmployee = useCallback((next: Employee) => {
    setEmployeeState(next);
    setItem(EMPLOYEE_KEY, JSON.stringify(next));
  }, []);

  const value = useMemo<SessionState>(
    () => ({ ready, server, employee: token ? employee : null, api, signIn, signOut, setEmployee }),
    [ready, server, token, employee, api, signIn, signOut, setEmployee],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside SessionProvider');
  return context;
}

/** The signed-in employee. Only for screens behind the sign-in guard. */
export function useEmployee(): Employee {
  const { employee } = useSession();
  if (!employee) throw new Error('useEmployee used while signed out');
  return employee;
}
