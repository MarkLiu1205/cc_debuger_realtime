import { spawn } from 'child_process';
import * as path from 'path';

// @ts-ignore
import packageJSON from '../../package.json';
import { _funcs } from './_funcs';

// WebSocket Server class
class ServerSocket {
    private process: any = null;

    start(port:string) {
        const serverScript = path.join(_funcs.getCurPluginPath(), 'src/tools/server.js');
        console.log('serverScript', serverScript);

        // 使用 spawn 启动子进程
        this.process = spawn('node', [serverScript,port]);

        // 捕获子进程输出
        this.process.stdout.on('data', (data: Buffer) => {
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
