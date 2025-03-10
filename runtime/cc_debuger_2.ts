const _cc_ = function(){
    return window["__cchyz"]
}

let _data:_RuntimeData = null;

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

class RunTimeSocket {
    private m_socket: WebSocket | null = null;
    private m_url:string = ""

    private m_isActive = false;
    public getIsActive(){
        return this.m_isActive
    }

    initSocket(url:string) {
        this.m_url = url;
        this.m_socket = new WebSocket(url);
        this.m_socket.onopen = () => {
            // console.log('[Runtime] Connected to server');
            this._send({ type: 'identify', role: 'runtime' ,name: _getSelfModelName()});

        };
        this.m_socket.onmessage = (event) => {
            try{
                const msg = JSON.parse(event.data);
                this._onMessage(msg);
            }catch(e){
                console.log("[cc_debuger_realtime] error",e)
            }
        };
        this.m_socket.onclose = this._onClose.bind(this)
        this.m_socket.onerror = this._onError.bind(this)
    }

    private _checkIsConnect(){
        if( this.m_socket && this.m_socket.readyState === WebSocket.OPEN){
            return true
        }
        return false
    }

    private _send(data: any) {
        try{
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
        }catch(e){
            console.log("[cc_debuger_realtime] error",e)
        }
    }
    private _spiltMsg:Record<number,Array<SplitMsg>> = {}
    private _onMessage(msg: OneMsg) {
        // log("cc_onMesage",JSON.stringify(msg))
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
        const responseData:OneMsg = { type: 'response', action: msg.action, data: null, requestId: msg.requestId };

        if(msg.type === 'request'){//表示是从插件发来的请求，需要进行回复
            let data:any = null;
            if(msg.action=="eval_js"){
                evalJsStr(msg.data).then((ret)=>{
                    responseData.data = ret
                    this._send(responseData);
                })
                return
            }
            if (msg.action === 'getRefCount') {
                const uuid = msg.data.uuid;
                data = _data.getRefCount(uuid)
            } else if (msg.action === 'getNodeInfo') {
                const uuid = msg.data.uuid;
                data = _data.getNodeInfo(uuid)
            } else if (msg.action === 'reqModifyNodeInfo') {
                data = _data.doModifyNodeInfo(msg.data)
            } else if (msg.action === 'fiterCompsWithType') {
                data = _data.fiterCompsWithType(msg.data)
            } else if (msg.action === 'getNodeOfComp') {
                const uuid = msg.data.uuid;
                data = _data.getNodeOfComp(uuid)
            } else if (msg.action === 'getGameEnv') {
                data = window["getGameEnv"]()
            } else if (msg.action === 'requestShowFPS') {
                let bool = msg.data
                if(bool=="true"){
                    _cc_().profiler.showStats()
                }else if(bool=="false"){
                    _cc_().profiler.hideStats()
                }
                data = _cc_().profiler.isShowingStats()
            } else if (msg.action === 'requestDynamicAtlasEnable') {
                let bool = msg.data
                if(bool=="true"){
                    _cc_().macro.CLEANUP_IMAGE_CACHE = false;
                    _cc_().DynamicAtlasManager.instance.enabled = true
                }else if(bool=="false"){
                    _cc_().DynamicAtlasManager.instance.enabled = false
                }
                data = _cc_().DynamicAtlasManager.instance.enabled
            } else if (msg.action === 'getDynamicAtlasCount') {
                const index = msg.data
                data = _cc_().DynamicAtlasManager.instance.atlasCount
            } else if (msg.action === 'getDynamicTextureData') {
                const index = msg.data
                data = getDynamicTextureData(index)
            } else if (msg.action === 'getTextureData') {
                const uuid = msg.data
                const _tex = _cc_().assetManager.assets.get(uuid)
                data = getTextureData(_tex)
            } else if (msg.action === 'getWitablePathFilesInfo') {
                data = getWitablePathFilesInfo()
            } else if (msg.action === 'getWritableFileData') {
                const filePath = msg.data
                data = getWritableFileData(filePath)
            } else if (msg.action === 'getAssetUsageInScene') {
                const uuid = msg.data;
                data = _data.getAssetUsageInScene(uuid)
            } else if (msg.action === 'getAssetUsageInOtherAsset') {
                const uuid = msg.data;
                data = _data.getAssetUsageInOtherAsset(uuid)
            } else if (msg.action === 'getDependsOfAsset') {
                const uuid = msg.data;
                data = _data.getDependsOfAsset(uuid)
            } else if (msg.action === 'getRecursiveDependsOfAsset') {
                const uuid = msg.data;
                data = _data.getRecursiveDependsOfAsset(uuid)
            } else if (msg.action === 'getDependsOfNode') {
                const uuid = msg.data;
                data = _data.getDependsOfNode(uuid)
            } else if (msg.action === 'getRecursiveDependsOfNode') {
                const uuid = msg.data;
                data = _data.getRecursiveDependsOfNode(uuid)
            }
    
            responseData.data = data
            this._send(responseData);
        }else if(msg.type === "push"){
            if (msg.action === 'markActive'){
                this.m_isActive = msg.data as boolean
                if(!this.m_isActive){
                    _data.clear()
                }else{
                    _data.checkPushAssetInfo()
                    _runtimeSocket.sendPush_checkUpdateSceneTree()
                }
                // console.log("this.m_isActive",this.m_isActive)
            }
        }
        
    }

    private _onClose(event:CloseEvent){
        // console.log('[Runtime] Disconnected from server');
        _data.clear()
        this.m_isActive = false

        const interval = 5 //5秒重试
        setTimeout(() => {
            if(this.m_socket!=null){
                this.m_socket.close()
                this.m_socket = null
            }
            this.initSocket(this.m_url)
        }, interval*1000);
    }
    
    private _onError(error){
        // console.error('[Runtime] WebSocket error:', error);
    }

    private _profileTimeAcc = 0
    loop(dt?:number){
        if(!this._checkIsConnect()){
            return
        }
        if(!this.m_isActive){
            return
        }

        if(dt!=null){
            this._profileTimeAcc+=dt;
            if(this._profileTimeAcc>=1000){
                this._profileTimeAcc = 0;
                this.sendPush_profile()
            }
        }

        this.sendPush_checkUpdateSceneTree()
        _data.checkPushAssetInfo()
    }

    public isReadyForPush(){
        if(!this._checkIsConnect()){
            return false
        }
        if(!this.m_isActive){
            return false
        }

        return true
    }

    private _sendPush(action,data){
        if(!this.isReadyForPush()){
            return false
        }
        this._send({ type: 'push', action, data });
        return true
    }

    sendPush_checkUpdateSceneTree(){
        if(!this.isReadyForPush()){
            return false
        }
        if(_data.searchNodeTree()){
            return this._sendPush( 'updateSceneTree', _data.m_sceneTree );
        }
    }

    sendPush_sceneLaunched(){
        return this._sendPush('sceneLaunched', "" );
    }

    sendPush_runtimeLog(obj){
        return this._sendPush( 'onRuntimeLog', obj);
    }
    
    /**资源引用计数改变 */
    sendPush_resRefCountChange(obj:Record<string,number>){
        return this._sendPush( 'onAssetRefCountChanged', obj);
    }

    /**资源添加进 _cc_().assetManager.assets */
    sendPush_resAdded(obj){
        return this._sendPush( 'onAssetAdded', obj);
    }

    /**资源从 _cc_().assetManager.assets 移出 */
    sendPush_resRemoveed(obj){
        return this._sendPush( 'onAssetRemoved', obj);
    }

    /**发送drawcall等信息 */
    sendPush_profile(){
        if(!_cc_().profiler.isShowingStats()){
            return
        }
        let stats = _cc_().profiler._stats
        if(stats){
            const keys = [
                'fps',
                'draws',
                'frame',
                'instances',
                'tricount',
                'logic',
                'physics',
                'render',
                'textureMemory',
                'bufferMemory',
            ]
            const arr:Array<{desc:string,value}> = []
            keys.forEach(key => {
                const data = stats[key];
                let value = null
                if (data.isInteger) {
                    value = data.counter._value | 0;
                } else {
                    value = data.counter._value.toFixed(2);
                }
                arr.push({desc:data.desc,value})
            });
            return this._sendPush( 'profileInfoUpdate', arr);
        }
    }
}



class _RuntimeData{
    
    /**已经销毁的资源 */
    public m_hasDestroyedResArr:Array<string> = []
    /**距离上次同步以来，有变化的资源 */
    public m_waitForPushResArr:Array<string> = []

    /**当前节点数 */
    public m_sceneTree: any/**NodeTreeItem */ = null;

    /**当前场景 */
    public m_curSceneName:string = ""
    /**记录当前节点的uuid映射 */
    public m_nodeUuidMap:Record<string,any/**import("cc").Node */> = {}
    /**记录当前所有组件实例的uuid映射 */
    public m_compUuidMap:Record<string,any/**import("cc").Component */> = {}

    /**记录已经发送过的组件属性（用于inspectorUI显示），避免重复发送 */
    public m_hasSendCompAttrsMap:Record<string,boolean> = {}

    constructor(){
        _cc_().director.on(_cc_().Director.EVENT_AFTER_SCENE_LAUNCH,this._onSceneChange,this)
    }

    doModifyNodeInfo(obj:any/**ChangedNodeInfo */){
        const _node = this.m_nodeUuidMap[obj.uuid]
        if(_node==null){
            return _cc_().js.formatStr("[ERROR] node is error,uuid:%s",obj.uuid)
        }
        try{
            let map:any/**NodeInfo */ = obj.nodeChange as any
            if(map){
                if(map.position!=null){
                    _node.setPosition(map.position.x??_node.position.x,map.position.y??_node.position.y,map.position.z??_node.position.z)
                }
                if(map.rotation!=null){
                    _node.setRotation(map.rotation.x??_node.rotation.x,map.rotation.y??_node.rotation.y,map.rotation.z??_node.rotation.z,map.rotation.w??_node.rotation.w)
                }
                if(map.scale!=null){
                    _node.setScale(map.scale.x??_node.scale.x,map.scale.y??_node.scale.y,map.scale.z??_node.scale.z)
                }
                if(map.active!=null){
                    _node.active = map.active
                    _runtimeSocket?.loop()
                }
                if(map.layer!=null){
                    _node.layer = map.layer
                }
                if(map.name!=null){
                    _node.name = map.name
                    _runtimeSocket?.loop()
                }
            }
        }catch(e){
            return e.message
        }
            

        //@ts-ignore
        const components:any/**cc.Component*/[] = _node._components;
        try{
            for(let compUuid in obj.compChanges){
                const _comp = components.find(item => item.uuid==compUuid)
                if(_comp==null){
                    continue
                }
                let map = obj.compChanges[compUuid]
                
                this.applyCompChange(_comp,map)
            }
        }catch(e){
            return e.message
        }
        
        return ""
    }

    async applyCompChange(_comp:any/**import("cc").Component */,map:Record<string,any>){
        for(let key in map){
            const oldV = _comp[key]
            let newV = map[key]
            if(newV &&typeof newV=="string"){//如果是字符串，先检查一下是否是uuid
                if(this.m_compUuidMap[newV]!=null){
                    _comp[key] = this.m_compUuidMap[newV]
                    continue
                }else if(this.m_nodeUuidMap[newV]!=null){
                    _comp[key] = this.m_nodeUuidMap[newV]
                    continue
                }else{
                    //0bbc4349-d0e6-4676-b353-6a0d4108b6dd
                    if(newV[8]=="-"&&newV[13]=="-"&&newV[18]=="-"&&newV[23]=="-"){
                        let asset = await new Promise<any/**import("cc").Asset */>((resolve)=>{
                            _cc_().assetManager.loadAny({uuid:newV},(err,asset)=>{
                                resolve(asset)
                            })
                        })
                        if(asset){
                            _comp[key] = asset
                            continue
                        }
                    }
                }
            }
            if(oldV==null){
                _comp[key] = newV
            }else if(typeof oldV === "object"){
                let _newV = null
                if(oldV instanceof _cc_().Node || oldV instanceof _cc_().Asset || oldV instanceof _cc_().Component){
                    _comp[key] = null //不为null的情况，上面已经检查过了
                    continue
                }else {
                    if(oldV instanceof _cc_().Color){
                        _newV = _cc_().color().fromHEX(newV)
                    }else if(oldV instanceof _cc_().Size){
                        _newV = new (_cc_()).Size(newV.width??oldV.width,newV.height??oldV.height)
                    }else if(oldV instanceof _cc_().Vec2){
                        _newV = new (_cc_()).Vec2(newV.x??oldV.x,newV.y??oldV.y)
                    }else if(oldV instanceof _cc_().Vec3){
                        _newV = new (_cc_()).Vec3(newV.x??oldV.x,newV.y??oldV.y,newV.z??oldV.z)
                    }else if(oldV instanceof _cc_().Vec4){
                        _newV = new (_cc_()).Vec4(newV.x??oldV.x,newV.y??oldV.y,newV.z??oldV.z,newV.w??oldV.w)
                    }else if(oldV instanceof _cc_().Quat){
                        _newV = new (_cc_()).Quat(newV.x??oldV.x,newV.y??oldV.y,newV.z??oldV.z,newV.w??oldV.w)
                    }else if(oldV instanceof _cc_().Rect){
                        _newV = new (_cc_()).Rect(newV.x??oldV.x,newV.y??oldV.y,newV.width??oldV.width,newV.height??oldV.height)
                    }
                }

                if(_newV!=null){
                    _comp[key] = _newV
                    continue
                }
            }
            if(typeof newV === "object"){
                this.applyCompChange(oldV,newV)
            }else{
                _comp[key] = newV
            }
        }
    }

    fiterCompsWithType(typeStr:any/**CompType */){
        const ret:Array<{uuid:string,nodeUuid:string}> = []
        for(let uuid in this.m_compUuidMap){
            const comp = this.m_compUuidMap[uuid]
            if(comp["__proto__"]["__classname__"] === typeStr){
                ret.push({uuid,nodeUuid:comp.node.uuid})
            }
        }
        return ret

    }

    getNodeOfComp(uuid:string){
        const comp = this.m_compUuidMap[uuid]
        if(comp){
            return {name:comp.node.name,uuid:comp.node.uuid}
        }
        return {name:"",uuid:""}
    }

    clear(){
        this.m_hasDestroyedResArr = []
        this.initAssetForPush()

        this.m_sceneTree = null
        this.m_nodeUuidMap = {}
        this.m_compUuidMap = {}
        this.m_curSceneName = ""
        this.m_hasSendCompAttrsMap = {}
    }

    /**从assetManager.assets初始化需要同步的资源 */
    public initAssetForPush(){
        this.m_waitForPushResArr = []

        _cc_().assetManager.assets.forEach((asset,uuid)=>{
            this.m_waitForPushResArr.push(uuid)
        })
    }

    private _onSceneChange(sceneNode:any/**import("cc").Scene */){
        this.m_curSceneName = sceneNode.name

    }

    /**
     * 获取资源的使用情况,-1表示资源没有被加载
     * @param uuid 
     */
    getRefCount(uuid:string){
        const asset = _cc_().assetManager.assets.get(uuid);
        if(asset){
            return asset.refCount
        }
        return -1
    }

