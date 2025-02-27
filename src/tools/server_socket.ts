const { exec, spawn } = require('child_process');
const path = require("path")

import { eventBus } from './_enentBus';
import { _funcs } from './_funcs';

// WebSocket Server class
class ServerSocket {
    private process: any = null;

    private _isStarted = false;
    start(port: string) {
        const isWindows = process.platform === 'win32';
        const executablePath = path.join(
            _funcs.getCurPluginPath(),
            isWindows ? 'server/proxy_server.exe' : 'server/proxy_server'
        );
    
        this.process = spawn(executablePath, ['-port', port]);
        // const serverScript = path.join(_funcs.getCurPluginPath(), 'server/server.js');
        // console.log('serverScript', serverScript);

        // // 使用 spawn 启动子进程
        // this.process = spawn('node', [serverScript,port]);
    
        // 保留原有的输出捕获与错误处理逻辑
        this.process.stdout.on('data', (data: Buffer) => {
            if(!this._isStarted){
                this._isStarted = true
                eventBus.emit("localServerStarted")
            }
            console.info(`[Server]: ${data.toString().trim()}`);
        });
    
        this.process.stderr.on('data', (data: Buffer) => {
            console.error(`[Server Error]: ${data.toString().trim()}`);
        });
    
        this.process.on('error', (error: Error) => {
            console.error('[Server Error]', error);
        });
    
        this.process.on('exit', (code: number) => {
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
        } else {
            console.warn('[Server] No running process to stop.');
        }
    }
}

export const _serverSocket = new ServerSocket();
