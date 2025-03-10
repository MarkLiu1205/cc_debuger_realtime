import { eventBus } from "./_enentBus";
import { _funcs } from "./_funcs";
import { _utils } from "./_utils";

let _accId = 0;
function _getAccId(){
    return ++_accId
}

interface OneMsg{
    type: string, 
    action: string; 
    data?: any; 
    requestId: number;
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

    private m_url = ""
    async connectToServer(url:string) {
        this.m_url = url
        this.closeSocket()
        await new Promise((resolve, reject) => {
            this.m_socket = new WebSocket(url);
            // console.log("ggggggggg",url,this.m_socket.url)
            this.m_socket.onopen = () => {
                _funcs.log_1(' Connected to server');
                this._send({ type: 'identify', role: 'plugin' })
                resolve(null);
                for(let cb of this._socketStateCallbacks){
                    cb(true)
                }
            };

            this.m_socket.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                this._onMessage(msg);
            };

            this.m_socket.onclose = () => {
                _funcs.log_1(' Disconnected from server');

                const action = PushAction.otherSideOnlineChange
                const obj = {
                    bIsOnline:false,
                    name:"",
                    info: { 
                        IP: "", 
                        Port: 0, 
                        Family: "" 
                    }
                }
                if(this._onChangeForPushData[action]?.length>0){//表示注册过了监听
                    for(let cb of this._onChangeForPushData[action]){
                        cb(obj)
                    }
                }

                for(let cb of this._socketStateCallbacks){
                    cb(false)
                }

                setTimeout(() => {
                    this.connectToServer(this.m_url)
                }, 5000);
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

    public getSocketUrl(){
        if(!this.checkIsConnect()){
            return this.m_url
        }
        // await this.waitSocketOpen()
        return this.m_socket.url
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

    private _socketStateCallbacks:Array<(bIsConnected:boolean)=>void> = []
    listenForSocketState(callback:(bIsConnected:boolean)=>void){
        if(!this._socketStateCallbacks.includes(callback)){
            this._socketStateCallbacks.push(callback)
        }
        callback(this.checkIsConnect())
    }
    
    private _spiltMsg:Record<number,Array<SplitMsg>> = {}
    private _onMessage(msg: OneMsg) {
        // _funcs.log_1("onMesage",JSON.stringify(msg))
        const verifyInfo = msg["verifyInfo"] as VerifyRespParam;
        if(typeof verifyInfo=="object"){
            if(verifyInfo.state!=null){
                eventBus.emit("verify_fail",verifyInfo)
            }
            
            if(verifyInfo.state==1||verifyInfo.state==4){
                const requestId = msg.requestId
                if (requestId!=null&&this.m_pendingRequests.has(requestId)) {
                    this.m_pendingRequests.delete(requestId);
                }
                return
            }
        }
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
            if(this._onChangeForPushData[msg.action]?.length>0){//表示注册过了监听
                for(let cb of this._onChangeForPushData[msg.action]){
                    cb(msg.data)
                }
            }
            if(msg.action === PushAction.otherSideOnlineChange){
                let {bIsOnline,name} = msg.data
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
    private _onChangeForPushData:Record<string,Array<(data)=>void>> = {};
    private listenForPushData<T>(pushAction:string,callback:(data:T)=>void,defaultData:T=null){
        this._onChangeForPushData[pushAction] = this._onChangeForPushData[pushAction]??[]
        this._onChangeForPushData[pushAction].push(callback)
        
        const data = this._on_push_dataMap[pushAction]??defaultData
        if(data!=null&&callback){
            callback(data)
        }
    }

    /**取消监听 */
    cancelPushListener(pushAction:string,callback:(data)=>void){
        let arr = this._onChangeForPushData[pushAction]
        if(arr){
            for(let i=arr.length-1;i>=0;i--){
                if(arr[i]==callback){
                    delete arr[i]
                }
            }
        }
    }

    /**
     * 监听运行时的在线情况
     */
    listenRuntimeOnlineInfo(callback:(info:OnlineInfo)=>void){
        this.listenForPushData(PushAction.otherSideOnlineChange,callback)
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

    /**
     * 监听运行时日志
     */
    listenRuntimeLog(callback:(data:any)=>void){
        this.listenForPushData<any>(PushAction.onRuntimeLog,callback,null)
    }

    listenAssetAdded(callback:(data:any)=>void){
        this.listenForPushData<any>(PushAction.onAssetAdded,callback,null)
    }

    listenAssetRemoved(callback:(data:any)=>void){
        this.listenForPushData<any>(PushAction.onAssetRemoved,callback,null)
    }

    listenAssetRefCountChanged(callback:(data:any)=>void){
        this.listenForPushData<any>(PushAction.onAssetRefCountChanged,callback,null)
    }

    listenProfileInfo(callback:(data:any)=>void){
        this.listenForPushData<any>(PushAction.profileInfoUpdate,callback,null)
    }

    listenLoopFrameTime(callback:(data:any)=>void){
        this.listenForPushData<any>(PushAction.loopFrameTime,callback,null)
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
    private async _sendRequest<T>(action:string, data:any = null, type:string = 'request',timeout=5000) {
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
                    reject(new Error(`Request timed out:  ${payload.action}`));
                }
            }, timeout); // 5 秒超时
            
        });
    }

    async getRefCount(uuid:string) {
        await this.waitForRuntimeIsInline() //要先等plugin和runtime都连上服务器
        return this._sendRequest<number>('getRefCount', { uuid });
    }

    async getNodeInfo(uuid:string):Promise<InspectorInfo_Node> {
        await this.waitForRuntimeIsInline() //要先等plugin和runtime都连上服务器
        let info = await this._sendRequest('getNodeInfo', { uuid });
        if(info==null){
            return null
        }
        info = _funcs.roundNumbersToPrecision(info, 2)
        return info as any as InspectorInfo_Node
    }

    /**
     * 根据组件的uuid获取节点的uuid和节点名称
     * @param uuid 
     * @returns 
     */
    async getNodeOfComp(uuid:string) {
        await this.waitForRuntimeIsInline()
        let info = await this._sendRequest('getNodeOfComp', { uuid });
        return info as {
            /**所属节点的名字 */
            name:string,
            /**所属节点的uuid */
            uuid:string
        }
    }

    /**执行js并返回执行结果 */
    async evalJsInRuntime(str:string){
        await this.waitForRuntimeIsInline() //要先等plugin和runtime都连上服务器
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
    
    private _gameEnvObj:GameEnvParam = null
    async getGameEnv(bForce=false){
        if(this._gameEnvObj && !bForce){
            return this._gameEnvObj
        }
        await this.waitForRuntimeIsInline()
        this._gameEnvObj = await this._sendRequest("getGameEnv","")
        return this._gameEnvObj
    }

    async requestShowFPS(bool:boolean|string=""):Promise<boolean>{
        await this.waitForRuntimeIsInline()
        if(bool===true){
            bool = "true"
        }else if(bool===false){
            bool = "false"
        }else{
            bool = ""
        }
        return this._sendRequest("requestShowFPS",bool)
    }

    async requestDynamicAtlasEnable(bool:boolean|string=""):Promise<boolean>{
        await this.waitForRuntimeIsInline()
        if(bool===true){
            bool = "true"
        }else if(bool===false){
            bool = "false"
        }else{
            bool = ""
        }
        return this._sendRequest("requestDynamicAtlasEnable",bool)
    } 

    async getDynamicAtlasCount(){
        await this.waitForRuntimeIsInline()
        return this._sendRequest("getDynamicAtlasCount")
    }

    async getDynamicTextureData(index:number=0):Promise<TexDataInfo>{
        await this.waitForRuntimeIsInline()
        const time_1 = Date.now()
        let ret = await this._sendRequest("getDynamicTextureData",index,"request",60*1000) as any
        const time_2 = Date.now()
        if(ret==null){
            console.error("getDynamicTextureData 错误")
        }else{
            console.log("getDynamicTextureData 耗时",time_2-time_1)
        }
        
        return ret
    }

    async getDynamicTextureAndSavePng(index: number){
        let _time = Date.now()
        const num = await this.getDynamicAtlasCount()
        if(num==0){
            return ""
        }
        const obj = await this.getDynamicTextureData(index)
        const unit8arr = _utils.base64ToUint8Array(obj.base64Data);
        obj.buffer = unit8arr
        delete obj.base64Data
        const newObj = _utils.restoreCroppedImage(obj)

        const floderPath = `${_funcs.getCurPluginPath()}/cache/dynamic_texture`;
        await _funcs.ensureFloderExist(floderPath);
        let savePath = `${floderPath}/${index}_${Date.now()}.png`;
        _utils.saveUnit8ArrayPng(newObj.buffer, newObj.width, newObj.height, savePath);
        savePath = savePath.replace(/\\/g, "/");
        return {
            savePath,
            width:newObj.width,
            height:newObj.height,
        }
    }

    async getWitablePathFilesInfo():Promise<Array<WritableFileInfo>>{
        await this.waitForRuntimeIsInline()
        return this._sendRequest("getWitablePathFilesInfo")
    }

    /**
     * 获取可写目录下的文件的内容
     * @returns base64格式的数据
     **/
    async getWritableFileData(filePath):Promise<string>{
        await this.waitForRuntimeIsInline()
        return this._sendRequest("getWritableFileData",filePath)
    }

    /**
     * 获取引用某个资源的节点列表
     * @param uuid 
     * @returns 
     */
    async getAssetUsageInScene(uuid:string): Promise<Record<string,Array<string>>>{
        await this.waitForRuntimeIsInline()
        return this._sendRequest("getAssetUsageInScene",uuid)
    }

    /**
     * 获取引用某个资源的资源列表
     * @param uuid 
     * @returns 
     */
    async getAssetUsageInOtherAsset(uuid:string): Promise<Array<string>>{
        await this.waitForRuntimeIsInline()
        return this._sendRequest("getAssetUsageInOtherAsset",uuid)
    }

    /**
     * 获取某个资源直接依赖的资源列表
     * @param uuid 
     * @returns 
     */
    async getDependsOfAsset(uuid:string): Promise<Array<string>>{
        await this.waitForRuntimeIsInline()
        return this._sendRequest("getDependsOfAsset",uuid)
    }

    /**
     * 获取某个资源递归依赖的资源列表
     * @param uuid 
     * @returns 
     */
    async getRecursiveDependsOfAsset(uuid:string): Promise<Array<string>>{
        await this.waitForRuntimeIsInline()
        return this._sendRequest("getRecursiveDependsOfAsset",uuid)
    }

    /**
     * 获取某个节点直接依赖的资源列表
     * @param uuid 
     * @returns 
     */
    async getDependsOfNode(uuid:string): Promise<Array<string>>{
        await this.waitForRuntimeIsInline()
        return this._sendRequest("getDependsOfNode",uuid)
    }

    /**
     * 获取某个节点递归依赖的资源列表
     * @param uuid 
     * @returns 
     */
    async getRecursiveDependsOfNode(uuid:string): Promise<Array<string>>{
        await this.waitForRuntimeIsInline()
        return this._sendRequest("getRecursiveDependsOfNode",uuid)
    }

    /**获取Texture的纹理数据 */
    async getTextureData(uuid:string):Promise<TexDataInfo>{
        await this.waitForRuntimeIsInline()
        let ret = await this._sendRequest("getTextureData",uuid,"request",60*1000) as any
        return ret
    }

    /**
     * 根据texture2D的uuid，下载图片保存到本地
     * @param uuid 
     * @returns 
     */
    async saveTextureByUuid(uuid:string){
        const obj = await this.getTextureData(uuid)
        if(!obj){
            return
        }
        const unit8arr = _utils.base64ToUint8Array(obj.base64Data);
        obj.buffer = unit8arr
        delete obj.base64Data
        const newObj = _utils.restoreCroppedImage(obj)
        const floderPath = `${_funcs.getCurPluginPath()}/cache/textures`;
        await _funcs.ensureFloderExist(floderPath);
        let savePath = `${floderPath}/${uuid}}.png`;
        _utils.saveUnit8ArrayPng(newObj.buffer, newObj.width, newObj.height, savePath);
        savePath = savePath.replace(/\\/g, "/");
        return {
            savePath,
            width:newObj.width,
            height:newObj.height,
        }
    }

    /**
     * 校验激活码
     * @param activationCode 
     * @returns 
     */
    async doVerify(activationCode:string):Promise<VerifyRespParam>{
        await this.waitSocketOpen()
        let userInfo:Editor.User.UserData = await Editor.User.getData()

        let obj = {
            activationCode,
            cocos_uid:userInfo.cocos_uid,
            email:userInfo.email,
            nickname:userInfo.nickname,
            versionName:_funcs.getPluginVersionName(),
        }
        // console.log("------obj",obj)
        try{
            let ret = await this._sendRequest("VerifyActivationCode",obj,"request",30*1000) as any
            return ret
        }catch(e){
            console.error(e)
            return {statusCode:501,state:1,msg:"验证超时"} as any
        }
    }

    /**主动刷新节点树信息 */
    async updateNodeAndAssetInfo(){
        await this.waitForRuntimeIsInline()
        return this._sendRequest("updateNodeAndAssetInfo")
    }

    /**设置自动刷新节点树的时间间隔 */
    async setLoopInterval(time:number){
        await this.waitForRuntimeIsInline()
        return this._sendRequest("setLoopInterval",time)
    }

    clear(){
        this._gameEnvObj = null
        this._nodeLayers = null
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
    /**收到运行日志 */
    onRuntimeLog = "onRuntimeLog",

    /**资源被添加进 assetManager.assets */
    onAssetAdded = "onAssetAdded",
    /**资源从 assetManager.assets 删除 */
    onAssetRemoved = "onAssetRemoved",
    /**资源的uuid改变了 */
    onAssetRefCountChanged = "onAssetRefCountChanged",
    /**刷新drawcall等信息 */
    profileInfoUpdate = "profileInfoUpdate",
    /**按照定时器主动刷新节点树和资源树的操作的时间，相当于逻辑帧率一样的意义 */
    loopFrameTime = "loopFrameTime",

}

export const _pluginSocket = new PluginSocket();