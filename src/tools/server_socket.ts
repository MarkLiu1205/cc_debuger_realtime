const { exec, spawn } = require('child_process');
const path = require("path")

import { eventBus } from './_enentBus';
import { _funcs } from './_funcs';
const fs = require('fs-extra');

// WebSocket Server class
class ServerSocket {
    private process: any = null;

    private _isStarted = false;
    async start(port: string) {
        // const isMac = process.platform === 'darwin';
        // const executablePath = path.resolve( // 使用绝对路径避免路径遍历
        //     _funcs.getCurPluginPath(),
        //     isMac ? 'server/server' : 'server/server.exe'
        // );

        // // 验证文件存在性
        // try {
        //     await fs.access(executablePath); // 使用 fs-extra 的 access 方法
        // } catch (err) {
        //     throw new Error(`文件不存在: ${executablePath}`);
        // }

        // // 确保权限已设置
        // this.ensureExecutable(executablePath);
        
        // this.process = spawn(executablePath, ['-port', port],{
        //     shell: false, // 避免 Shell 注入风险
        // });

        let serverScript = path.join(_funcs.getCurPluginPath(), 'server/server.js');
        if(!fs.existsSync(serverScript)){
            serverScript = path.join(_funcs.getCurPluginPath(), 'server/js_server_with_wasm.js');
        }
        console.log('serverScript', serverScript);
        this.process = spawn('node', [serverScript,port]);
    
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

    private async ensureExecutable(executablePath: string) {
        if (process.platform === 'darwin') {
            try {
                // 使用 fs-extra 的 chmod 方法设置权限
                await fs.chmod(executablePath, 0o755); // 0o755 表示所有者 rwx，其他用户 rx
                console.log('权限已添加');
            } catch (err) {
                throw new Error(`无法修改权限: ${err.message}`);
            }
        }
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
