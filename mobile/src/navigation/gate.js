// Auth gate shared by every screen. Lives in its own module so screens can
// import it without creating a circular dependency on AppNavigator.
import { createContext, useContext } from 'react';

export const GateCtx = createContext({
  isAuthed: false,
  pending: null,
  requireAuth: () => true,
  openCreate: () => {},
  resume: () => {},
  clearPending: () => {},
});

export function useGate() {
  return useContext(GateCtx);
}
