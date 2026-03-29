import { create } from 'zustand';

interface ConnectionState {
  isConnected: boolean;
  websocket: WebSocket | null;
  setConnected: (connected: boolean) => void;
  setWebSocket: (ws: WebSocket | null) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  isConnected: false,
  websocket: null,
  setConnected: (connected) => set({ isConnected: connected }),
  setWebSocket: (websocket) => set({ websocket }),
}));
