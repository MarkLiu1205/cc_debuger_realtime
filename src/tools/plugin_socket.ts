import { _funcs } from "./_funcs";

let _accId = 0;
function _getAccId(){
    return ++_accId
}

interface OneMsg{
    type: string, 
    action: string; 
    data?: any; 
    requestId: number 
}

interface SplitMsg{
    isSplit:boolean,
    idx:number,
    total:number,
    data:string,
    uniqueId:number
}

class PluginSocket {
    private m_socket: WebSocket; // WebSocket 实例
    private m_pendingRequests: Map<number,any>; // 存储未完成的请求

    constructor(){
        this.m_socket = null as any
        this.m_pendingRequests = new Map()
    }

    private closeSocket(){
        if(this.m_socket){
            this.m_socket.close()
            this.m_socket = null
        }
    }

    public checkIsConnect(){
        if( this.m_socket && this.m_socket.readyState === WebSocket.OPEN){
            return true
        }
        return false
    }

    async connectToServer(url:string) {
        this.closeSocket()
        await new Promise((resolve, reject) => {
            this.m_socket = new WebSocket(url);

            this.m_socket.onopen = () => {
                _funcs.log_1(' Connected to server');
                this._send({ type: 'identify', role: 'plugin' })
                resolve(null);
            };

            this.m_socket.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                this._onMessage(msg);
            };

            this.m_socket.onclose = () => {
                _funcs.log_1(' Disconnected from server');
            };

            this.m_socket.onerror = (error) => {
                console.error('[Plugin] WebSocket error:', error);
                reject(error);
            };
        });
        this._onOpenResolve.forEach((resolve) => {
            resolve(null)
        })
        this._onOpenResolve = []
    }

    private _onOpenResolve:Array<(data:any)=>void> = []
    /**等待socket连接上 */
    async waitSocketOpen(){
        if(this.checkIsConnect()){
            return
        }
        return new Promise((resolve, reject) => {
            this._onOpenResolve.push(resolve)
        })
    }
    
    private _spiltMsg:Record<number,Array<SplitMsg>> = {}
    private _onMessage(msg: OneMsg) {
        // _funcs.log_1("onMesage",JSON.stringify(msg))
        if(msg["isSplit"]){
            const obj = msg as any as SplitMsg
            this._spiltMsg[obj.uniqueId] = this._spiltMsg[obj.uniqueId] || []
            this._spiltMsg[obj.uniqueId].push(obj)
            if(this._spiltMsg[obj.uniqueId].length === obj.total){
                this._spiltMsg[obj.uniqueId].sort((a,b)=>{
                    return a.idx - b.idx
                })
                let str = ""
                for(let item of this._spiltMsg[obj.uniqueId]){
                    str += item.data
                }
                delete this._spiltMsg[obj.uniqueId]
                msg = JSON.parse(str)
            }else{
                return
            }
        }
        if (msg.type === 'response' && msg.requestId != null) {//表示这条是对之前自己发送的请求的回复
            const pending = this.m_pendingRequests.get(msg.requestId);
            if (pending) {
                this.m_pendingRequests.delete(msg.requestId);
                pending.resolve(msg.data);
            }
        }else if(msg.type === 'push'){
            this._on_push_dataMap[msg.action] = msg.data
            if(this._onChangeForPushData[msg.action]){//表示注册过了监听
                this._onChangeForPushData[msg.action](msg.data)
            }
            if(msg.action === PushAction.otherSideOnlineChange){
                let bIsOnline = msg.data as boolean
                if(bIsOnline){
                    if(this._onWaitRuntimeOnlineResolves){
                        for(let resolve of this._onWaitRuntimeOnlineResolves){
                            resolve(true)
                        }
                        this._onWaitRuntimeOnlineResolves = []
                    }
                }
            }
        }
    }

    /**存储推送过来的，需要存储的数据，如在线列表、当前节点树 */
    private _on_push_dataMap:Record<string,any> = {}
    private _onChangeForPushData:Record<string,Function> = {};
    private listenForPushData<T>(pushAction:string,callback:(data:T)=>void,defaultData:T=null){
        this._onChangeForPushData[pushAction] = callback
        
        const data = this._on_push_dataMap[pushAction]??defaultData
        if(callback){
            callback(data)
        }
    }

    /**
     * 监听运行时的在线情况
     */
    listenRuntimeOnlineInfo(callback:(bIsOnline:boolean)=>void){
        this.listenForPushData<boolean>(PushAction.otherSideOnlineChange,callback,this.checkIsConnect())
    }

    /**
     * 监听所有在线runtime列表名称
     */
    listenRuntimeList(callback:(nameArr:Array<string>)=>void){
        this.listenForPushData<Array<string>>(PushAction.pushRuntimeList,callback,[])
    }

    /**
     * 监听节点树的变化
     */
    listenSceneNodeTree(callback:(data:any)=>void){
        this.listenForPushData<any>(PushAction.updateSceneTree,callback,null)
    }

    /**
     * 监听场景切换变化
     */
    listenSceneLaunched(callback:(data:any)=>void){
        this.listenForPushData<any>(PushAction.sceneLaunched,callback,null)
    }

    private _onWaitRuntimeOnlineResolves:Array<(data:any)=>void> = []
    /**等待runtime上线连接上plugin */
    async waitForRuntimeIsInline(){
        await this.waitSocketOpen()
        return new Promise(async (resolve, reject) => {
            let ret:boolean = await this._sendRequest('checkOtherSideIsInline')
            if(ret){
                resolve(true)
            }else{
                this._onWaitRuntimeOnlineResolves.push(resolve)
            }
        })
    }

    /**选择一个runtime socket作为当前活跃的runtime */
    selectActiveRuntime(name:string){
        this._sendPush("selectActiveRuntime",name)
    }

    private _send(data: any) {
        const step = 1024 * 10;
        const jsonStr = JSON.stringify(data);
        if (jsonStr.length <= step) {
            this.m_socket?.send(jsonStr);
        } else {
            let idx = 0;
            const total = Math.ceil(jsonStr.length / step);
            const uniqueId = _getAccId()
            while (idx < total) {
                const subStr = jsonStr.substring(idx * step, Math.min((idx + 1) * step, jsonStr.length));
                const subObj:SplitMsg = { 
                    isSplit: true, idx: idx + 1, total: total, data: subStr , uniqueId: uniqueId,
                }
                this.m_socket?.send(JSON.stringify(subObj));
                idx += 1;
            }
        }
    }

    /**
     * 发送一条不需要返回的socket推送
     */
    public _sendPush(action:string,data = null){
        if (!this.m_socket || this.m_socket.readyState !== WebSocket.OPEN) {
            return Promise.reject(new Error('WebSocket is not connected'));
        }
        this._send({ type: 'push', action: action, data: data })
    }

    /**发送一个需要返回的socket请求，异步返回结果 */
    private async _sendRequest<T>(action:string, data:any = null, type:string = 'request') {
        if (!this.m_socket || this.m_socket.readyState !== WebSocket.OPEN) {
            return Promise.reject(new Error('WebSocket is not connected'));
        }

        const requestId = _getAccId()
        const payload:OneMsg = { type: type, action, data, requestId };
        // _funcs.log_1(" send",JSON.stringify(payload))

        return new Promise<T>((resolve, reject) => {
            this.m_pendingRequests.set(requestId, { resolve, reject });
            this._send(payload)

            // 超时处理
            setTimeout(() => {
                if (this.m_pendingRequests.has(requestId)) {
                    this.m_pendingRequests.delete(requestId);
                    reject(new Error(`Request timed out:  ${JSON.stringify(payload)}`));
                }
            }, 5000); // 5 秒超时
            
        });
    }

    async getNewAddedAssets() {
        await this.waitForRuntimeIsInline() //要先等plugin和runtime都连上服务器
        let ret = await this._sendRequest<Record<string,number>>('getNewAddedAssets');
        return ret
    }

    async getRefCount(uuid:string) {
        await this.waitForRuntimeIsInline() //要先等plugin和runtime都连上服务器
        return this._sendRequest<number>('getRefCount', { uuid });
    }

    async getNodeInfo(uuid:string):Promise<InspectorInfo_Node> {
        await this.waitForRuntimeIsInline() //要先等plugin和runtime都连上服务器
        let info = await this._sendRequest('getNodeInfo', { uuid });
        info = _funcs.roundNumbersToPrecision(info, 2)
        return info as any as InspectorInfo_Node
    }

    async getNodeOfComp(uuid:string) {
        await this.waitForRuntimeIsInline()
        let info = await this._sendRequest('getNodeOfComp', { uuid });
        return info as {name:string,uuid:string}
    }

    /**执行js并返回执行结果 */
    async evalJsInRuntime(str:string){
        console.log("zzzzz 1.2")
        await this.waitForRuntimeIsInline() //要先等plugin和runtime都连上服务器
        console.log("zzzzz 1.5")
        return this._sendRequest("eval_js",str)
    }

    /**
     * 修改节点（仅限于坐标旋转等，不包括组件）
     * @param obj 改变的节点信息
     */
    async reqModifyNodeInfo(obj:ChangedNodeInfo){
        await this.waitForRuntimeIsInline()
        return this._sendRequest("reqModifyNodeInfo",obj)
    }

    /**
     * 筛选节点树中的组件
     * @param typeStr 
     * @returns 
     */
    async fiterCompsWithType(typeStr:CompType):Promise<Array<{uuid:string,nodeUuid:string}>>{
        await this.waitForRuntimeIsInline()
        return this._sendRequest("fiterCompsWithType",typeStr)
    }

    private _nodeLayers:Record<string,number> = null
    async getNodeLayerEnums(){
        if(this._nodeLayers){
            return this._nodeLayers
        }
        let str = await this.evalJsInRuntime("return cc.Layers.Enum")
        try{
            this._nodeLayers = JSON.parse(str as string)
        }catch(e){
            console.error(e)
        }
        return this._nodeLayers
    }
};

enum PushAction{
    /**实时通知当前active runtime的在线情况 */
    otherSideOnlineChange = "otherSideOnlineChange",
    /**实时更新当前在线的runtime列表 */
    pushRuntimeList = "pushRuntimeList",
    /**实时刷新节点树 */
    updateSceneTree = "updateSceneTree",
    /**场景切换 */
    sceneLaunched = "sceneLaunched",

}

export const _pluginSocket = new PluginSocket();