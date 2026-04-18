const socket = new WebSocket(
  location.protocol === "https:" 
    ? `wss://${location.host}` 
    : `ws://${location.host}`
);