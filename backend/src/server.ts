import http from 'http';
import app from './app';
import { setupWebSocketServer } from './realtime/websocket.server';

const port = process.env.PORT || 3001;
const server = http.createServer(app);

// Attach Real-time WebSocket server
setupWebSocketServer(server);

if (process.env.NODE_ENV !== 'test') {
  server.listen(port, () => {
    console.log(`[Disk Interno Backend] Modular Monolith online na porta ${port}`);
    console.log(`[Realtime] WebSocket Server ativo em ws://127.0.0.1:${port}/realtime`);
  });
}

export { server };
export default app;