    private _checkRecordResMemInfo(uuid:string,asset?:any/**import("cc").Asset */){
        // if(uuid.length==9||uuid.length==15){
        //     //@ts-ignore
        //     const _name = asset?.__proto__?.__classname__
        // }
        if(uuid==null){
            return
        }
        if(this.m_waitForPushResArr.indexOf(uuid)<0){
            this.m_waitForPushResArr.push(uuid)
        }
    }

    /**
     * 资源被添加进 _cc_().assetManager.assets
     */
    onAsset_added(key:string,asset:any/**import("cc").Asset */){
        this._checkRecordResMemInfo(key,asset)

        // this.checkPushAssetInfo()
    }
    /**
     * 资源被添加进 _cc_().assetManager.assets
     */
    onAsset_removed(key:string){
        this.m_hasDestroyedResArr.push(key)
        
    }

    checkPushAssetInfo(){
        if(!_runtimeSocket.isReadyForPush()){
            return
        }
        if(this.m_waitForPushResArr?.length>0){
            let arr = []
            let fails = []
            for(let uuid of this.m_waitForPushResArr){
                const asset = _cc_().assetManager.assets.get(uuid)
                if(asset==null){
                    fails.push(uuid)
                    continue
                }
                //@ts-ignore
                const classname = asset.__proto__.__classname__
                const obj:any/**ResMemInfo */ = {
                    uuid,
                    classname,
                    refCount:asset.refCount,
                    memory : _getResMemory(asset),
                }
                
                if(asset instanceof _cc_().ImageAsset){
                    obj.width = asset.width
                    obj.height = asset.height
                    if(uuid.length==9){
                        obj.isAutoPackImg = true
                        obj.imgSrc = _getImageAssetUrl(asset)
                        if(_cc_().sys.isBrowser){
                            obj.isUrlImg = true
                        }else if(_cc_().sys.isNative){
                            obj.isNativeImg = true
                        }
                    }
                }else if(asset instanceof _cc_().Texture2D){
                    obj.width = asset.width
                    obj.height = asset.height
                    obj.imageUuid = asset.image?.uuid??asset.image?._uuid
                    if(uuid.length==15){
                        //@ts-ignore
                        obj.imgSrc = _getImageAssetUrl(asset.image)
                        obj.isAutoPackImg = true
                        if(_cc_().sys.isBrowser){
                            obj.isUrlImg = true
                        }else if(_cc_().sys.isNative){
                            obj.isNativeImg = true
                        }
                    }
                }else if(asset instanceof _cc_().SpriteFrame){
                    if(asset.texture){
                        obj.width = asset.originalSize.width
                        obj.height = asset.originalSize.height
                        obj.textureUuid = asset.texture?.uuid??asset.texture?._uuid
                        if(obj.textureUuid?.length==15){
                            obj.isAutoPackImg = true
                        }
                    }
                }
                arr.push(obj)
            }
            
            if(_runtimeSocket.sendPush_resAdded(arr)){
                this.m_waitForPushResArr = fails
            }
        }
    }

    onRes_addRef(asset:any/**import("cc").Asset */){
        this._checkRecordResMemInfo(asset.uuid??asset._uuid,asset)

        // this.checkPushAssetInfo()
    }

    onRes_decRef(asset:any/**import("cc").Asset */){
        this._checkRecordResMemInfo(asset.uuid??asset._uuid,asset)

        // this.checkPushAssetInfo()
    }

    onRes_destroy(asset:any/**import("cc").Asset */){
        
    }

