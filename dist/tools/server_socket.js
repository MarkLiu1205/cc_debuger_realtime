"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._serverSocket = void 0;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const _misc_1 = require("./_misc");
// WebSocket Server class
class ServerSocket {
    constructor() {
        this.process = null;
    }
    start(port) {
        const serverScript = path.join(_misc_1._misc.getCurPluginPath(), 'src/tools/server.js');
        console.log('serverScript', serverScript);
        // 使用 spawn 启动子进程
        this.process = (0, child_process_1.spawn)('node', [serverScript, port]);
        // 捕获子进程输出
        this.process.stdout.on('data', (data) => {
            console.info(`[Server]: ${data.toString().trim()}`);
        });
        this.process.stderr.on('data', (data) => {
            console.error(`[Server Error]: ${data.toString().trim()}`);
        });
        this.process.on('error', (error) => {
            console.error('[Server Error]', error);
        });
        this.process.on('exit', (code) => {
            console.log(`[Server] Process exited with code ${code}`);
        });
        console.log('[Server] WebSocket server started.');
    }
    stop() {
        if (this.process) {
            // 使用 kill 方法关闭进程
            this.process.kill();
            console.log('[Server] WebSocket server stopped.');
            this.process = null; // 避免重复调用
        }
        else {
            console.warn('[Server] No running process to stop.');
        }
    }
}
exports._serverSocket = new ServerSocket();
