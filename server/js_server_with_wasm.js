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

// ===== 診斷 log:用 DEBUG_FRAMES=1 開啟,觀察 runtime/plugin 進出的 frame =====
const _debugFrames = process.env.DEBUG_FRAMES === '1';
const _roleOfWsId = {};
function _summariseFrame(dir, wsId, str) {
  if (!_debugFrames) return;
  let role = _roleOfWsId[wsId] || '?';
  let summary;
  try {
    const m = JSON.parse(str);
    if (m.type === 'identify') {
      _roleOfWsId[wsId] = m.role;
      role = m.role;
    }
    if (m.isSplit) {
      summary = `isSplit idx=${m.idx}/${m.total} uniqueId=${m.uniqueId} enc=${m.encrypted} dataLen=${(m.data || '').length}`;
    } else {
      const actReadable = m.encrypted ? `<enc${m.encrypted}>` : m.action;
      summary = `type=${m.type} action=${actReadable} enc=${m.encrypted || 0}`;
    }
  } catch (e) {
    summary = `<non-json len=${str.length}>`;
  }
  console.log(`[FRAME ${dir}] ws#${wsId}(${role}) ${summary}`);
}

globalThis.sendWithWsId = function (wsId, msgStr) {
  try {
    const ws = _map2[wsId];
    _summariseFrame('OUT->', wsId, msgStr);
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
      _summariseFrame('IN <-', wsId, str);
      globalThis.handleMessageWrapper(wsId, str);
    });
    ws.on('close', () => {
      globalThis.handleOnCloseWrapper(wsId);
    });
  });
}

startServer();