    /**
     * 获取指定资源正在被多少个节点的相关组件使用
     * @param uuid 要检查的资源 (例如 _cc_().SpriteFrame)
     * @returns 所有引用该资源的节点和组件的uuid
     */
    getAssetUsageInScene(uuid: string): Record<string,Array<string>> {
        const _asset = _cc_().assetManager.assets.get(uuid);

        if (_asset == null) {
            console.error(`_cc_().Asset with UUID ${uuid} not found.`);
            return {};
        }

        const scene = _cc_().director.getScene(); // 获取当前场景
        if (!scene) {
            console.error('No active scene found.');
            return {};
        }

        const ret: Record<string,Array<string>> = {};//key为node.uuid，值为 comps.uuid[]

        // 遍历场景中的所有节点
        const preFunc = (node: any/**import("cc").Node */) => {
            let uuidsOfComp:Array<string> = []
            const _comps = node.components as any[]
            for(let comp of _comps){
                if(comp instanceof _cc_().UIRenderer){
                    if(comp.customMaterial==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }
                if(comp instanceof _cc_().Sprite){
                    if(comp.spriteFrame==_asset||comp.spriteAtlas==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof _cc_().Label){
                    if(comp.font==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof _cc_().EditBox){
                    if(comp.backgroundImage==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof _cc_().Mask){
                    if(comp.spriteFrame==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof _cc_().Camera){
                    if(comp.targetTexture==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof _cc_().ParticleSystem2D){
                    if(comp.file==_asset||comp.spriteFrame==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof _cc_().sp.Skeleton){
                    if(comp.skeletonData==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof _cc_().dragonBones.ArmatureDisplay){
                    if(comp.dragonAsset==_asset||comp.dragonAtlasAsset==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof _cc_().RichText){
                    if(comp.imageAtlas==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof _cc_().TiledMap){
                    if(comp.tmxAsset==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof _cc_().VideoPlayer){
                    if(comp.clip==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof _cc_().AudioSource){
                    if(comp.clip==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else{
                    //这些是确定不会引用任何资源的组件，直接跳过
                    if(comp instanceof _cc_().Widget||comp instanceof _cc_().Layout||comp instanceof _cc_().UIOpacity||comp instanceof _cc_().Button
                        ||comp instanceof _cc_().PageView||comp instanceof _cc_().ScrollView||comp instanceof _cc_().ProgressBar||comp instanceof _cc_().Graphics
                        ||comp instanceof _cc_().ScrollBar||comp instanceof _cc_().Slider||comp instanceof _cc_().ToggleContainer||comp instanceof _cc_().Toggle
                        ||comp instanceof _cc_().ViewGroup||comp instanceof _cc_().SafeArea||comp instanceof _cc_().BlockInputEvents||comp instanceof _cc_().LabelOutline
                        ||comp instanceof _cc_().LabelShadow||comp instanceof _cc_().LabelShadow
                    ){
                        continue
                    }else{
                        const _keys = Object.keys(comp)
                        for(let k of _keys){
                            if(typeof comp[k]=="object" && comp[k]===_asset){
                                uuidsOfComp.push(comp.uuid)
                                break
                            }
                        }
                    }
                }
                
            }
            if(uuidsOfComp.length>0){
                ret[node.uuid] = uuidsOfComp
            }
        }
        scene.walk(preFunc);

        return ret;
    }

    /**
     * 获取指定资源正在被多少个其他资源引用
     * @param uuid 要检查的资源 (例如 _cc_().SpriteFrame)
     * @returns 所有引用该资源的其他资源的uuid
     */
    getAssetUsageInOtherAsset(uuid:string){
        let ret = []
        _cc_().assetManager.assets.forEach((asset,key)=>{
            const deps = _cc_().assetManager.dependUtil.getDeps(key)
            if(deps.indexOf(uuid)>=0){
                ret.push(key)
            }
        })
        return ret
    }

    /**
     * 获取某个资源直接依赖的资源列表
     */
    getDependsOfAsset(uuid:string){
        const deps = _cc_().assetManager.dependUtil.getDeps(uuid)
        return deps
    }

    /**
     * 获取某个资源递归依赖的资源列表
     */
    getRecursiveDependsOfAsset(uuid:string){
        const deps = _cc_().assetManager.dependUtil.getDepsRecursively(uuid)
        return deps
    }

    /**
     * 获取某个节点直接依赖的资源列表
     * @param uuid 
     * @returns 
     */
    getDependsOfNode(uuid:string){
        const _node = this.m_nodeUuidMap[uuid]
        const _comps = _node.components as any[]

        const _uuids = []
        for(let comp of _comps){
            if(comp instanceof _cc_().UIRenderer){
                if(comp.customMaterial){
                    _uuids.push(comp.customMaterial.uuid)
                }
            }
            if(comp instanceof _cc_().Sprite){
                if(comp.spriteAtlas){
                    _uuids.push(comp.spriteAtlas.uuid)
                }
                if(comp.spriteFrame){
                    _uuids.push(comp.spriteFrame.uuid)
                }
            }else if(comp instanceof _cc_().Label){
                if(comp.font){
                    _uuids.push(comp.font.uuid)
                }
            }else if(comp instanceof _cc_().EditBox){
                if(comp.backgroundImage){
                    _uuids.push(comp.backgroundImage.uuid)
                }
            }else if(comp instanceof _cc_().Mask){
                if(comp.spriteFrame){
                    _uuids.push(comp.spriteFrame.uuid)
                }
            }else if(comp instanceof _cc_().Camera){
                if(comp.targetTexture){
                    _uuids.push(comp.targetTexture.uuid)
                }
            }else if(comp instanceof _cc_().ParticleSystem2D){
                if(comp.file){
                    _uuids.push(comp.file.uuid)
                }
                if(comp.spriteFrame){
                    _uuids.push(comp.spriteFrame.uuid)
                }
            }else if(comp instanceof _cc_().sp.Skeleton){
                if(comp.skeletonData){
                    _uuids.push(comp.skeletonData.uuid)
                }
            }else if(comp instanceof _cc_().dragonBones.ArmatureDisplay){
                if(comp.dragonAsset){
                    _uuids.push(comp.dragonAsset.uuid)
                }
                if(comp.dragonAtlasAsset){
                    _uuids.push(comp.dragonAtlasAsset.uuid)
                }
            }else if(comp instanceof _cc_().RichText){
                if(comp.imageAtlas){
                    _uuids.push(comp.imageAtlas.uuid)
                }
            }else if(comp instanceof _cc_().TiledMap){
                if(comp.tmxAsset){
                    _uuids.push(comp.tmxAsset.uuid)
                }
            }else if(comp instanceof _cc_().VideoPlayer){
                if(comp.clip){
                    _uuids.push(comp.clip.uuid)
                }
            }else if(comp instanceof _cc_().AudioSource){
                if(comp.clip){
                    _uuids.push(comp.clip.uuid)
                }
            }else{
                //这些是确定不会引用任何资源的组件，直接跳过
                if(comp instanceof _cc_().Widget||comp instanceof _cc_().Layout||comp instanceof _cc_().UIOpacity||comp instanceof _cc_().Button
                    ||comp instanceof _cc_().PageView||comp instanceof _cc_().ScrollView||comp instanceof _cc_().ProgressBar||comp instanceof _cc_().Graphics
                    ||comp instanceof _cc_().ScrollBar||comp instanceof _cc_().Slider||comp instanceof _cc_().ToggleContainer||comp instanceof _cc_().Toggle
                    ||comp instanceof _cc_().ViewGroup||comp instanceof _cc_().SafeArea||comp instanceof _cc_().BlockInputEvents||comp instanceof _cc_().LabelOutline
                    ||comp instanceof _cc_().LabelShadow||comp instanceof _cc_().LabelShadow
                ){
                    continue
                }else{
                    const _keys = Object.keys(comp)
                    for(let k of _keys){
                        if(typeof comp[k]=="object" && comp[k] instanceof _cc_().Asset){
                            _uuids.push(comp[k].uuid)
                        }
                    }
                }
            }
            
        }

        return _uuids
    }

    /**
     * 获取某个节点递归依赖的资源列表
     * @param uuid 
     * @returns 
     */
    getRecursiveDependsOfNode(uuid:string){
        let ret = []
        const _node = this.m_nodeUuidMap[uuid]
        ret.push(...this.getDependsOfNode(_node.uuid))
        const preFunc = (node: any/**import("cc").Node */)=>{
            ret.push(...this.getDependsOfNode(node.uuid))
        }
        _node.walk(preFunc)
        ret = Array.from(new Set(ret))
        return ret
    }

    private _fillNodeTree(treeObj: any/**NodeTreeItem */, children: Array<any/**import("cc").Node */>, parentPath: string = '') {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const childPath = parentPath?`${parentPath}/${child.name}`:child.name;
            const childTree: any/**NodeTreeItem */ = {
                name: child.name,
                uuid: child?.uuid??"",
                children: [],
                active: child.active,
                activeInHierarchy: child.activeInHierarchy,
                parentUuid: child.parent?.uuid??"",
                path: childPath
            }
            this.m_nodeUuidMap[child.uuid] = child;
            //@ts-ignore
            child._components.forEach( (comp) =>{
                this.m_compUuidMap[comp.uuid] = comp
            })
            this._fillNodeTree(childTree, child.children, childPath);
            treeObj.children.push(childTree);

        }
    }
    
    private _compareNodeTrees(tree1: any/**NodeTreeItem */, tree2: any/**NodeTreeItem */): boolean {
        if (tree1.uuid !== tree2.uuid || tree1.name !== tree2.name || 
            tree1.children.length !== tree2.children.length || 
            tree1.activeInHierarchy !== tree2.activeInHierarchy) {
            return false;
        }
        for (let i = 0; i < tree1.children.length; i++) {
            if (!this._compareNodeTrees(tree1.children[i], tree2.children[i])) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * 搜索当前场景的节点树
     * @returns 是否与上次搜索结果不同
     */
    public searchNodeTree(): boolean {
        this.m_nodeUuidMap = {}
        this.m_compUuidMap = {}

        const lastSceneTree = this.m_sceneTree;
        const sceneNode: any/**import("cc").Scene */ = _cc_().director.getScene();
        this.m_sceneTree = {
            name: sceneNode.name,
            uuid: sceneNode?.uuid??"",
            children: [],
            active: true,
            activeInHierarchy: true,
            parentUuid: "",
            path: "",
            isSceneNode: true,
        }
        this._fillNodeTree(this.m_sceneTree, sceneNode.children);
        
        this.m_nodeUuidMap[this.m_sceneTree.uuid] = sceneNode;
        if (lastSceneTree === null) {
            return true;
        }
    
        return !this._compareNodeTrees(lastSceneTree, this.m_sceneTree);
    }

    getNodeInfo(uuid:string){
        const node = this.m_nodeUuidMap[uuid]
        const nodeInfo:any/**InspectorInfo_Node */ = {
            uuid: node?.uuid??"",
            active: node.active,
            name: node.name,
            position: node.position,
            rotation: node.rotation,
            scale: node.scale,
            layer: node.layer,
            components: this._getComponentsInfo(node)
        };
        return nodeInfo
    }

    private _getComponentsInfo(node: any/**import("cc").Node */) {
        const componentsInfo:Array<any/**CompInfo_Base */> = [];
        const components = node.components;

        for (const component of components) {
            const info = this._getComponentProperties(component)
            componentsInfo.push(info);
        }

        return componentsInfo;
    }

    private _getComponentProperties(component: any/**import("cc").Component */):any/**CompInfo_Base */ {
        const clsPrototype = component["__proto__"]
        const clsName = clsPrototype.__classname__
        if(clsName=="cc.MeshRenderer"){
            let g = 0;
        }
        let map = getCompAttrInfoFromCfg(clsName)
        if(map==null){
            map = getAttrInfosOfComponentInst(component)
        }
        let data = {}
        for(let k in map){
            const obj = map[k]
            let val = component[k]
            if(obj.type=="cc.Node"||obj.type=="cc.Component"||obj.type=="cc.Asset"){
                val = val?.uuid??""
            }else if(obj.type=="cc.Color"){
                val = val.toHEX()
            }else if(obj.type=="cc.Size"){
                val = {
                    width:val.width,
                    height:val.height,
                }
            }else if(obj.type=="cc.Vec2"||obj.type=="cc.Vec3"||obj.type=="cc.Vec4"){
                val = {
                    x:val.x,
                    y:val.y,
                    z:val.z,
                    w:val.w,
                }
            }else if(obj.type=="cc.Rect"){
                val = {
                    x:val.x,
                    y:val.y,
                    width:val.width,
                    height:val.height,
                }
            }else if(obj.ctor=="cc.ClickEvent"){
                val = component[k].map((item:any/**import("cc").EventHandler */)=>JSON.stringify({node:item?.target?.uuid,comp:item?._componentId,handler:item?.handler}))
            }else{
                if(obj.ctor=="cc.ModelBakeSettings"){
                    let g = 0;
                }
                
                if(typeof val=="object"){
                    let newVal = {} as any
                    Object.keys(val).forEach((kk)=>{
                        const _t = typeof val[kk]
                        if(_t=="object"){
                            //避免
                        }else if(_t=="function"){

                        }else{
                            newVal[kk] = val[kk]
                        }
                    })
                    val = newVal
                }
            }
            data[k] = val
        }
        if(clsName === "cc.UITransform"){//因为UITransform比较特殊，contentSize和anchorPoint都是readonly的，实际是通过width、height/anchorX、anchorY修改的
            const comp = component as any/**import("cc").UITransform */
            data = {
                anchorX:comp.anchorX,
                anchorY:comp.anchorY,
                width:comp.width,
                height:comp.height,
            }
        }else if(clsName === "sp.Skeleton"){
            data["animationArr"] = component["_skeleton"].data.animations.map((item)=>item.name)
            data["skinArr"] = component["_skeleton"].data.skins.map((item)=>item.name)
            data["_defaultSkinIndex"] = component["_defaultSkinIndex"]
            data["animation"] = component["animation"]
        }

        const ret = {
            enabled:component.enabled,
            typeStr:clsName,
            uuid:component?.uuid??"",

            ...data
        } 

        if(!this.m_hasSendCompAttrsMap[clsName]){
            ret["__attrMap"] = map
            this.m_hasSendCompAttrsMap[clsName] = true
        }
        return ret 

    }
}

let compAttrMaps = null
function getCompAttrInfoFromCfg(clsName:string){
    if(compAttrMaps==null){
        const mapStr = `
            {"cc.Button":{"target":{"displayOrder":0,"type":"cc.Node","ctor":"cc.Node","tooltip":"i18n:ENGINE.button.target"},"interactable":{"displayOrder":1,"tooltip":"i18n:ENGINE.button.interactable","type":"boolean"},"transition":{"displayOrder":2,"type":"Enum","tooltip":"i18n:ENGINE.button.transition","enumList":[{"name":"NONE","value":0},{"name":"COLOR","value":1},{"name":"SPRITE","value":2},{"name":"SCALE","value":3}]},"normalColor":{"displayOrder":3,"tooltip":"i18n:ENGINE.button.normal_color","type":"cc.Color"},"pressedColor":{"displayOrder":3,"tooltip":"i18n:ENGINE.button.pressed_color","type":"cc.Color"},"hoverColor":{"displayOrder":3,"tooltip":"i18n:ENGINE.button.hover_color","type":"cc.Color"},"disabledColor":{"displayOrder":3,"tooltip":"i18n:ENGINE.button.disabled_color","type":"cc.Color"},"duration":{"displayOrder":4,"tooltip":"i18n:ENGINE.button.duration","min":0,"max":10,"type":"number"},"zoomScale":{"displayOrder":3,"tooltip":"i18n:ENGINE.button.zoom_scale","type":"number"},"normalSprite":{"displayOrder":3,"type":"cc.Asset","ctor":"cc.SpriteFrame","tooltip":"i18n:ENGINE.button.normal_sprite"},"pressedSprite":{"displayOrder":3,"type":"cc.Asset","ctor":"cc.SpriteFrame","tooltip":"i18n:ENGINE.button.pressed_sprite"},"hoverSprite":{"displayOrder":3,"type":"cc.Asset","ctor":"cc.SpriteFrame","tooltip":"i18n:ENGINE.button.hover_sprite"},"disabledSprite":{"displayOrder":3,"type":"cc.Asset","ctor":"cc.SpriteFrame","tooltip":"i18n:ENGINE.button.disabled_sprite"},"clickEvents":{"displayOrder":20,"type":"Object","ctor":"cc.ClickEvent","tooltip":"i18n:ENGINE.button.click_events"}},"cc.ScrollView":{"bounceDuration":{"displayOrder":5,"type":"number","default":1,"tooltip":"i18n:ENGINE.scrollview.bounceDuration","min":0,"max":10},"brake":{"displayOrder":3,"type":"number","default":0.5,"tooltip":"i18n:ENGINE.scrollview.brake","min":0,"max":1,"step":0.1},"elastic":{"displayOrder":3,"type":"boolean","default":true,"tooltip":"i18n:ENGINE.scrollview.elastic"},"inertia":{"displayOrder":2,"type":"boolean","default":true,"tooltip":"i18n:ENGINE.scrollview.inertia"},"content":{"displayOrder":5,"type":"cc.Node","ctor":"cc.Node","tooltip":"i18n:ENGINE.scrollview.content"},"sizeMode":{"type":"Enum","tooltip":"i18n:ENGINE.pageview.sizeMode","enumList":[{"name":"Unified","value":0},{"name":"Free","value":1}]},"direction":{"type":"Enum","tooltip":"i18n:ENGINE.pageview.direction","enumList":[{"name":"Horizontal","value":0},{"name":"Vertical","value":1}]},"scrollThreshold":{"tooltip":"i18n:ENGINE.pageview.scrollThreshold","min":0,"max":1,"step":0.01,"slide":true,"type":"number"},"pageTurningEventTiming":{"tooltip":"i18n:ENGINE.pageview.pageTurningEventTiming","min":0,"max":1,"step":0.01,"slide":true,"type":"number"},"indicator":{"type":"cc.Component","ctor":"cc.PageViewIndicator","tooltip":"i18n:ENGINE.pageview.indicator"},"autoPageTurningThreshold":{"type":"number","default":100,"tooltip":"i18n:ENGINE.pageview.autoPageTurningThreshold"},"pageTurningSpeed":{"type":"number","default":0.3,"tooltip":"i18n:ENGINE.pageview.pageTurningSpeed"},"pageEvents":{"type":"Object","ctor":"cc.ClickEvent","tooltip":"i18n:ENGINE.pageview.pageEvents"}},"cc.Widget":{"target":{"type":"cc.Node","ctor":"cc.Node","tooltip":"i18n:ENGINE.widget.target"},"isAlignTop":{"tooltip":"i18n:ENGINE.widget.align_top","type":"boolean"},"isAlignBottom":{"tooltip":"i18n:ENGINE.widget.align_bottom","type":"boolean"},"isAlignLeft":{"tooltip":"i18n:ENGINE.widget.align_left","type":"boolean"},"isAlignRight":{"tooltip":"i18n:ENGINE.widget.align_right","type":"boolean"},"isAlignVerticalCenter":{"tooltip":"i18n:ENGINE.widget.align_h_center","type":"boolean"},"isAlignHorizontalCenter":{"tooltip":"i18n:ENGINE.widget.align_v_center","type":"boolean"},"top":{"tooltip":"i18n:ENGINE.widget.top","type":"number"},"editorTop":{"type":"number"},"bottom":{"tooltip":"i18n:ENGINE.widget.bottom","type":"number"},"editorBottom":{"type":"number"},"left":{"tooltip":"i18n:ENGINE.widget.left","type":"number"},"editorLeft":{"type":"number"},"right":{"tooltip":"i18n:ENGINE.widget.right","type":"number"},"editorRight":{"type":"number"},"horizontalCenter":{"tooltip":"i18n:ENGINE.widget.horizontal_center","type":"number"},"editorHorizontalCenter":{"type":"number"},"verticalCenter":{"tooltip":"i18n:ENGINE.widget.vertical_center","type":"number"},"editorVerticalCenter":{"type":"number"},"isAbsoluteTop":{"type":"boolean"},"isAbsoluteBottom":{"type":"boolean"},"isAbsoluteLeft":{"type":"boolean"},"isAbsoluteRight":{"type":"boolean"},"isAbsoluteHorizontalCenter":{"type":"boolean"},"isAbsoluteVerticalCenter":{"type":"boolean"},"alignMode":{"type":"Enum","tooltip":"i18n:ENGINE.widget.align_mode","enumList":[{"name":"ONCE","value":0},{"name":"ALWAYS","value":1},{"name":"ON_WINDOW_RESIZE","value":2}]},"alignFlags":{"type":"number"}},"cc.Mask":{"type":{"type":"Enum","tooltip":"i18n:ENGINE.mask.type","enumList":[{"name":"GRAPHICS_RECT","value":0},{"name":"GRAPHICS_ELLIPSE","value":1},{"name":"GRAPHICS_STENCIL","value":2},{"name":"SPRITE_STENCIL","value":3}]},"inverted":{"displayOrder":14,"tooltip":"i18n:ENGINE.mask.inverted","type":"boolean"},"segments":{"visible":"function () {\\n        return this.type === MaskType.GRAPHICS_ELLIPSE;\\n      }","type":"number"},"alphaThreshold":{"min":0,"max":1,"step":0.1,"slide":true,"visible":"function () {\\n        return this.type === MaskType.SPRITE_STENCIL;\\n      }","type":"number"}},"cc.Sprite":{"customMaterial":{"displayOrder":0,"displayName":"CustomMaterial","type":"cc.Asset","ctor":"cc.Material","tooltip":"i18n:ENGINE.UIRenderer.customMaterial"},"color":{"displayOrder":1,"tooltip":"i18n:ENGINE.UIRenderer.color","type":"cc.Color"},"spriteAtlas":{"displayOrder":4,"type":"cc.Asset","ctor":"cc.SpriteAtlas","tooltip":"i18n:ENGINE.sprite.atlas"},"spriteFrame":{"displayOrder":5,"type":"cc.Asset","ctor":"cc.SpriteFrame","tooltip":"i18n:ENGINE.sprite.sprite_frame"},"type":{"displayOrder":6,"type":"Enum","tooltip":"i18n:ENGINE.sprite.type","enumList":[{"name":"SIMPLE","value":0},{"name":"SLICED","value":1},{"name":"TILED","value":2},{"name":"FILLED","value":3}]},"fillType":{"displayOrder":6,"type":"Enum","tooltip":"i18n:ENGINE.sprite.fill_type","enumList":[{"name":"HORIZONTAL","value":0},{"name":"VERTICAL","value":1},{"name":"RADIAL","value":2}]},"fillCenter":{"displayOrder":6,"tooltip":"i18n:ENGINE.sprite.fill_center","type":"cc.Vec2"},"fillStart":{"displayOrder":6,"tooltip":"i18n:ENGINE.sprite.fill_start","min":0,"max":1,"step":0.1,"type":"number"},"fillRange":{"displayOrder":6,"tooltip":"i18n:ENGINE.sprite.fill_range","min":-1,"max":1,"step":0.1,"type":"number"},"trim":{"displayOrder":8,"tooltip":"i18n:ENGINE.sprite.trim","visible":"function () {\\n        return this.type === SpriteType.SIMPLE;\\n      }","type":"boolean"},"grayscale":{"displayOrder":5,"tooltip":"i18n:ENGINE.sprite.gray_scale","type":"boolean"},"sizeMode":{"displayOrder":5,"type":"Enum","tooltip":"i18n:ENGINE.sprite.size_mode","enumList":[{"name":"CUSTOM","value":0},{"name":"TRIMMED","value":1},{"name":"RAW","value":2}]}},"cc.MissingScript":{},"cc.Renderer":{"customMaterial":{"displayOrder":0,"displayName":"CustomMaterial","type":"cc.Asset","ctor":"cc.Material","tooltip":"i18n:ENGINE.UIRenderer.customMaterial"},"color":{"displayOrder":1,"tooltip":"i18n:ENGINE.UIRenderer.color","type":"cc.Color"},"spriteAtlas":{"displayOrder":4,"type":"cc.Asset","ctor":"cc.SpriteAtlas","tooltip":"i18n:ENGINE.sprite.atlas"},"spriteFrame":{"displayOrder":5,"type":"cc.Asset","ctor":"cc.SpriteFrame","tooltip":"i18n:ENGINE.sprite.sprite_frame"},"type":{"displayOrder":6,"type":"Enum","tooltip":"i18n:ENGINE.sprite.type","enumList":[{"name":"SIMPLE","value":0},{"name":"SLICED","value":1},{"name":"TILED","value":2},{"name":"FILLED","value":3}]},"fillType":{"displayOrder":6,"type":"Enum","tooltip":"i18n:ENGINE.sprite.fill_type","enumList":[{"name":"HORIZONTAL","value":0},{"name":"VERTICAL","value":1},{"name":"RADIAL","value":2}]},"fillCenter":{"displayOrder":6,"tooltip":"i18n:ENGINE.sprite.fill_center","type":"cc.Vec2"},"fillStart":{"displayOrder":6,"tooltip":"i18n:ENGINE.sprite.fill_start","min":0,"max":1,"step":0.1,"type":"number"},"fillRange":{"displayOrder":6,"tooltip":"i18n:ENGINE.sprite.fill_range","min":-1,"max":1,"step":0.1,"type":"number"},"trim":{"displayOrder":8,"tooltip":"i18n:ENGINE.sprite.trim","visible":"function () {\\n        return this.type === SpriteType.SIMPLE;\\n      }","type":"boolean"},"grayscale":{"displayOrder":5,"tooltip":"i18n:ENGINE.sprite.gray_scale","type":"boolean"},"sizeMode":{"displayOrder":5,"type":"Enum","tooltip":"i18n:ENGINE.sprite.size_mode","enumList":[{"name":"CUSTOM","value":0},{"name":"TRIMMED","value":1},{"name":"RAW","value":2}]}},"cc.ModelRenderer":{"sharedMaterials":{"displayOrder":0,"displayName":"Materials","type":"cc.Asset","ctor":"cc.Material"}},"cc.UITransform":{"contentSize":{"displayOrder":0,"tooltip":"i18n:ENGINE.ui_transform.content_size","type":"cc.Size"},"anchorPoint":{"displayOrder":1,"tooltip":"i18n:ENGINE.ui_transform.anchor_point","type":"cc.Vec2"}},"cc.UIRenderer":{"customMaterial":{"displayOrder":0,"displayName":"CustomMaterial","type":"cc.Asset","ctor":"cc.Material","tooltip":"i18n:ENGINE.UIRenderer.customMaterial"},"color":{"displayOrder":1,"tooltip":"i18n:ENGINE.UIRenderer.color","type":"cc.Color"},"spriteAtlas":{"displayOrder":4,"type":"cc.Asset","ctor":"cc.SpriteAtlas","tooltip":"i18n:ENGINE.sprite.atlas"},"spriteFrame":{"displayOrder":5,"type":"cc.Asset","ctor":"cc.SpriteFrame","tooltip":"i18n:ENGINE.sprite.sprite_frame"},"type":{"displayOrder":6,"type":"Enum","tooltip":"i18n:ENGINE.sprite.type","enumList":[{"name":"SIMPLE","value":0},{"name":"SLICED","value":1},{"name":"TILED","value":2},{"name":"FILLED","value":3}]},"fillType":{"displayOrder":6,"type":"Enum","tooltip":"i18n:ENGINE.sprite.fill_type","enumList":[{"name":"HORIZONTAL","value":0},{"name":"VERTICAL","value":1},{"name":"RADIAL","value":2}]},"fillCenter":{"displayOrder":6,"tooltip":"i18n:ENGINE.sprite.fill_center","type":"cc.Vec2"},"fillStart":{"displayOrder":6,"tooltip":"i18n:ENGINE.sprite.fill_start","min":0,"max":1,"step":0.1,"type":"number"},"fillRange":{"displayOrder":6,"tooltip":"i18n:ENGINE.sprite.fill_range","min":-1,"max":1,"step":0.1,"type":"number"},"trim":{"displayOrder":8,"tooltip":"i18n:ENGINE.sprite.trim","visible":"function () {\\n        return this.type === SpriteType.SIMPLE;\\n      }","type":"boolean"},"grayscale":{"displayOrder":5,"tooltip":"i18n:ENGINE.sprite.gray_scale","type":"boolean"},"sizeMode":{"displayOrder":5,"type":"Enum","tooltip":"i18n:ENGINE.sprite.size_mode","enumList":[{"name":"CUSTOM","value":0},{"name":"TRIMMED","value":1},{"name":"RAW","value":2}]}},"cc.Label":{"customMaterial":{"displayOrder":0,"displayName":"CustomMaterial","type":"cc.Asset","ctor":"cc.Material","tooltip":"i18n:ENGINE.UIRenderer.customMaterial"},"color":{"displayOrder":1,"tooltip":"i18n:ENGINE.UIRenderer.color","type":"cc.Color"},"string":{"displayOrder":4,"tooltip":"i18n:ENGINE.label.string","multiline":true,"type":"string"},"horizontalAlign":{"displayOrder":5,"type":"Enum","tooltip":"i18n:ENGINE.label.horizontal_align","enumList":[{"name":"LEFT","value":0},{"name":"CENTER","value":1},{"name":"RIGHT","value":2}]},"verticalAlign":{"displayOrder":6,"type":"Enum","tooltip":"i18n:ENGINE.label.vertical_align","enumList":[{"name":"TOP","value":0},{"name":"CENTER","value":1},{"name":"BOTTOM","value":2}]},"fontSize":{"displayOrder":7,"tooltip":"i18n:ENGINE.label.font_size","type":"number"},"lineHeight":{"displayOrder":8,"tooltip":"i18n:ENGINE.label.line_height","type":"number"},"spacingX":{"displayOrder":9,"tooltip":"i18n:ENGINE.label.spacing_x","visible":"function () {\\n        return !this.isSystemFontUsed && this._font instanceof BitmapFont;\\n      }","type":"number"},"overflow":{"displayOrder":10,"type":"Enum","tooltip":"i18n:ENGINE.label.overflow","enumList":[{"name":"NONE","value":0},{"name":"CLAMP","value":1},{"name":"SHRINK","value":2},{"name":"RESIZE_HEIGHT","value":3}]},"enableWrapText":{"displayOrder":11,"tooltip":"i18n:ENGINE.label.wrap","type":"boolean"},"useSystemFont":{"displayOrder":12,"tooltip":"i18n:ENGINE.label.system_font","type":"boolean"},"fontFamily":{"displayOrder":13,"tooltip":"i18n:ENGINE.label.font_family","visible":"function () {\\n        return this.isSystemFontUsed;\\n      }","type":"string"},"font":{"displayOrder":13,"type":"cc.Asset","ctor":"cc.Font","tooltip":"i18n:ENGINE.label.font","visible":"function () {\\n        return !this.isSystemFontUsed;\\n      }"},"cacheMode":{"displayOrder":14,"type":"Enum","tooltip":"i18n:ENGINE.label.cache_mode","enumList":[{"name":"NONE","value":0},{"name":"BITMAP","value":1},{"name":"CHAR","value":2}]},"isBold":{"displayOrder":15,"tooltip":"i18n:ENGINE.label.font_bold","type":"boolean"},"isItalic":{"displayOrder":16,"tooltip":"i18n:ENGINE.label.font_italic","type":"boolean"},"isUnderline":{"displayOrder":17,"tooltip":"i18n:ENGINE.label.font_underline","type":"boolean"},"underlineHeight":{"displayOrder":18,"tooltip":"i18n:ENGINE.label.underline_height","visible":"function () {\\n        return this.isUnderline;\\n      }","type":"number"}},"cc.Graphics":{"customMaterial":{"displayOrder":0,"displayName":"CustomMaterial","type":"cc.Asset","ctor":"cc.Material","tooltip":"i18n:ENGINE.UIRenderer.customMaterial"},"lineWidth":{"tooltip":"i18n:ENGINE.graphics.lineWidth","type":"number"},"lineJoin":{"type":"Enum","tooltip":"i18n:ENGINE.graphics.lineJoin","enumList":[{"name":"BEVEL","value":0},{"name":"ROUND","value":1},{"name":"MITER","value":2}]},"lineCap":{"type":"Enum","tooltip":"i18n:ENGINE.graphics.lineCap","enumList":[{"name":"BUTT","value":0},{"name":"ROUND","value":1},{"name":"SQUARE","value":2}]},"strokeColor":{"tooltip":"i18n:ENGINE.graphics.strokeColor","type":"cc.Color"},"fillColor":{"tooltip":"i18n:ENGINE.graphics.fillColor","type":"cc.Color"},"miterLimit":{"tooltip":"i18n:ENGINE.graphics.miterLimit","type":"number"}},"cc.LabelOutline":{"color":{"tooltip":"i18n:ENGINE.labelOutline.color","type":"cc.Color"},"width":{"tooltip":"i18n:ENGINE.labelOutline.width","type":"number"}},"cc.Camera":{"priority":{"displayOrder":0,"tooltip":"i18n:ENGINE.camera.priority","min":0,"max":65535,"step":1,"type":"number"},"visibility":{"displayOrder":1,"type":"BitMask","tooltip":"i18n:ENGINE.camera.visibility"},"clearFlags":{"displayOrder":2,"type":"Enum","tooltip":"i18n:ENGINE.camera.clear_flags","enumList":[{"name":"DONT_CLEAR","value":0},{"name":"DEPTH_ONLY","value":6},{"name":"SOLID_COLOR","value":7},{"name":"SKYBOX","value":14}]},"clearColor":{"displayOrder":3,"tooltip":"i18n:ENGINE.camera.color","type":"cc.Color"},"clearDepth":{"displayOrder":4,"tooltip":"i18n:ENGINE.camera.depth","type":"number"},"clearStencil":{"displayOrder":5,"tooltip":"i18n:ENGINE.camera.stencil","type":"number"},"projection":{"displayOrder":6,"type":"Enum","tooltip":"i18n:ENGINE.camera.projection","enumList":[{"name":"ORTHO","value":0},{"name":"PERSPECTIVE","value":1}]},"fovAxis":{"displayOrder":7,"type":"Enum","tooltip":"i18n:ENGINE.camera.fov_axis","enumList":[{"name":"VERTICAL","value":0},{"name":"HORIZONTAL","value":1}],"visible":"function () {\\n        return this.projection === ProjectionType.PERSPECTIVE;\\n      }"},"fov":{"displayOrder":8,"tooltip":"i18n:ENGINE.camera.fov","min":1,"max":180,"step":1,"visible":"function () {\\n        return this.projection === ProjectionType.PERSPECTIVE;\\n      }","type":"number"},"orthoHeight":{"displayOrder":9,"tooltip":"i18n:ENGINE.camera.ortho_height","min":1,"visible":"function () {\\n        return this.projection === ProjectionType.ORTHO;\\n      }","type":"number"},"near":{"displayOrder":10,"tooltip":"i18n:ENGINE.camera.near","min":0,"type":"number"},"far":{"displayOrder":11,"tooltip":"i18n:ENGINE.camera.far","min":0,"type":"number"},"aperture":{"displayOrder":12,"type":"Enum","tooltip":"i18n:ENGINE.camera.aperture","enumList":[{"name":"F1_8","value":0},{"name":"F2_0","value":1},{"name":"F2_2","value":2},{"name":"F2_5","value":3},{"name":"F2_8","value":4},{"name":"F3_2","value":5},{"name":"F3_5","value":6},{"name":"F4_0","value":7},{"name":"F4_5","value":8},{"name":"F5_0","value":9},{"name":"F5_6","value":10},{"name":"F6_3","value":11},{"name":"F7_1","value":12},{"name":"F8_0","value":13},{"name":"F9_0","value":14},{"name":"F10_0","value":15},{"name":"F11_0","value":16},{"name":"F13_0","value":17},{"name":"F14_0","value":18},{"name":"F16_0","value":19},{"name":"F18_0","value":20},{"name":"F20_0","value":21},{"name":"F22_0","value":22}]},"shutter":{"displayOrder":13,"type":"Enum","tooltip":"i18n:ENGINE.camera.shutter","enumList":[{"name":"D1","value":0},{"name":"D2","value":1},{"name":"D4","value":2},{"name":"D8","value":3},{"name":"D15","value":4},{"name":"D30","value":5},{"name":"D60","value":6},{"name":"D125","value":7},{"name":"D250","value":8},{"name":"D500","value":9},{"name":"D1000","value":10},{"name":"D2000","value":11},{"name":"D4000","value":12}]},"iso":{"displayOrder":14,"type":"Enum","tooltip":"i18n:ENGINE.camera.ISO","enumList":[{"name":"ISO100","value":0},{"name":"ISO200","value":1},{"name":"ISO400","value":2},{"name":"ISO800","value":3}]},"rect":{"displayOrder":15,"tooltip":"i18n:ENGINE.camera.rect","type":"cc.Rect"},"targetTexture":{"displayOrder":16,"type":"cc.Asset","ctor":"cc.RenderTexture","tooltip":"i18n:ENGINE.camera.target_texture"}},"cc.RenderRoot2D":{"cameraComponent":{"type":"cc.Component","ctor":"cc.Camera","tooltip":"i18n:ENGINE.canvas.camera"},"alignCanvasWithScreen":{"tooltip":"i18n:ENGINE.canvas.align","type":"boolean"}},"cc.Canvas":{"cameraComponent":{"type":"cc.Component","ctor":"cc.Camera","tooltip":"i18n:ENGINE.canvas.camera"},"alignCanvasWithScreen":{"tooltip":"i18n:ENGINE.canvas.align","type":"boolean"}},"cc.UIComponent":{},"cc.PrefabLink":{"prefab":{"type":"cc.Asset","ctor":"cc.Prefab"}},"cc.SpriteRenderer":{"sharedMaterials":{"displayOrder":0,"displayName":"Materials","type":"cc.Asset","ctor":"cc.Material"},"spriteFrame":{"type":"cc.Asset","ctor":"cc.SpriteFrame"}},"cc.RichText":{"string":{"tooltip":"i18n:ENGINE.richtext.string","multiline":true,"type":"string"},"horizontalAlign":{"type":"Enum","tooltip":"i18n:ENGINE.richtext.horizontal_align","enumList":[{"name":"LEFT","value":0},{"name":"CENTER","value":1},{"name":"RIGHT","value":2}]},"verticalAlign":{"type":"Enum","tooltip":"i18n:ENGINE.richtext.vertical_align","enumList":[{"name":"TOP","value":0},{"name":"CENTER","value":1},{"name":"BOTTOM","value":2}]},"fontSize":{"tooltip":"i18n:ENGINE.richtext.font_size","type":"number"},"fontFamily":{"tooltip":"i18n:ENGINE.richtext.font_family","type":"string"},"font":{"type":"cc.Asset","ctor":"cc.Font","tooltip":"i18n:ENGINE.richtext.font"},"useSystemFont":{"displayOrder":12,"tooltip":"i18n:ENGINE.richtext.use_system_font","type":"boolean"},"cacheMode":{"type":"Enum","tooltip":"i18n:ENGINE.richtext.cache_mode","enumList":[{"name":"NONE","value":0},{"name":"BITMAP","value":1},{"name":"CHAR","value":2}]},"maxWidth":{"tooltip":"i18n:ENGINE.richtext.max_width","type":"number"},"lineHeight":{"tooltip":"i18n:ENGINE.richtext.line_height","type":"number"},"imageAtlas":{"type":"cc.Asset","ctor":"cc.SpriteAtlas","tooltip":"i18n:ENGINE.richtext.image_atlas"},"handleTouchEvent":{"tooltip":"i18n:ENGINE.richtext.handleTouchEvent","type":"boolean"}},"cc.UIMeshRenderer":{},"cc.UIStaticBatch":{"customMaterial":{"displayOrder":0,"displayName":"CustomMaterial","type":"cc.Asset","ctor":"cc.Material","tooltip":"i18n:ENGINE.UIRenderer.customMaterial"}},"cc.LabelShadow":{"color":{"tooltip":"i18n:ENGINE.labelShadow.color","type":"cc.Color"},"offset":{"tooltip":"i18n:ENGINE.labelShadow.offset","type":"cc.Vec2"},"blur":{"tooltip":"i18n:ENGINE.labelShadow.blur","type":"number"}},"cc.UIOpacity":{"opacity":{"tooltip":"i18n:ENGINE.UIOpacity.opacity","type":"number"}},"cc.Sorting":{"sortingLayer":{"type":"Enum","enumList":[{"name":"default","value":0}]},"sortingOrder":{"min":-32768,"max":32767,"step":1,"type":"number"}},"cc.Animation":{"clips":{"type":"cc.Asset","ctor":"cc.AnimationClip","tooltip":"i18n:ENGINE.animation.clips"},"defaultClip":{"type":"cc.Asset","ctor":"cc.AnimationClip","tooltip":"i18n:ENGINE.animation.default_clip"},"playOnLoad":{"type":"boolean","default":false,"tooltip":"i18n:ENGINE.animation.play_on_load"}},"cc.AudioSource":{"clip":{"type":"cc.Asset","ctor":"cc.AudioClip","tooltip":"i18n:ENGINE.audio.clip"},"loop":{"tooltip":"i18n:ENGINE.audio.loop","type":"boolean"},"playOnAwake":{"tooltip":"i18n:ENGINE.audio.playOnAwake","type":"boolean"},"volume":{"tooltip":"i18n:ENGINE.audio.volume","min":0,"max":1,"type":"number"}},"cc.ParticleSystem2D":{"customMaterial":{"displayOrder":0,"displayName":"CustomMaterial","type":"cc.Asset","ctor":"cc.Material","tooltip":"i18n:ENGINE.UIRenderer.customMaterial"},"color":{"displayOrder":1,"tooltip":"i18n:ENGINE.UIRenderer.color","visible":"function () {\\n        return false;\\n      }","type":"cc.Color"},"custom":{"displayOrder":6,"tooltip":"i18n:ENGINE.particle_system.custom","type":"boolean"},"file":{"displayOrder":5,"type":"cc.Asset","ctor":"cc.ParticleAsset","tooltip":"i18n:ENGINE.particle_system.file"},"spriteFrame":{"type":"cc.Asset","ctor":"cc.SpriteFrame","tooltip":"i18n:ENGINE.particle_system.spriteFrame"},"totalParticles":{"tooltip":"i18n:ENGINE.particle_system.totalParticles","type":"number"},"duration":{"type":"number","default":-1,"tooltip":"i18n:ENGINE.particle_system.duration"},"emissionRate":{"type":"number","default":10,"tooltip":"i18n:ENGINE.particle_system.emissionRate"},"life":{"type":"number","default":1,"tooltip":"i18n:ENGINE.particle_system.life"},"lifeVar":{"type":"number","default":0,"tooltip":"i18n:ENGINE.particle_system.lifeVar"},"startColor":{"tooltip":"i18n:ENGINE.particle_system.startColor","type":"cc.Color"},"startColorVar":{"tooltip":"i18n:ENGINE.particle_system.startColorVar","type":"cc.Color"},"endColor":{"tooltip":"i18n:ENGINE.particle_system.endColor","type":"cc.Color"},"endColorVar":{"tooltip":"i18n:ENGINE.particle_system.endColorVar","type":"cc.Color"},"angle":{"type":"number","default":90,"tooltip":"i18n:ENGINE.particle_system.angle"},"angleVar":{"type":"number","default":20,"tooltip":"i18n:ENGINE.particle_system.angleVar"},"startSize":{"type":"number","default":50,"tooltip":"i18n:ENGINE.particle_system.startSize"},"startSizeVar":{"type":"number","default":0,"tooltip":"i18n:ENGINE.particle_system.startSizeVar"},"endSize":{"type":"number","default":0,"tooltip":"i18n:ENGINE.particle_system.endSize"},"endSizeVar":{"type":"number","default":0,"tooltip":"i18n:ENGINE.particle_system.endSizeVar"},"startSpin":{"type":"number","default":0,"tooltip":"i18n:ENGINE.particle_system.startSpin"},"startSpinVar":{"type":"number","default":0,"tooltip":"i18n:ENGINE.particle_system.startSpinVar"},"endSpin":{"type":"number","default":0,"tooltip":"i18n:ENGINE.particle_system.endSpin"},"endSpinVar":{"type":"number","default":0,"tooltip":"i18n:ENGINE.particle_system.endSpinVar"},"posVar":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.particle_system.posVar"},"positionType":{"type":"Enum","tooltip":"i18n:ENGINE.particle_system.positionType","enumList":[{"name":"FREE","value":0},{"name":"RELATIVE","value":1},{"name":"GROUPED","value":2}]},"preview":{"displayOrder":2,"tooltip":"i18n:ENGINE.particle_system.preview","type":"boolean"},"emitterMode":{"type":"Enum","default":0,"tooltip":"i18n:ENGINE.particle_system.emitterMode","enumList":[{"name":"GRAVITY","value":0},{"name":"RADIUS","value":1}]},"gravity":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.particle_system.gravity"},"speed":{"type":"number","default":180,"tooltip":"i18n:ENGINE.particle_system.speed"},"speedVar":{"type":"number","default":50,"tooltip":"i18n:ENGINE.particle_system.speedVar"},"tangentialAccel":{"type":"number","default":80,"tooltip":"i18n:ENGINE.particle_system.tangentialAccel"},"tangentialAccelVar":{"type":"number","default":0,"tooltip":"i18n:ENGINE.particle_system.tangentialAccelVar"},"radialAccel":{"type":"number","default":0,"tooltip":"i18n:ENGINE.particle_system.radialAccel"},"radialAccelVar":{"type":"number","default":0,"tooltip":"i18n:ENGINE.particle_system.radialAccelVar"},"rotationIsDir":{"type":"boolean","default":false,"tooltip":"i18n:ENGINE.particle_system.rotationIsDir"},"startRadius":{"type":"number","default":0,"tooltip":"i18n:ENGINE.particle_system.startRadius"},"startRadiusVar":{"type":"number","default":0,"tooltip":"i18n:ENGINE.particle_system.startRadiusVar"},"endRadius":{"type":"number","default":0,"tooltip":"i18n:ENGINE.particle_system.endRadius"},"endRadiusVar":{"type":"number","default":0,"tooltip":"i18n:ENGINE.particle_system.endRadiusVar"},"rotatePerS":{"type":"number","default":0,"tooltip":"i18n:ENGINE.particle_system.rotatePerS"},"rotatePerSVar":{"type":"number","default":0,"tooltip":"i18n:ENGINE.particle_system.rotatePerSVar"},"playOnLoad":{"displayOrder":3,"type":"boolean","default":true,"tooltip":"i18n:ENGINE.particle_system.playOnLoad"},"autoRemoveOnFinish":{"displayOrder":4,"type":"boolean","default":false,"tooltip":"i18n:ENGINE.particle_system.autoRemoveOnFinish"}},"cc.MotionStreak":{"customMaterial":{"displayOrder":0,"displayName":"CustomMaterial","type":"cc.Asset","ctor":"cc.Material","tooltip":"i18n:ENGINE.UIRenderer.customMaterial"},"color":{"displayOrder":1,"tooltip":"i18n:ENGINE.UIRenderer.color","type":"cc.Color"},"preview":{"type":"boolean"},"fadeTime":{"type":"number"},"minSeg":{"type":"number"},"stroke":{"type":"number"},"texture":{"type":"cc.Asset","ctor":"cc.Texture2D"},"fastMode":{"type":"boolean"}},"cc.RigidBody2D":{"group":{"type":"Enum","tooltip":"i18n:ENGINE.physics2d.rigidbody.group","enumList":[{"name":"DEFAULT","value":1}]},"enabledContactListener":{"type":"boolean","default":false,"tooltip":"i18n:ENGINE.physics2d.rigidbody.enabledContactListener"},"bullet":{"type":"boolean","default":false,"tooltip":"i18n:ENGINE.physics2d.rigidbody.bullet"},"type":{"type":"Enum","tooltip":"i18n:ENGINE.physics2d.rigidbody.type","enumList":[{"name":"Static","value":0},{"name":"Kinematic","value":1},{"name":"Dynamic","value":2},{"name":"Animated","value":3}]},"allowSleep":{"type":"boolean","tooltip":"i18n:ENGINE.physics2d.rigidbody.allowSleep"},"gravityScale":{"type":"number","tooltip":"i18n:ENGINE.physics2d.rigidbody.gravityScale"},"linearDamping":{"type":"number","tooltip":"i18n:ENGINE.physics2d.rigidbody.linearDamping"},"angularDamping":{"type":"number","tooltip":"i18n:ENGINE.physics2d.rigidbody.angularDamping"},"linearVelocity":{"type":"cc.Vec2","ctor":"cc.Vec2","tooltip":"i18n:ENGINE.physics2d.rigidbody.linearVelocity"},"angularVelocity":{"type":"number","tooltip":"i18n:ENGINE.physics2d.rigidbody.angularVelocity"},"fixedRotation":{"type":"boolean","tooltip":"i18n:ENGINE.physics2d.rigidbody.fixedRotation"},"awakeOnLoad":{"type":"boolean","default":true,"tooltip":"i18n:ENGINE.physics2d.rigidbody.awakeOnLoad"}},"cc.BoxCollider2D":{"editing":{"type":"boolean","default":false,"tooltip":"i18n:ENGINE.physics2d.collider.editing"},"tag":{"type":"number","default":0,"tooltip":"i18n:ENGINE.physics2d.collider.tag"},"group":{"type":"Enum","tooltip":"i18n:ENGINE.physics2d.collider.group","enumList":[{"name":"DEFAULT","value":1}]},"density":{"type":"number","tooltip":"i18n:ENGINE.physics2d.collider.density"},"sensor":{"type":"boolean","tooltip":"i18n:ENGINE.physics2d.collider.sensor"},"friction":{"type":"number","tooltip":"i18n:ENGINE.physics2d.collider.friction"},"restitution":{"type":"number","tooltip":"i18n:ENGINE.physics2d.collider.restitution"},"offset":{"type":"cc.Vec2","ctor":"cc.Vec2","tooltip":"i18n:ENGINE.physics2d.collider.offset"},"size":{"type":"cc.Size","ctor":"cc.Size","tooltip":"i18n:ENGINE.physics2d.collider.size"}},"cc.CircleCollider2D":{"editing":{"type":"boolean","default":false,"tooltip":"i18n:ENGINE.physics2d.collider.editing"},"tag":{"type":"number","default":0,"tooltip":"i18n:ENGINE.physics2d.collider.tag"},"group":{"type":"Enum","tooltip":"i18n:ENGINE.physics2d.collider.group","enumList":[{"name":"DEFAULT","value":1}]},"density":{"type":"number","tooltip":"i18n:ENGINE.physics2d.collider.density"},"sensor":{"type":"boolean","tooltip":"i18n:ENGINE.physics2d.collider.sensor"},"friction":{"type":"number","tooltip":"i18n:ENGINE.physics2d.collider.friction"},"restitution":{"type":"number","tooltip":"i18n:ENGINE.physics2d.collider.restitution"},"offset":{"type":"cc.Vec2","ctor":"cc.Vec2","tooltip":"i18n:ENGINE.physics2d.collider.offset"},"radius":{"type":"number","tooltip":"i18n:ENGINE.physics2d.collider.radius"}},"cc.PolygonCollider2D":{"editing":{"type":"boolean","default":false,"tooltip":"i18n:ENGINE.physics2d.collider.editing"},"tag":{"type":"number","default":0,"tooltip":"i18n:ENGINE.physics2d.collider.tag"},"group":{"type":"Enum","tooltip":"i18n:ENGINE.physics2d.collider.group","enumList":[{"name":"DEFAULT","value":1}]},"density":{"type":"number","tooltip":"i18n:ENGINE.physics2d.collider.density"},"sensor":{"type":"boolean","tooltip":"i18n:ENGINE.physics2d.collider.sensor"},"friction":{"type":"number","tooltip":"i18n:ENGINE.physics2d.collider.friction"},"restitution":{"type":"number","tooltip":"i18n:ENGINE.physics2d.collider.restitution"},"offset":{"type":"cc.Vec2","ctor":"cc.Vec2","tooltip":"i18n:ENGINE.physics2d.collider.offset"},"threshold":{"displayOrder":0,"type":"number","default":1,"tooltip":"i18n:ENGINE.physics2d.collider.threshold"},"points":{"type":"Object","ctor":"cc.Vec2","tooltip":"i18n:ENGINE.physics2d.collider.points"}},"cc.Joint2D":{"anchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.anchor"},"connectedAnchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.connectedAnchor"},"collideConnected":{"type":"boolean","default":false,"tooltip":"i18n:ENGINE.physics2d.joint.collideConnected"},"connectedBody":{"type":"cc.Component","ctor":"cc.RigidBody2D","tooltip":"i18n:ENGINE.physics2d.joint.connectedBody"},"frequency":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.frequency"},"dampingRatio":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.dampingRatio"},"distance":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.distance"},"autoCalcDistance":{"type":"boolean","tooltip":"i18n:ENGINE.physics2d.joint.autoCalcDistance"}},"cc.DistanceJoint2D":{"anchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.anchor"},"connectedAnchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.connectedAnchor"},"collideConnected":{"type":"boolean","default":false,"tooltip":"i18n:ENGINE.physics2d.joint.collideConnected"},"connectedBody":{"type":"cc.Component","ctor":"cc.RigidBody2D","tooltip":"i18n:ENGINE.physics2d.joint.connectedBody"},"maxLength":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.maxLength"},"autoCalcDistance":{"type":"boolean","tooltip":"i18n:ENGINE.physics2d.joint.autoCalcDistance"}},"cc.SpringJoint2D":{"anchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.anchor"},"connectedAnchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.connectedAnchor"},"collideConnected":{"type":"boolean","default":false,"tooltip":"i18n:ENGINE.physics2d.joint.collideConnected"},"connectedBody":{"type":"cc.Component","ctor":"cc.RigidBody2D","tooltip":"i18n:ENGINE.physics2d.joint.connectedBody"},"frequency":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.frequency"},"dampingRatio":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.dampingRatio"},"distance":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.distance"},"autoCalcDistance":{"type":"boolean","tooltip":"i18n:ENGINE.physics2d.joint.autoCalcDistance"}},"cc.MouseJoint2D":{"anchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.anchor"},"connectedAnchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.connectedAnchor"},"collideConnected":{"type":"boolean","default":false,"tooltip":"i18n:ENGINE.physics2d.joint.collideConnected"},"connectedBody":{"type":"cc.Component","ctor":"cc.RigidBody2D","tooltip":"i18n:ENGINE.physics2d.joint.connectedBody"},"frequency":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.frequency"},"dampingRatio":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.dampingRatio"},"maxForce":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.maxForce"}},"cc.RelativeJoint2D":{"anchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.anchor"},"connectedAnchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.connectedAnchor"},"collideConnected":{"type":"boolean","default":false,"tooltip":"i18n:ENGINE.physics2d.joint.collideConnected"},"connectedBody":{"type":"cc.Component","ctor":"cc.RigidBody2D","tooltip":"i18n:ENGINE.physics2d.joint.connectedBody"},"maxForce":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.maxForce"},"maxTorque":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.maxTorque"},"correctionFactor":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.correctionFactor"},"linearOffset":{"type":"cc.Vec2","ctor":"cc.Vec2","tooltip":"i18n:ENGINE.physics2d.joint.linearOffset"},"angularOffset":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.angularOffset"},"autoCalcOffset":{"type":"boolean","tooltip":"i18n:ENGINE.physics2d.joint.autoCalcOffset"}},"cc.SliderJoint2D":{"anchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.anchor"},"connectedAnchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.connectedAnchor"},"collideConnected":{"type":"boolean","default":false,"tooltip":"i18n:ENGINE.physics2d.joint.collideConnected"},"connectedBody":{"type":"cc.Component","ctor":"cc.RigidBody2D","tooltip":"i18n:ENGINE.physics2d.joint.connectedBody"},"angle":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.angle"},"autoCalcAngle":{"type":"boolean","tooltip":"i18n:ENGINE.physics2d.joint.autoCalcAngle"},"enableMotor":{"type":"boolean","tooltip":"i18n:ENGINE.physics2d.joint.enableMotor"},"maxMotorForce":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.maxMotorForce"},"motorSpeed":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.motorSpeed"},"enableLimit":{"type":"boolean","tooltip":"i18n:ENGINE.physics2d.joint.enableLimit"},"lowerLimit":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.lowerLimit"},"upperLimit":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.upperLimit"}},"cc.FixedJoint2D":{"anchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.anchor"},"connectedAnchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.connectedAnchor"},"collideConnected":{"type":"boolean","default":false,"tooltip":"i18n:ENGINE.physics2d.joint.collideConnected"},"connectedBody":{"type":"cc.Component","ctor":"cc.RigidBody2D","tooltip":"i18n:ENGINE.physics2d.joint.connectedBody"},"frequency":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.frequency"},"dampingRatio":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.dampingRatio"}},"cc.WheelJoint2D":{"anchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.anchor"},"connectedAnchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.connectedAnchor"},"collideConnected":{"type":"boolean","default":false,"tooltip":"i18n:ENGINE.physics2d.joint.collideConnected"},"connectedBody":{"type":"cc.Component","ctor":"cc.RigidBody2D","tooltip":"i18n:ENGINE.physics2d.joint.connectedBody"},"angle":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.angle"},"enableMotor":{"type":"boolean","tooltip":"i18n:ENGINE.physics2d.joint.enableMotor"},"maxMotorTorque":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.maxMotorTorque"},"motorSpeed":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.motorSpeed"},"frequency":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.frequency"},"dampingRatio":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.dampingRatio"}},"cc.HingeJoint2D":{"anchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.anchor"},"connectedAnchor":{"type":"cc.Vec2","ctor":"cc.Vec2","default":{"x":0,"y":0},"tooltip":"i18n:ENGINE.physics2d.joint.connectedAnchor"},"collideConnected":{"type":"boolean","default":false,"tooltip":"i18n:ENGINE.physics2d.joint.collideConnected"},"connectedBody":{"type":"cc.Component","ctor":"cc.RigidBody2D","tooltip":"i18n:ENGINE.physics2d.joint.connectedBody"},"enableLimit":{"type":"boolean","tooltip":"i18n:ENGINE.physics2d.joint.enableLimit"},"lowerAngle":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.lowerAngle"},"upperAngle":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.upperAngle"},"enableMotor":{"type":"boolean","tooltip":"i18n:ENGINE.physics2d.joint.enableMotor"},"maxMotorTorque":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.maxMotorTorque"},"motorSpeed":{"type":"number","tooltip":"i18n:ENGINE.physics2d.joint.motorSpeed"}},"cc.TiledTile":{"x":{"type":{"name":"Integer","default":0}},"y":{"type":{"name":"Integer","default":0}},"grid":{"type":{"name":"Integer","default":0}}},"cc.TiledUserNodeData":{},"cc.TiledLayer":{"customMaterial":{"displayOrder":0,"displayName":"CustomMaterial","type":"cc.Asset","ctor":"cc.Material","tooltip":"i18n:ENGINE.UIRenderer.customMaterial"},"color":{"displayOrder":1,"tooltip":"i18n:ENGINE.UIRenderer.color","type":"cc.Color"}},"cc.TiledObjectGroup":{"premultiplyAlpha":{"type":"boolean"}},"cc.TiledMap":{"tmxAsset":{"displayOrder":7,"type":"cc.Asset","ctor":"cc.TiledMapAsset"},"enableCulling":{"type":"boolean"}},"cc.EditBox":{"string":{"displayOrder":1,"tooltip":"i18n:ENGINE.editbox.string","type":"string"},"placeholder":{"displayOrder":2,"tooltip":"i18n:ENGINE.editbox.placeholder","type":"string"},"textLabel":{"displayOrder":3,"type":"cc.Component","ctor":"cc.Label","tooltip":"i18n:ENGINE.editbox.text_lable"},"placeholderLabel":{"displayOrder":4,"type":"cc.Component","ctor":"cc.Label","tooltip":"i18n:ENGINE.editbox.placeholder_label"},"backgroundImage":{"displayOrder":5,"type":"cc.Asset","ctor":"cc.SpriteFrame","tooltip":"i18n:ENGINE.editbox.backgroundImage"},"inputFlag":{"displayOrder":6,"type":"Enum","tooltip":"i18n:ENGINE.editbox.input_flag","enumList":[{"name":"PASSWORD","value":0},{"name":"SENSITIVE","value":1},{"name":"INITIAL_CAPS_WORD","value":2},{"name":"INITIAL_CAPS_SENTENCE","value":3},{"name":"INITIAL_CAPS_ALL_CHARACTERS","value":4},{"name":"DEFAULT","value":5}]},"inputMode":{"displayOrder":7,"type":"Enum","tooltip":"i18n:ENGINE.editbox.input_mode","enumList":[{"name":"ANY","value":0},{"name":"EMAIL_ADDR","value":1},{"name":"NUMERIC","value":2},{"name":"PHONE_NUMBER","value":3},{"name":"URL","value":4},{"name":"DECIMAL","value":5},{"name":"SINGLE_LINE","value":6}]},"returnType":{"displayOrder":8,"type":"Enum","tooltip":"i18n:ENGINE.editbox.returnType","enumList":[{"name":"DEFAULT","value":0},{"name":"DONE","value":1},{"name":"SEND","value":2},{"name":"SEARCH","value":3},{"name":"GO","value":4},{"name":"NEXT","value":5}]},"maxLength":{"displayOrder":9,"tooltip":"i18n:ENGINE.editbox.max_length","type":"number"},"tabIndex":{"displayOrder":10,"tooltip":"i18n:ENGINE.editbox.tab_index","type":"number"},"editingDidBegan":{"displayOrder":11,"type":"Object","ctor":"cc.ClickEvent","tooltip":"i18n:ENGINE.editbox.editing_began"},"textChanged":{"displayOrder":12,"type":"Object","ctor":"cc.ClickEvent","tooltip":"i18n:ENGINE.editbox.text_changed"},"editingDidEnded":{"displayOrder":13,"type":"Object","ctor":"cc.ClickEvent","tooltip":"i18n:ENGINE.editbox.editing_ended"},"editingReturn":{"displayOrder":14,"type":"Object","ctor":"cc.ClickEvent","tooltip":"i18n:ENGINE.editbox.editing_return"}},"cc.Layout":{"alignHorizontal":{"tooltip":"i18n:ENGINE.layout.align_horizontal","visible":"function () {\\n        return this.layoutType === Type.HORIZONTAL;\\n      }","type":"boolean"},"alignVertical":{"tooltip":"i18n:ENGINE.layout.align_vertical","visible":"function () {\\n        return this.layoutType === Type.VERTICAL;\\n      }","type":"boolean"},"type":{"displayOrder":0,"type":"Enum","tooltip":"i18n:ENGINE.layout.layout_type","enumList":[{"name":"NONE","value":0},{"name":"HORIZONTAL","value":1},{"name":"VERTICAL","value":2},{"name":"GRID","value":3}]},"resizeMode":{"type":"Enum","tooltip":"i18n:ENGINE.layout.resize_mode","enumList":[{"name":"NONE","value":0},{"name":"CONTAINER","value":1},{"name":"CHILDREN","value":2}],"visible":"function () {\\n        return this.layoutType !== Type.NONE;\\n      }"},"cellSize":{"tooltip":"i18n:ENGINE.layout.cell_size","visible":"function () {\\n        if (this.type === Type.GRID && this.resizeMode === ResizeMode.CHILDREN) {\\n          return true;\\n        }\\n\\n        return false;\\n      }","type":"cc.Size"},"startAxis":{"type":"Enum","tooltip":"i18n:ENGINE.layout.start_axis","enumList":[{"name":"HORIZONTAL","value":0},{"name":"VERTICAL","value":1}]},"paddingLeft":{"tooltip":"i18n:ENGINE.layout.padding_left","type":"number"},"paddingRight":{"tooltip":"i18n:ENGINE.layout.padding_right","type":"number"},"paddingTop":{"tooltip":"i18n:ENGINE.layout.padding_top","type":"number"},"paddingBottom":{"tooltip":"i18n:ENGINE.layout.padding_bottom","type":"number"},"spacingX":{"tooltip":"i18n:ENGINE.layout.space_x","type":"number"},"spacingY":{"tooltip":"i18n:ENGINE.layout.space_y","type":"number"},"verticalDirection":{"type":"Enum","tooltip":"i18n:ENGINE.layout.vertical_direction","enumList":[{"name":"BOTTOM_TO_TOP","value":0},{"name":"TOP_TO_BOTTOM","value":1}]},"horizontalDirection":{"type":"Enum","tooltip":"i18n:ENGINE.layout.horizontal_direction","enumList":[{"name":"LEFT_TO_RIGHT","value":0},{"name":"RIGHT_TO_LEFT","value":1}]},"constraint":{"type":"Enum","tooltip":"i18n:ENGINE.layout.constraint","enumList":[{"name":"NONE","value":0},{"name":"FIXED_ROW","value":1},{"name":"FIXED_COL","value":2}],"visible":"function () {\\n        return this.type === Type.GRID;\\n      }"},"constraintNum":{"tooltip":"i18n:ENGINE.layout.constraint_number","visible":"function () {\\n        return this.constraint !== Constraint.NONE;\\n      }","type":"number"},"affectedByScale":{"tooltip":"i18n:ENGINE.layout.affected_scale","type":"boolean"}},"cc.ProgressBar":{"barSprite":{"type":"cc.Component","ctor":"cc.Sprite","tooltip":"i18n:ENGINE.progress.bar_sprite"},"mode":{"type":"Enum","tooltip":"i18n:ENGINE.progress.mode","enumList":[{"name":"HORIZONTAL","value":0},{"name":"VERTICAL","value":1},{"name":"FILLED","value":2}]},"totalLength":{"tooltip":"i18n:ENGINE.progress.total_length","type":"number"},"progress":{"tooltip":"i18n:ENGINE.progress.progress","min":0,"max":1,"step":0.1,"slide":true,"type":"number"},"reverse":{"tooltip":"i18n:ENGINE.progress.reverse","type":"boolean"}},"cc.ScrollBar":{"handle":{"displayOrder":0,"type":"cc.Component","ctor":"cc.Sprite","tooltip":"i18n:ENGINE.scrollbar.handle"},"direction":{"displayOrder":1,"type":"Enum","tooltip":"i18n:ENGINE.scrollbar.direction","enumList":[{"name":"HORIZONTAL","value":0},{"name":"VERTICAL","value":1}]},"enableAutoHide":{"displayOrder":2,"tooltip":"i18n:ENGINE.scrollbar.auto_hide","type":"boolean"},"autoHideTime":{"displayOrder":3,"tooltip":"i18n:ENGINE.scrollbar.auto_hide_time","type":"number"}},"cc.ViewGroup":{"bounceDuration":{"displayOrder":5,"type":"number","default":1,"tooltip":"i18n:ENGINE.scrollview.bounceDuration","min":0,"max":10},"brake":{"displayOrder":3,"type":"number","default":0.5,"tooltip":"i18n:ENGINE.scrollview.brake","min":0,"max":1,"step":0.1},"elastic":{"displayOrder":3,"type":"boolean","default":true,"tooltip":"i18n:ENGINE.scrollview.elastic"},"inertia":{"displayOrder":2,"type":"boolean","default":true,"tooltip":"i18n:ENGINE.scrollview.inertia"},"content":{"displayOrder":5,"type":"cc.Node","ctor":"cc.Node","tooltip":"i18n:ENGINE.scrollview.content"},"sizeMode":{"type":"Enum","tooltip":"i18n:ENGINE.pageview.sizeMode","enumList":[{"name":"Unified","value":0},{"name":"Free","value":1}]},"direction":{"type":"Enum","tooltip":"i18n:ENGINE.pageview.direction","enumList":[{"name":"Horizontal","value":0},{"name":"Vertical","value":1}]},"scrollThreshold":{"tooltip":"i18n:ENGINE.pageview.scrollThreshold","min":0,"max":1,"step":0.01,"slide":true,"type":"number"},"pageTurningEventTiming":{"tooltip":"i18n:ENGINE.pageview.pageTurningEventTiming","min":0,"max":1,"step":0.01,"slide":true,"type":"number"},"indicator":{"type":"cc.Component","ctor":"cc.PageViewIndicator","tooltip":"i18n:ENGINE.pageview.indicator"},"autoPageTurningThreshold":{"type":"number","default":100,"tooltip":"i18n:ENGINE.pageview.autoPageTurningThreshold"},"pageTurningSpeed":{"type":"number","default":0.3,"tooltip":"i18n:ENGINE.pageview.pageTurningSpeed"},"pageEvents":{"type":"Object","ctor":"cc.ClickEvent","tooltip":"i18n:ENGINE.pageview.pageEvents"}},"cc.Slider":{"handle":{"type":"cc.Component","ctor":"cc.Sprite","tooltip":"i18n:ENGINE.slider.handle"},"direction":{"type":"Enum","tooltip":"i18n:ENGINE.slider.direction","enumList":[{"name":"Horizontal","value":0},{"name":"Vertical","value":1}]},"progress":{"tooltip":"i18n:ENGINE.slider.progress","min":0,"max":1,"step":0.01,"slide":true,"type":"number"},"slideEvents":{"type":"Object","ctor":"cc.ClickEvent","tooltip":"i18n:ENGINE.slider.slideEvents"}},"cc.Toggle":{"target":{"displayOrder":0,"type":"cc.Node","ctor":"cc.Node","tooltip":"i18n:ENGINE.button.target"},"interactable":{"displayOrder":1,"tooltip":"i18n:ENGINE.button.interactable","type":"boolean"},"transition":{"displayOrder":2,"type":"Enum","tooltip":"i18n:ENGINE.button.transition","enumList":[{"name":"NONE","value":0},{"name":"COLOR","value":1},{"name":"SPRITE","value":2},{"name":"SCALE","value":3}]},"normalColor":{"displayOrder":3,"tooltip":"i18n:ENGINE.button.normal_color","type":"cc.Color"},"pressedColor":{"displayOrder":3,"tooltip":"i18n:ENGINE.button.pressed_color","type":"cc.Color"},"hoverColor":{"displayOrder":3,"tooltip":"i18n:ENGINE.button.hover_color","type":"cc.Color"},"disabledColor":{"displayOrder":3,"tooltip":"i18n:ENGINE.button.disabled_color","type":"cc.Color"},"duration":{"displayOrder":4,"tooltip":"i18n:ENGINE.button.duration","min":0,"max":10,"type":"number"},"zoomScale":{"displayOrder":3,"tooltip":"i18n:ENGINE.button.zoom_scale","type":"number"},"normalSprite":{"displayOrder":3,"type":"cc.Asset","ctor":"cc.SpriteFrame","tooltip":"i18n:ENGINE.button.normal_sprite"},"pressedSprite":{"displayOrder":3,"type":"cc.Asset","ctor":"cc.SpriteFrame","tooltip":"i18n:ENGINE.button.pressed_sprite"},"hoverSprite":{"displayOrder":3,"type":"cc.Asset","ctor":"cc.SpriteFrame","tooltip":"i18n:ENGINE.button.hover_sprite"},"disabledSprite":{"displayOrder":3,"type":"cc.Asset","ctor":"cc.SpriteFrame","tooltip":"i18n:ENGINE.button.disabled_sprite"},"clickEvents":{"displayOrder":20,"type":"Object","ctor":"cc.ClickEvent","tooltip":"i18n:ENGINE.button.click_events"},"isChecked":{"displayOrder":1,"tooltip":"i18n:ENGINE.toggle.isChecked","type":"boolean"},"checkMark":{"displayOrder":1,"type":"cc.Component","ctor":"cc.Sprite","tooltip":"i18n:ENGINE.toggle.checkMark"},"checkEvents":{"type":"Object","ctor":"cc.ClickEvent","tooltip":"i18n:ENGINE.toggle.check_events"}},"cc.ToggleContainer":{"allowSwitchOff":{"tooltip":"i18n:ENGINE.toggle_group.allowSwitchOff","type":"boolean"},"checkEvents":{"type":"Object","ctor":"cc.ClickEvent","tooltip":"i18n:ENGINE.toggle_group.check_events"}},"cc.PageViewIndicator":{"spriteFrame":{"type":"cc.Asset","ctor":"cc.SpriteFrame","tooltip":"i18n:ENGINE.pageview_indicator.spriteFrame"},"direction":{"type":"Enum","tooltip":"i18n:ENGINE.pageview_indicator.direction","enumList":[{"name":"HORIZONTAL","value":0},{"name":"VERTICAL","value":1}]},"cellSize":{"type":"cc.Size","ctor":"cc.Size","tooltip":"i18n:ENGINE.pageview_indicator.cell_size"},"spacing":{"type":"number","default":0,"tooltip":"i18n:ENGINE.pageview_indicator.spacing"}},"cc.PageView":{"bounceDuration":{"displayOrder":5,"type":"number","default":1,"tooltip":"i18n:ENGINE.scrollview.bounceDuration","min":0,"max":10},"brake":{"displayOrder":3,"type":"number","default":0.5,"tooltip":"i18n:ENGINE.scrollview.brake","min":0,"max":1,"step":0.1},"elastic":{"displayOrder":3,"type":"boolean","default":true,"tooltip":"i18n:ENGINE.scrollview.elastic"},"inertia":{"displayOrder":2,"type":"boolean","default":true,"tooltip":"i18n:ENGINE.scrollview.inertia"},"content":{"displayOrder":5,"type":"cc.Node","ctor":"cc.Node","tooltip":"i18n:ENGINE.scrollview.content"},"sizeMode":{"type":"Enum","tooltip":"i18n:ENGINE.pageview.sizeMode","enumList":[{"name":"Unified","value":0},{"name":"Free","value":1}]},"direction":{"type":"Enum","tooltip":"i18n:ENGINE.pageview.direction","enumList":[{"name":"Horizontal","value":0},{"name":"Vertical","value":1}]},"scrollThreshold":{"tooltip":"i18n:ENGINE.pageview.scrollThreshold","min":0,"max":1,"step":0.01,"slide":true,"type":"number"},"pageTurningEventTiming":{"tooltip":"i18n:ENGINE.pageview.pageTurningEventTiming","min":0,"max":1,"step":0.01,"slide":true,"type":"number"},"indicator":{"type":"cc.Component","ctor":"cc.PageViewIndicator","tooltip":"i18n:ENGINE.pageview.indicator"},"autoPageTurningThreshold":{"type":"number","default":100,"tooltip":"i18n:ENGINE.pageview.autoPageTurningThreshold"},"pageTurningSpeed":{"type":"number","default":0.3,"tooltip":"i18n:ENGINE.pageview.pageTurningSpeed"},"pageEvents":{"type":"Object","ctor":"cc.ClickEvent","tooltip":"i18n:ENGINE.pageview.pageEvents"}},"cc.SafeArea":{},"cc.UICoordinateTracker":{"target":{"type":"cc.Node","ctor":"cc.Node","tooltip":"i18n:ENGINE.UICoordinateTracker.target"},"camera":{"type":"cc.Component","ctor":"cc.Camera","tooltip":"i18n:ENGINE.UICoordinateTracker.camera"},"useScale":{"tooltip":"i18n:ENGINE.UICoordinateTracker.use_scale","type":"boolean"},"distance":{"tooltip":"i18n:ENGINE.UICoordinateTracker.distance","type":"number"},"syncEvents":{"type":"Object","ctor":"cc.ClickEvent","tooltip":"i18n:ENGINE.UICoordinateTracker.sync_events"}},"cc.BlockInputEvents":{},"cc.SubContextView":{"designResolutionSize":{"tooltip":"i18n:ENGINE.subContextView.design_size","type":"cc.Size"},"fps":{"tooltip":"i18n:ENGINE.subContextView.fps","type":"number"}},"cc.VideoPlayer":{"resourceType":{"type":"Enum","tooltip":"i18n:ENGINE.videoplayer.resourceType","enumList":[{"name":"REMOTE","value":0},{"name":"LOCAL","value":1}]},"remoteURL":{"tooltip":"i18n:ENGINE.videoplayer.remoteURL","type":"string"},"clip":{"type":"cc.Asset","ctor":"cc.VideoClip","tooltip":"i18n:ENGINE.videoplayer.clip"},"playOnAwake":{"tooltip":"i18n:ENGINE.videoplayer.playOnAwake","type":"boolean"},"playbackRate":{"tooltip":"i18n:ENGINE.videoplayer.playbackRate","min":0,"max":10,"step":1,"slide":true,"type":"number"},"volume":{"tooltip":"i18n:ENGINE.videoplayer.volume","min":0,"max":1,"step":0.1,"slide":true,"type":"number"},"mute":{"tooltip":"i18n:ENGINE.videoplayer.mute","type":"boolean"},"loop":{"tooltip":"i18n:ENGINE.videoplayer.loop","type":"boolean"},"keepAspectRatio":{"tooltip":"i18n:ENGINE.videoplayer.keepAspectRatio","type":"boolean"},"fullScreenOnAwake":{"tooltip":"i18n:ENGINE.videoplayer.fullScreenOnAwake","type":"boolean"},"stayOnBottom":{"tooltip":"i18n:ENGINE.videoplayer.stayOnBottom","type":"boolean"},"videoPlayerEvent":{"displayOrder":100,"type":"Object","ctor":"cc.ClickEvent","tooltip":"i18n:ENGINE.videoplayer.videoPlayerEvent"}},"cc.WebView":{"url":{"tooltip":"i18n:ENGINE.webview.url","type":"string"},"webviewEvents":{"displayOrder":20,"type":"Object","ctor":"cc.ClickEvent","tooltip":"i18n:ENGINE.webview.webviewEvents"}}}
        `
        compAttrMaps = JSON.parse(mapStr)
    }
    return compAttrMaps[clsName]
}

function isSubclassOfComponent(val: any): boolean {
    if (typeof val !== 'function') {
        return false;
    }
    let proto = Object.getPrototypeOf(val);
    while (proto) {
        if (proto === _cc_().Component) {
            return true;
        }
        proto = Object.getPrototypeOf(proto);
    }
    return false;
}

/**
 * 获取内置class的编辑器属性（DEV时获取，保存为配置，构建后可能会变化，使用配置比较稳定）
 * @returns 
 */
function getCCCompClassAttrMap(){
    const sceneNode = _cc_().director.getScene()
    const compAttrMaps = {}
    const classArr = []

    const errArr = []
    for (let k in _cc_()) {
        const val = _cc_()[k];
        if (isSubclassOfComponent(val)) {
            // console.log(`${k} is a subclass of cc.Component`);
            const comp = val
            //@ts-ignore
            const clsName = comp.prototype.__classname__
            if(compAttrMaps[clsName]!=null){
                continue
            }
            classArr.push(clsName)

            let inst = sceneNode.getComponentInChildren(comp)
            let _node = null
            if(inst==null){
                _node = new (_cc_().Node)()
                _node.parent = sceneNode
                try{
                    inst = _node.addComponent(comp)
                }catch(e){
                    console.log("---err1",clsName,e.message)
                }
            }
            if(inst){
                try{
                    const map = getAttrInfosOfComponentInst(inst)
                    compAttrMaps[clsName] = map
                }catch(e){
                    console.log("---err2",clsName,e.message)
                }
            }
            
            if(compAttrMaps[clsName]==null){
                errArr.push(clsName)
            }
            if(_node){
                _node.destroy()
            }
        }
    }

    const str = JSON.stringify(compAttrMaps)

    const len = Object.keys(compAttrMaps).length
    return str
}

/**
 * 对 _getAttrInfosOfComponentProrotype 的补充
 */
function getAttrInfosOfComponentInst(compInst:any/**import("cc").Component */){
    const clsPrototype = compInst["__proto__"]
    let map = _getAttrInfosOfComponentProrotype(clsPrototype)
    for(let k in map){
        let attrType = map[k].type
        if(!attrType||attrType=="Object"){
            const _instVal = compInst[k]
            const _instType = typeof _instVal
            
            if(_instType=="boolean"){
                attrType = "boolean"
            }else if(_instType=="string"){
                attrType = "string"
            }else if(_instType=="number"){
                attrType = "number"
            }else if(_instType=="object"){
                if(_instVal instanceof _cc_().Color){
                    attrType = "cc.Color"
                }else if(_instVal instanceof _cc_().Vec2){
                    attrType = "cc.Vec2"
                }else if(_instVal instanceof _cc_().Vec3){
                    attrType = "cc.Vec3"
                }else if(_instVal instanceof _cc_().Vec4){
                    attrType = "cc.Vec4"
                }else if(_instVal instanceof _cc_().Rect){
                    attrType = "cc.Rect"
                }else if(_instVal instanceof _cc_().Size){
                    attrType = "cc.Size"
                }else if(_instVal instanceof _cc_().Quat){
                    attrType = "cc.Quat"
                }else if(_instVal instanceof _cc_().Node){
                    attrType = "cc.Node"
                }else if(_instVal instanceof _cc_().Component){
                    attrType = "cc.Component"
                }else if(_instVal instanceof _cc_().Asset){
                    attrType = "cc.Asset"
                }
            }
            map[k].type = attrType
            
        }
    }

    return map
}

let _compAttrsMap = {}
/**
 * 根据组件的类，获取到要在编辑器显示的属性列表
 * @param clsPrototype 如Label.prototype
 * @returns 
 */
function _getAttrInfosOfComponentProrotype(clsPrototype){
    const clsName = clsPrototype.__classname__
    if(_compAttrsMap[clsName]){
        return _compAttrsMap[clsName]
    }
    type pTypes = "visible"|"type"|"displayName"|"displayOrder"|"tooltip"|"multiline"|"readonly"
        |"min"|"max"|"step"|"range"|"slide"|"editorOnly"
        |"default"|"enumList"|"hasGetter"|"hasSetter"|"ctor"

    function _getAttr(attrs:Object,name:string,p:pTypes){
        const key = name+"$_$"+p
        let v = attrs[key]??null
        return v
    }
    
    const _ctor = clsPrototype.constructor
    const props:Array<string> = _ctor.__props__
    const attrs = _cc_().CCClass.Attr.getClassAttrs(_ctor)

    const data = {}
    for(let k of props){
        if(k.startsWith("_")){
            // if(k!=="__scriptAsset"){
                continue
            // }
        }
        let visible = _getAttr(attrs,k,"visible")
        if(visible===false){
            continue
        }
        let editorOnly = _getAttr(attrs,k,"editorOnly")
        if(editorOnly){
            continue
        }
        if(typeof visible=="function"){
            const funcStr:string = visible.toString()
            visible = funcStr.replace("this._","this.")
        }else if(visible===true){
            visible = null
        }
        
        const pCtor = _getAttr(attrs,k,"ctor")
        const pCtorClassname = pCtor?.prototype?.__classname__
        const param = {
            displayOrder : _getAttr(attrs,k,"displayOrder") as number,
            displayName : _getAttr(attrs,k,"displayName") as string,
            type : _getAttr(attrs,k,"type"),
            ctor : pCtorClassname??null,
            default : _getAttr(attrs,k,"default"),
            tooltip : _getAttr(attrs,k,"tooltip") as string,
            multiline : _getAttr(attrs,k,"multiline") as boolean,
            readonly : _getAttr(attrs,k,"readonly") as boolean,
            min : _getAttr(attrs,k,"min") as number,
            max : _getAttr(attrs,k,"max") as number,
            step : _getAttr(attrs,k,"step") as number,
            range : _getAttr(attrs,k,"range") as number[],
            slide : _getAttr(attrs,k,"slide") as boolean,
            editorOnly : _getAttr(attrs,k,"editorOnly") as boolean,
            enumList : _getAttr(attrs,k,"enumList") as Array<{name:string,value:number}>,
            visible : visible,
        }
        if(!param.type){
            let _type = typeof param.default
            if(_type=="function"){
                param.default = param.default();
            }

            _type = typeof param.default
            
            if(_type=="boolean"){
                param.type = "boolean"
            }else if(_type=="string"){
                param.type = "string"
            }else if(_type=="number"){
                param.type = "number"
            }else if(_type=="object"){
                if(param.default instanceof _cc_().Color){
                    param.type = "Color"
                }else if(param.default instanceof _cc_().Vec2){
                    param.type = "Vec2"
                }else if(param.default instanceof _cc_().Vec3){
                    param.type = "Vec3"
                }else if(param.default instanceof _cc_().Vec4){
                    param.type = "Vec4"
                }else if(param.default instanceof _cc_().Rect){
                    param.type = "Rect"
                }else if(param.default instanceof _cc_().Size){
                    param.type = "Size"
                }
            }
            
            
        }else if(param.type=="Object"){
            // if(param.ctor){
            //     param.type = param.ctor
            // }else{

            // }
            const isNode = _cc_().Node.prototype==pCtor.prototype || _cc_().Node.prototype.isPrototypeOf(pCtor.prototype)
            const isComponent = _cc_().Component.prototype==pCtor.prototype || _cc_().Component.prototype.isPrototypeOf(pCtor.prototype)
            const isAsset = _cc_().Asset.prototype==pCtor.prototype || _cc_().Asset.prototype.isPrototypeOf(pCtor.prototype)
            if(isNode){
                param.type = "cc.Node"
            }else if(isComponent){
                param.type = "cc.Component"
            }else if(isAsset){
                param.type = "cc.Asset"
            }else if(param.ctor=="cc.ClickEvent"){
                let g = 0 
            }
        }else if(typeof param.type=="object"){
            if(param.type.name=="Float"||param.type.name=="double"){
                param.type = "number"
            }else if(param.type.name=="String"){
                param.type = "string"
            }
        }
        if(param.ctor==null && param.default!=null && (typeof param.default)=="object"){
            param.ctor = param.default?.__proto__?.__classname__
            if(param.ctor!=null){
                if(param.type==null){
                    param.type = "Object"
                }
            }
        }
        for(let k of Object.keys(param)){
            if(param[k]==null){
                delete param[k]
            }
        }
        data[k] = param
        // console.log(_ctor.name,k,JSON.stringify(param))
    }
    _compAttrsMap[clsName] = data
    return data
}

function _getResMemory(asset:any/**import("cc").Asset */){
    if(asset instanceof _cc_().ImageAsset){
        return getImageAssetMemorySize(asset as any)
    }
    return 0
}

function getDynamicTextureData(index:number){
    if(!_cc_().DynamicAtlasManager.instance.enabled){
        return null
    }
    //@ts-ignore
    const _atlases = _cc_().DynamicAtlasManager.instance._atlases
    if(_atlases.length==0){
        return null;
    }
    const _tex = _atlases[index]._texture;
    if(_tex==null){
        return null
    }
    
    return getTextureData(_tex,false)
}

function getTextureData(_tex:any/**import("cc").Texture2D */, flipY = true){
    if(_tex==null){
        return null
    }
    const arr = readPixels(_tex,flipY)
    const obj =  cropBlankPixels(arr,_tex.width,_tex.height)
    const base64String = uint8ArrayToBase64(obj.buffer)
    obj["base64Data"] = base64String
    delete obj.buffer
    return obj
}

function readPixels(texture: any/**import("cc").Texture2D */, flipY = true): Uint8Array {
    const { width, height } = texture;
    const gfxTexture = texture.getGFXTexture();
    const gfxDevice = texture['_getGFXDevice']();
    const bufferViews = [];
    const region = new (_cc_()).gfx.BufferTextureCopy;
    const buffer = new Uint8Array(width * height * 4);
    region.texExtent.width = width;
    region.texExtent.height = height;
    bufferViews.push(buffer);
    gfxDevice?.copyTextureToBuffers(gfxTexture, bufferViews, [region]);
    if (flipY) {
        let i = 0, len1 = height / 2, len2 = width * 4, j: number, idx0: number, idx1: number;
        while (i < len1) {
            j = 0;
            while (j < len2) {
                idx0 = i * len2 + j;
                idx1 = (height - i - 1) * len2 + j++;
                [buffer[idx0], buffer[idx1]] = [buffer[idx1], buffer[idx0]];
            }
            i++;
        }
    }
    
    return buffer;
}

function uint8ArrayToBase64(uint8Array: Uint8Array): string {
    const chunkSize = 0x8000; // 每次处理 32768 个字节
    let result = '';

    for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        result += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }

    return btoa(result);
}

function cropBlankPixels(buffer: Uint8Array, width: number, height: number): {
    buffer: Uint8Array,
    width: number,
    height: number,
    oldWidth: number,
    oldHeight: number,
    top: number,
    left: number,
    right: number,
    bottom: number
} {
    // 寻找上下边界
    let top = 0;
    let bottomLine = height - 1;

    // 寻找上边界
    for (; top < height; top++) {
        let hasPixel = false;
        for (let x = 0; x < width; x++) {
            if (buffer[(top * width + x) * 4 + 3] !== 0) {
                hasPixel = true;
                break;
            }
        }
        if (hasPixel) break;
    }

    // 寻找下边界
    for (; bottomLine >= top; bottomLine--) {
        let hasPixel = false;
        for (let x = 0; x < width; x++) {
            if (buffer[(bottomLine * width + x) * 4 + 3] !== 0) {
                hasPixel = true;
                break;
            }
        }
        if (hasPixel) break;
    }

    // 处理全透明情况
    if (top > bottomLine) {
        return {
            buffer,
            width: 0,
            height: 0,
            oldWidth: width,
            oldHeight: height,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        };
    }

    // 寻找左右边界
    let leftMin = width;
    let rightMax = 0;

    for (let y = top; y <= bottomLine; y++) {
        // 找左边界
        let left = 0;
        for (; left < width; left++) {
            if (buffer[(y * width + left) * 4 + 3] !== 0) break;
        }
        if (left < leftMin) leftMin = left;

        // 找右边界
        let right = width - 1;
        for (; right >= leftMin; right--) {
            if (buffer[(y * width + right) * 4 + 3] !== 0) break;
        }
        if (right > rightMax) rightMax = right;
    }

    // 计算裁剪参数
    const newWidth = rightMax - leftMin + 1;
    const newHeight = bottomLine - top + 1;
    const newBuffer = new Uint8Array(newWidth * newHeight * 4);

    // 复制有效像素数据
    for (let y = 0; y < newHeight; y++) {
        const srcStart = ((top + y) * width + leftMin) * 4;
        const srcEnd = srcStart + newWidth * 4;
        newBuffer.set(buffer.subarray(srcStart, srcEnd), y * newWidth * 4);
    }

    return {
        buffer: newBuffer,
        width: newWidth,
        height: newHeight,
        oldWidth: width,
        oldHeight: height,
        top: top,
        left: leftMin,
        right: width - rightMax - 1,
        bottom: height - bottomLine - 1
    };
}

async function evalJsStr(jsStr:string){
    try{
        const content = _cc_().js.formatStr("(async function(){%s})()",jsStr)
        let ret = await eval(content)
        const type = typeof ret;
        if(type=="object"){
            ret = JSON.stringify(ret)
        }else{
            ret = ret + ""
        }
        return ret
    }catch(e){
        if(e&&e.message){
            return e.message
        }
        return "error occur"
    }
}

function getImageAssetMemorySize(imageAsset: any/**import("cc").ImageAsset */): number {
    const width = imageAsset.width;
    const height = imageAsset.height;
    const format = imageAsset.format; // 像素格式

    let bytesPerPixel = 4; // 默认 RGBA8888 格式，每个像素 4 字节

    switch (format) {
        case _cc_().Texture2D.PixelFormat.RGBA8888:
            bytesPerPixel = 4;
            break;
        case _cc_().Texture2D.PixelFormat.RGB888:
            bytesPerPixel = 3;
            break;
        case _cc_().Texture2D.PixelFormat.RGBA4444:
        case _cc_().Texture2D.PixelFormat.RGB565:
            bytesPerPixel = 2;
            break;
        case _cc_().Texture2D.PixelFormat.A8:
            bytesPerPixel = 1;
            break;
        // 其他格式根据需要添加
    }

    return width * height * bytesPerPixel;
}




function _getSelfModelName() {
    let model = "";

    if (_cc_().sys.isNative) {
        if (_cc_().sys.os === _cc_().sys.OS.ANDROID) {
            model = "native_android";
        } else if (_cc_().sys.os === _cc_().sys.OS.IOS) {
            model = "native_ios";
        } else if (_cc_().sys.os === _cc_().sys.OS.WINDOWS) {
            model = "native_windows";
        } else if (_cc_().sys.os === _cc_().sys.OS.OSX) {
            model = "native_osx";
        } else if (_cc_().sys.os === _cc_().sys.OS.OHOS) {
            model = "native_ohos";
        } else if (_cc_().sys.os === _cc_().sys.OS.LINUX) {
            model = "native_linux";
        } else {
            model = "native_unknown";
        }
    } else {
        if (_cc_().sys.platform === _cc_().sys.Platform.ALIPAY_MINI_GAME) {
            model = "alipay_mini_game";
        } else if (_cc_().sys.platform === _cc_().sys.Platform.WECHAT_GAME) {
            model = "wechat_game";
        } else if (_cc_().sys.platform === _cc_().sys.Platform.QTT_MINI_GAME) {
            model = "qq_play";
        } else if (_cc_().sys.platform === _cc_().sys.Platform.BYTEDANCE_MINI_GAME) {
            model = "bytedance_mini_game";
        } else if (_cc_().sys.platform === _cc_().sys.Platform.BAIDU_MINI_GAME) {
            model = "baidu_mini_game";
        } else if (_cc_().sys.platform === _cc_().sys.Platform.XIAOMI_QUICK_GAME) {
            model = "xiaomi_quick_game";
        } else if (_cc_().sys.platform === _cc_().sys.Platform.OPPO_MINI_GAME) {
            model = "oppo_mini_game";
        } else if (_cc_().sys.platform === _cc_().sys.Platform.VIVO_MINI_GAME) {
            model = "vivo_mini_game";
        } else if (_cc_().sys.platform === _cc_().sys.Platform.TAOBAO_CREATIVE_APP) {
            model = "taobao_creative_app";
        } else if (_cc_().sys.platform === _cc_().sys.Platform.TAOBAO_MINI_GAME) {
            model = "taobao_mini_game";
        } else if (_cc_().sys.platform === _cc_().sys.Platform.COCOSPLAY) {
            model = "cocosplay";
        } else if (_cc_().sys.platform === _cc_().sys.Platform.LINKSURE_MINI_GAME) {
            model = "linksure_mini_game";
        } else if (_cc_().sys.platform === _cc_().sys.Platform.HUAWEI_QUICK_GAME) {
            model = "huawei_quick_game";
        } else if (_cc_().sys.browserType === _cc_().sys.BrowserType.CHROME) {
            model = "browser_chrome";
        } else if (_cc_().sys.browserType === _cc_().sys.BrowserType.FIREFOX) {
            model = "browser_firefox";
        } else if (_cc_().sys.browserType === _cc_().sys.BrowserType.SAFARI) {
            model = "browser_safari";
        } else if (_cc_().sys.browserType === _cc_().sys.BrowserType.EDGE) {
            model = "browser_edge";
        } else if (_cc_().sys.browserType === _cc_().sys.BrowserType.IE) {
            model = "browser_ie";
        } else if (_cc_().sys.browserType === _cc_().sys.BrowserType.OPERA) {
            model = "browser_opera";
        } else if (_cc_().sys.browserType === _cc_().sys.BrowserType.MIUI) {
            model = "browser_miui";
        } else if (_cc_().sys.browserType === _cc_().sys.BrowserType.UC) {
            model = "browser_uc";
        } else if (_cc_().sys.browserType === _cc_().sys.BrowserType.QQ) {
            model = "browser_qq";
        } else if (_cc_().sys.browserType === _cc_().sys.BrowserType.BAIDU) {
            model = "browser_baidu";
        } else {
            model = "unknown";
        }

        if (_cc_().sys.os === _cc_().sys.OS.ANDROID) {
            model = "android" + "_" +model;
        } else if (_cc_().sys.os === _cc_().sys.OS.IOS) {
            model = "ios" + "_" +model;
        } else if (_cc_().sys.os === _cc_().sys.OS.WINDOWS) {
            model = "windows" + "_" +model;
        } else if (_cc_().sys.os === _cc_().sys.OS.OSX) {
            model = "osx" + "_" +model;
        } else if (_cc_().sys.os === _cc_().sys.OS.OHOS) {
            model = "ohos" + "_" +model;
        } else if (_cc_().sys.os === _cc_().sys.OS.LINUX) {
            model = "linux" + "_" +model;
        }
    }

    if(_cc_().sys.isXR){
        model += "_isXR"
    }

    return model;
}

function interceptLog(){
    let _handleLog = window["cc_debuger_handleLog"]
    if(!_handleLog){
        window["cc_debuger_handleLog"] = _handleLog = function (level: any/**LogLevel */, args: any[]) {
            const message = args.map((a) => {
                if(typeof a === "object"){
                    try{
                        return JSON.stringify(a)
                    }catch(e){
                        if(a.toString){
                            return a.toString()
                        }else{
                            return "[object]"
                        }
                    }
                }else{
                    return String(a)
                }
            }).join(" ");
            let time = new Date();
            let timeStr = `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}.${time.getMilliseconds()}`;
            const logEntry: any/**LogEntry */ = {
                message,
                level,
                timestamp: timeStr,
            }; 
    
            _runtimeSocket.sendPush_runtimeLog(logEntry)
        }
    }
    
    if(!window["cc_debuger_log_intercepted"]){
        window["cc_debuger_log_intercepted"] = true;
        ["log", "warn", "error"].forEach(level => {
            const originalMethod = console[level];
    
            console[level] = (...args) => {
                if(window["cc_debuger_handleLog"]){
                    window["cc_debuger_handleLog"](level, args);
                    originalMethod.apply(console, args);
                }
            };
        });
    }
    
}

function _getImageAssetUrl(asset:any/**import("cc").ImageAsset */){
    if(_cc_().sys.isBrowser && asset.nativeUrl){
        const baseUrl = window.location.origin; // http://192.168.1.17:7456
        const fullPath = window.location.pathname; // /web-desktop/web-desktop/index.html
        const subPath = fullPath.substring(0, fullPath.lastIndexOf('/') + 1); // /web-desktop/web-desktop/

        const imgSrc = `${baseUrl}${subPath}${asset.nativeUrl}`;
        return imgSrc
    }else if(_cc_().sys.isNative && asset.url){
        const imgPath = _cc_().native.fileUtils.fullPathForFilename(asset.url)
        return imgPath
    }
}

/**获取可写目录下的目录结构 */
function getWitablePathFilesInfo():Array<any/**WritableFileInfo */>{
    if(!_cc_().sys.isNative){
        return []
    }
    
    const writablePath = _cc_().native.fileUtils.getWritablePath()
    function traverse(floder:string){
        const files = _cc_().native.fileUtils.listFiles(floder)
        const newList = []
        for(let i=files.length-1;i>=0;i--){
            const f = files[i]
            const x = _cc_().native.fileUtils.fullPathForFilename(f)
            if(x!=f){
                continue
            }
            
            let isFloder = _cc_().native.fileUtils.isDirectoryExist(f)
            let relativePath = f.replace(writablePath,"")
            relativePath = _cc_().path.stripSep(relativePath)
            const name = _cc_().path.basename(relativePath)
            const obj:any/**WritableFileInfo */ = {
                name,
                isFloder,
                path:relativePath,
            }
            if(isFloder){
                obj.children = traverse(f)
            }
            newList.push(obj)
            
        }
        return newList
    }
    const arr:Array<any/**WritableFileInfo */> = traverse(writablePath)
    // console.log("getWitablePathFilesInfo",arr)
    return arr
}

function getWritableFileData(filePath:string){
    if(!_cc_().sys.isNative){
        return null
    }
    const arr = _cc_().native.fileUtils.getDataFromFile(filePath);
    if (!arr || arr.byteLength <= 0) return null;
    const u8a = new Uint8Array(arr);
    const base64Str = uint8ArrayToBase64(u8a)
    return base64Str
}

let bInited = false
let _runtimeSocket:RunTimeSocket = null

function _initOnce() {
    if(bInited){
        return
    }
    bInited = true
    const wsUrl = window["__cc_debuger_wsUrl"]
    _data = new _RuntimeData();
    _runtimeSocket = new RunTimeSocket();
    _runtimeSocket.initSocket(wsUrl);

    _data.initAssetForPush()
    
    const _addRef = _cc_().Asset.prototype.addRef
    const _decRef = _cc_().Asset.prototype.decRef
    const _destroy = _cc_().Asset.prototype.destroy

    //@ts-ignore
    const cls_Cache = _cc_().assetManager.assets.__proto__
    const _add = cls_Cache?.add;
    const _remove = cls_Cache?.remove;
    if(_add){
        _cc_().assetManager.assets.add = function(key,val){
            // console.log("add key",key)
            
            let ret = _add.call(_cc_().assetManager.assets,key,val)
            _data.onAsset_added(key,val)
            return ret
        }
    }
    if(_remove){
        _cc_().assetManager.assets.remove = function(key){
            // console.log("remove key",key)
            
            let ret = _remove.call(_cc_().assetManager.assets,key)
            _data.onAsset_removed(key)
            return ret
        }
    }

    _cc_().Asset.prototype.addRef = function(){
        let ret = _addRef.call(this)

        _data.onRes_addRef(this)
        return ret
    }
    _cc_().Asset.prototype.decRef = function(autoRelease?: boolean){
        let ret = _decRef.call(this,autoRelease)

        _data.onRes_decRef(this)
        return ret
    }

    _cc_().Asset.prototype.destroy = function(autoRelease?: boolean){
        let ret = _destroy.call(this,autoRelease)

        _data.onRes_destroy(this)
        return ret
    }

    const duration = 1000
    setInterval(() => {
        _runtimeSocket.loop(duration)
    }, duration);

    
    _cc_().director.on(_cc_().Director.EVENT_AFTER_SCENE_LAUNCH, () => {
        _runtimeSocket.sendPush_sceneLaunched()
        _runtimeSocket.sendPush_checkUpdateSceneTree()
    })

    interceptLog()
}

window["__cc_debuger__initOnce"] = _initOnce
