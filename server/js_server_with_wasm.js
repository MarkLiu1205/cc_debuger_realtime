import { loadWasmOfGo } from './wasm/go_init.cjs';
import { WebSocketServer } from 'ws';
import http from 'http';

if (typeof globalThis.performance.markResourceTiming !== 'function') {
  globalThis.performance.markResourceTiming = function() {};
}

let _acc = 0;
let _map2 = {};
function getClientSocketId(ws) {
  for (let k in _map2) {
    if (_map2[k] == ws) {
      return parseInt(k);
    }
  }
  _acc++;
  _map2[_acc] = ws;
  return _acc;
}

globalThis.console_log = function (...a) {
  console.log(...a);
};

globalThis.sendWithWsId = function (wsId, msgStr) {
  try {
    const ws = _map2[wsId];
    ws.send(msgStr);
    // console.log("---------向客户端发送",wsId,msgStr)
  } catch (e) {
    console.log("eeeeee", e);
  }
};

globalThis.sendJsonRequest = function (baseURLs, endpoint, jsonData, callback) {
  let lastErr = null;
  let i = 0;

  function tryRequest() {
    if (i >= baseURLs.length) {
      callback(null, new Error(lastErr || "所有地址请求失败"));
      return;
    }
    const url = new URL(baseURLs[i++] + endpoint);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          lastErr = `HTTP error ${res.statusCode}`;
          tryRequest();
        } else {
          let obj = JSON.parse(data);
          obj["statusCode"] = res.statusCode;
          callback(JSON.stringify(obj), null);
        }
      });
    });

    req.on('error', (err) => {
      lastErr = err.message;
      tryRequest();
    });

    req.write(jsonData);
    req.end();
  }
  tryRequest();
};

async function startServer() {
  const wasmPath = '../server.wasm';
  await loadWasmOfGo(wasmPath);

  const myParam = process.argv[2];
  let port = parseInt(myParam);
  if (port == null || isNaN(port)) {
    port = 8085;
  }

  const _selfWs = new WebSocketServer({ port: port });
  console.log(`WebSocket server running on ws://localhost:${port}`);

  globalThis.setVerifyUrl("");

  _selfWs.on('connection', (ws, req) => {
    const wsId = getClientSocketId(ws);

    const IP = req.socket.remoteAddress;
    const Port = req.socket.remotePort;
    const Family = req.socket.remoteFamily;

    globalThis.handleConnectionWrapper(wsId, IP, Port, Family);

    ws.on('message', (message) => {
      const str = message.toString();
      // console.log("服务端收到",str)
      globalThis.handleMessageWrapper(wsId, str);
    });
    ws.on('close', () => {
      globalThis.handleOnCloseWrapper(wsId);
    });
  });
}

startServer();