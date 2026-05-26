const { exec, spawn } = require('child_process');
const path = require("path")

import { eventBus } from './_enentBus';
import { _funcs } from './_funcs';
const fs = require('fs-extra');

// WebSocket Server class
class ServerSocket {
    private process: any = null;

    private _isStarted = false;

    /** 記錄目前 spawn 的 server PID 的檔案;用於跨面板重載/崩潰後回收殘留 server */
    private _getPidFilePath(): string {
        return path.join(_funcs.getCurPluginPath(), 'cache', 'ccdebuger_server.pid');
    }

    /** 安全送出 kill,行程不存在時忽略 */
    private _killPidSafe(pid: number) {
        if (!pid || isNaN(pid)) return;
        try { process.kill(pid); } catch (e) { /* 已不存在或無權限 */ }
    }

    /** 回收上一輪殘留的 server(讀 PID 檔),避免 orphan 占住 8085 */
    private _killStaleServer() {
        const pidFile = this._getPidFilePath();
        try {
            if (fs.existsSync(pidFile)) {
                const pid = parseInt(fs.readFileSync(pidFile, 'utf-8'));
                this._killPidSafe(pid);
                fs.removeSync(pidFile);
            }
        } catch (e) {
            console.error('[Server] 清理殘留 server 失敗', e);
        }
    }

    async start(port: string) {
        // 重新 spawn 前先回收上一個(本實例的 + 跨重載殘留的),確保 8085 只有一台 server
        if (this.process) {
            try { this.process.kill(); } catch (e) {}
            this.process = null;
        }
        this._killStaleServer();
        this._isStarted = false;
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

        // 記錄 PID,讓下一輪 start()/stop() 能跨面板重載回收這台 server
        try {
            const pidFile = this._getPidFilePath();
            fs.ensureDirSync(path.dirname(pidFile));
            fs.writeFileSync(pidFile, String(this.process.pid));
        } catch (e) {
            console.error('[Server] 寫入 PID 檔失敗', e);
        }

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
        }
        // 即使本實例沒有 process 參照(例如重用了上一輪 spawn 的 server),也要靠 PID 檔回收,
        // 否則面板關閉後該 server 會變成 orphan 一直占著 8085。
        this._killStaleServer();
        this._isStarted = false;
    }
}

export const _serverSocket = new ServerSocket();
