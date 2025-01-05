import { WebSocketServer } from 'ws';

class WebSocketServerWrapper {
    constructor(port) {
        this.m_port = port;
        this.m_ws_plugin = null;
        this.m_ws_runtime = null; //当前活跃的runtime socket
        this.m_runtime_list = []; //所有链接的runtime socket (可能存在多个可调式的runtime socket，但是同时只能有一个活跃的)
    }

    start() {
        this.wss = new WebSocketServer({ port: this.m_port });
        console.log(`WebSocket server running on ws://localhost:${this.m_port}`);

        this.wss.on('connection', (ws) => {
            console.log('New client connected.');
            ws.on('message', (message) => this._onMessage(ws, message));
            ws.on('close', () => this._onClose(ws));
        });
    }

    _onMessage(ws, message) {
        const msg = JSON.parse(message);
        if(msg.isSplit){
            if(ws==this.m_ws_plugin){//是从plugin端发过来的，转发给runtime端
                if(this.m_ws_runtime!=null){
                    this.m_ws_runtime.send(JSON.stringify(msg));
                }
            }else if(ws==this.m_ws_runtime){
                if(this.m_ws_plugin!=null){
                    this.m_ws_plugin.send(JSON.stringify(msg));
                }
            }
            return
        }
        // console.log('我是server', JSON.stringify(msg));
        if (msg.type === 'identify') {
            if (msg.role === 'runtime') {
                this._add1Runtime(ws,msg.name)
                if(this.m_ws_runtime==null){
                    this.m_ws_runtime = ws;

                    // ws.send(JSON.stringify({ type: 'ack', message: 'Runtime registered.' }));
                    if(this.m_ws_plugin){//插件先上线
                        this._doSelectActiveRuntime(msg.name)
                        this.m_ws_plugin.send(JSON.stringify({ type: 'push', action: "otherSideOnlineChange", data: true}))
                    }
                }
                if(this.m_ws_plugin){//通知客户端当前链接的运行时列表
                    let nameList = this.m_runtime_list.map(obj => obj.name)
                    this.m_ws_plugin.send(JSON.stringify({ type: 'push', action: "pushRuntimeList", data: nameList}))
                }
                
                console.log('Runtime connected.',msg.name);
                
            } else if (msg.role === 'plugin') {
                this.m_ws_plugin = ws;
                console.log('Plugin connected.');
                // ws.send(JSON.stringify({ type: 'ack', message: 'Plugin registered.' }));
                if(this.m_ws_runtime){//运行时先上线
                    this._doSelectActiveRuntime(null)
                    // console.log("主动推送在线信息",JSON.stringify({ type: 'push', action: "otherSideOnlineChange", data: true}))
                    this.m_ws_plugin.send(JSON.stringify({ type: 'push', action: "otherSideOnlineChange", data: true}))
                }
            }
        }else if (msg.type === 'request') {
            if(msg.action === 'checkOtherSideIsInline') {//检查另一边是否在线
                const responseData = { type: 'response', action: msg.action, data: false, requestId: msg.requestId };
                if (ws==this.m_ws_plugin) {
                    responseData.data = this.m_ws_runtime!=null;
                }else if (ws==this.m_ws_runtime) {
                    responseData.data = this.m_ws_plugin!=null;
                }
                // console.log("直接回复在线信息",JSON.stringify(responseData))
                ws.send(JSON.stringify(responseData)); //从哪里来直接回复的哪里去，这条不需要转发

            }else{
                if(ws==this.m_ws_plugin){//是从plugin端发过来的，转发给runtime端
                    if(this.m_ws_runtime!=null){
                        this.m_ws_runtime.send(JSON.stringify(msg));
                    }
                }else if(ws==this.m_ws_runtime){
                    if(this.m_ws_plugin!=null){
                        this.m_ws_plugin.send(JSON.stringify(msg));
                    }
                }
            }
            
        }else if (msg.type === 'response') {
            if(ws==this.m_ws_plugin){//是从plugin端发过来的，转发给runtime端
                if(this.m_ws_runtime!=null){
                    this.m_ws_runtime.send(JSON.stringify(msg));
                }
            }else if(ws==this.m_ws_runtime){
                if(this.m_ws_plugin!=null){
                    this.m_ws_plugin.send(JSON.stringify(msg));
                }
            }
        }else if (msg.type === 'push') {
            if(ws==this.m_ws_plugin && msg.action === 'selectActiveRuntime') {//plugin发来的，从多个runtime中，选中一个需要调试的runtime
                this._doSelectActiveRuntime(msg.data)
            }else{
                if(ws==this.m_ws_plugin){//是从plugin端发过来的，转发给runtime端
                    if(this.m_ws_runtime!=null){
                        this.m_ws_runtime.send(JSON.stringify(msg));
                    }
                }else if(ws==this.m_ws_runtime){
                    if(this.m_ws_plugin!=null){
                        this.m_ws_plugin.send(JSON.stringify(msg));
                    }
                } 
            }
            
        }
    }

    _onClose(ws) {
        if (ws === this.m_ws_runtime) {
            this.m_ws_runtime = null;
            console.log('Runtime disconnected.');
            if(this.m_ws_plugin){
                this.m_ws_plugin.send(JSON.stringify({ type: 'push', action: "otherSideOnlineChange", data: false}))
            }
        }
        if (ws === this.m_ws_plugin) {
            this.m_ws_plugin = null;
            console.log('Plugin disconnected.');
        }
        let idx = -1
        for(let i=0;i<this.m_runtime_list.length;i++){
            let obj = this.m_runtime_list[i]
            if(obj.ws==ws){
                idx = i
                break
            }
        }
        if(idx>=0){
            this.m_runtime_list.splice(idx,1)
            if(this.m_ws_plugin){//通知客户端当前链接的运行时列表
                let nameList = this.m_runtime_list.map(obj => obj.name)
                this.m_ws_plugin.send(JSON.stringify({ type: 'push', action: "pushRuntimeList", data: nameList}))
            }
        }
    }

    /**新连上一个runtime socket */
    _add1Runtime(ws,name){
        let _ws = this._getRuntimeByName(name)
        if(_ws!=null){
            if(_ws!=ws){
                name = name +"_1"
            }
        }
        
        this.m_runtime_list.push({
            ws:ws,
            name:name
        })
    }

    _getRuntimeByName(name){
        let _newWs = null
        for(let obj of this.m_runtime_list){
            if(obj.name==name){
                _newWs = obj.ws
                break
            }
        }
        return _newWs
    }

    /**选择一个runtime socket作为当前活跃的runtime */
    _doSelectActiveRuntime(name){
        let _oldWs = this.m_ws_runtime
        let _newWs = this.m_ws_runtime
        if(name!=null){
            _newWs = this._getRuntimeByName(name)
        }
        if(_newWs!=null){
            if(_oldWs!=null && _oldWs!=_newWs){
                _oldWs.send(JSON.stringify({ type: 'push', action:"markActive", data:false}))
            }
            _newWs.send(JSON.stringify({ type: 'push', action:"markActive", data:true}))
            this.m_ws_runtime = _newWs
        }
    }
}

const myParam = process.argv[2];
let port = parseInt(myParam)
if(port==null||isNaN(port)){
    port = 8085
}

const server = new WebSocketServerWrapper(port);
server.start();