// Shim for isomorphic-ws to provide WebSocket as a named export
// This is needed because the Midnight SDK imports { WebSocket } from 'isomorphic-ws'
// but isomorphic-ws uses a default export

let WebSocketImpl;

if (typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined') {
  WebSocketImpl = window.WebSocket;
} else {
  try {
    WebSocketImpl = require('ws');
  } catch (e) {
    WebSocketImpl = typeof WebSocket !== 'undefined' ? WebSocket : null;
  }
}

export default WebSocketImpl;
export { WebSocketImpl as WebSocket };
