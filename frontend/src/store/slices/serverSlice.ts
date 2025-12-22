import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ServerCode, DEFAULT_SERVERS } from '@/lib/serverDetector';
import { Server } from '@/types';

interface ServerState {
  currentServer: ServerCode;
  servers: Record<ServerCode, Server>;
  loading: boolean;
}

const initialState: ServerState = {
  currentServer: 'albaro',
  servers: DEFAULT_SERVERS,
  loading: false,
};

const serverSlice = createSlice({
  name: 'server',
  initialState,
  reducers: {
    setServer: (state, action: PayloadAction<ServerCode>) => {
      state.currentServer = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedServer', action.payload);
      }
    },
    initServer: (state, action: PayloadAction<ServerCode>) => {
      state.currentServer = action.payload;
    },
    setServers: (state, action: PayloadAction<Server[]>) => {
      const serversMap: Record<string, Server> = {};
      action.payload.forEach(server => {
        if (server.isActive) {
          serversMap[server.code] = server;
        }
      });
      state.servers = serversMap as Record<ServerCode, Server>;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setServer, initServer, setServers, setLoading } = serverSlice.actions;
export default serverSlice.reducer;

// Selectors
export const selectCurrentServer = (state: { server: ServerState }) => state.server.currentServer;
export const selectServerInfo = (state: { server: ServerState }) => state.server.servers[state.server.currentServer];
export const selectServers = (state: { server: ServerState }) => state.server.servers;
export const selectAllServers = (state: { server: ServerState }) => Object.values(state.server.servers);
export const selectServersLoading = (state: { server: ServerState }) => state.server.loading;

