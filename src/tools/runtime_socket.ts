import * as cc from "cc"


// @ts-ignore
import { DEBUG, DEV, EDITOR, JSB, NATIVE, PREVIEW, SUPPORT_JIT } from 'cc/env';

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
            console.log('[Runtime] Connected to server');
            this._send({ type: 'identify', role: 'runtime' ,name: _getSelfModelName()});

        };
        this.m_socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            this._onMessage(msg);
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
                data = _data.getGameEnv()
            } else if (msg.action === 'requestShowFPS') {
                let bool = msg.data
                if(bool=="true"){
                    cc.profiler.showStats()
                }else if(bool=="false"){
                    cc.profiler.hideStats()
                }
                data = cc.profiler.isShowingStats()
            } else if (msg.action === 'requestDynamicAtlasEnable') {
                let bool = msg.data
                if(bool=="true"){
                    cc.macro.CLEANUP_IMAGE_CACHE = false;
                    cc.DynamicAtlasManager.instance.enabled = true
                }else if(bool=="false"){
                    cc.DynamicAtlasManager.instance.enabled = false
                }
                data = cc.DynamicAtlasManager.instance.enabled
            } else if (msg.action === 'getDynamicAtlasCount') {
                const index = msg.data
                data = cc.DynamicAtlasManager.instance.atlasCount
            } else if (msg.action === 'getDynamicTextureData') {
                const index = msg.data
                data = getDynamicTextureData(index)
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
                console.log("this.m_isActive",this.m_isActive)
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

    /**资源添加进 cc.assetManager.assets */
    sendPush_resAdded(obj){
        return this._sendPush( 'onAssetAdded', obj);
    }

    /**资源从 cc.assetManager.assets 移出 */
    sendPush_resRemoveed(obj){
        return this._sendPush( 'onAssetRemoved', obj);
    }

    /**发送drawcall等信息 */
    sendPush_profile(){
        let stats = cc.profiler._stats
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
    public m_sceneTree: NodeTreeItem = null;

    /**当前场景 */
    public m_curSceneName:string = ""
    /**记录当前节点的uuid映射 */
    public m_nodeUuidMap:Record<string,cc.Node> = {}
    /**记录当前所有组件实例的uuid映射 */
    public m_compUuidMap:Record<string,cc.Component> = {}

    /**记录已经发送过的组件属性（用于inspectorUI显示），避免重复发送 */
    public m_hasSendCompAttrsMap:Record<string,boolean> = {}

    constructor(){
        cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH,this._onSceneChange,this)
    }

    doModifyNodeInfo(obj:ChangedNodeInfo){
        const _node = this.m_nodeUuidMap[obj.uuid]
        if(_node==null){
            return cc.js.formatStr("[ERROR] node is error,uuid:%s",obj.uuid)
        }
        try{
            let map:NodeInfo = obj.nodeChange as any
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
        const components:cc.Component[] = _node._components;
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

    async applyCompChange(_comp:cc.Component,map:Record<string,any>){
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
                        let asset = await new Promise<cc.Asset>((resolve)=>{
                            cc.assetManager.loadAny({uuid:newV},(err,asset)=>{
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
                if(oldV instanceof cc.Node || oldV instanceof cc.Asset || oldV instanceof cc.Component){
                    _comp[key] = null //不为null的情况，上面已经检查过了
                    continue
                }else {
                    if(oldV instanceof cc.Color){
                        _newV = cc.color().fromHEX(newV)
                    }else if(oldV instanceof cc.Vec2){
                        _newV = new cc.Vec2(newV.x??oldV.x,newV.y??oldV.y)
                    }else if(oldV instanceof cc.Vec3){
                        _newV = new cc.Vec3(newV.x??oldV.x,newV.y??oldV.y,newV.z??oldV.z)
                    }else if(oldV instanceof cc.Vec4){
                        _newV = new cc.Vec4(newV.x??oldV.x,newV.y??oldV.y,newV.z??oldV.z,newV.w??oldV.w)
                    }else if(oldV instanceof cc.Quat){
                        _newV = new cc.Quat(newV.x??oldV.x,newV.y??oldV.y,newV.z??oldV.z,newV.w??oldV.w)
                    }else if(oldV instanceof cc.Rect){
                        _newV = new cc.Rect(newV.x??oldV.x,newV.y??oldV.y,newV.width??oldV.width,newV.height??oldV.height)
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

    doModifyCompInfo(nodeUuid:string,obj:Record<string, Record<string, any>>){
        const _node = this.m_nodeUuidMap[nodeUuid]
        if(_node==null){
            return -1
        }
        //@ts-ignore
        const components:cc.Component[] = _node._components;
        for(let compUuid in obj){
            const _comp = components.find(item => item.uuid==compUuid)

            if(_comp==null){
                continue
            }
        }
        

        return 0
    }

    fiterCompsWithType(typeStr:CompType){
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

    getGameEnv(){
        let obj:GameEnvParam = {
            isNative:cc.sys.isNative,
            isBrowser:cc.sys.isBrowser,
            isMobile:cc.sys.isMobile,
            CC_DEV: DEV,
            CC_DEBUG: DEBUG,
            CC_PREVIEW: PREVIEW,
            CC_JSB: JSB,
            CC_SUPPORT_JIT: SUPPORT_JIT,
        }
        if(NATIVE){
            obj.writablePath = cc.native.fileUtils.getWritablePath()
        }
        return obj
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

        cc.assetManager.assets.forEach((asset,uuid)=>{
            this.m_waitForPushResArr.push(uuid)
        })
    }

    private _onSceneChange(sceneNode:cc.Scene){
        this.m_curSceneName = sceneNode.name

    }

    /**
     * 获取资源的使用情况,-1表示资源没有被加载
     * @param uuid 
     */
    getRefCount(uuid:string){
        const asset = cc.assetManager.assets.get(uuid);
        if(asset){
            return asset.refCount
        }
        return -1
    }

    private _checkRecordResMemInfo(uuid:string,asset?:cc.Asset){
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
     * 资源被添加进 cc.assetManager.assets
     */
    onAsset_added(key:string,asset:cc.Asset){
        this._checkRecordResMemInfo(key,asset)

        // this.checkPushAssetInfo()
    }
    /**
     * 资源被添加进 cc.assetManager.assets
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
                const asset = cc.assetManager.assets.get(uuid)
                if(asset==null){
                    fails.push(uuid)
                    continue
                }
                //@ts-ignore
                const classname = asset.__proto__.__classname__
                const obj:ResMemInfo = {
                    uuid,
                    classname,
                    refCount:asset.refCount,
                    memory : _getResMemory(asset),
                }
                
                if(asset instanceof cc.ImageAsset){
                    obj.width = asset.width
                    obj.height = asset.height
                    if(uuid.length==9){
                        obj.isAutoPackImg = true
                        obj.imgSrc = _getImageAssetUrl(asset)
                        if(cc.sys.isBrowser){
                            obj.isUrlImg = true
                        }else if(NATIVE){
                            obj.isNativeImg = true
                        }
                    }
                }else if(asset instanceof cc.Texture2D){
                    obj.width = asset.width
                    obj.height = asset.height
                    obj.imageUuid = asset.image?.uuid??asset.image?._uuid
                    if(uuid.length==15){
                        //@ts-ignore
                        obj.imgSrc = _getImageAssetUrl(asset.image)
                        obj.isAutoPackImg = true
                        if(cc.sys.isBrowser){
                            obj.isUrlImg = true
                        }else if(NATIVE){
                            obj.isNativeImg = true
                        }
                    }
                }else if(asset instanceof cc.SpriteFrame){
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

    onRes_addRef(asset:cc.Asset){
        this._checkRecordResMemInfo(asset.uuid??asset._uuid,asset)

        // this.checkPushAssetInfo()
    }

    onRes_decRef(asset:cc.Asset){
        this._checkRecordResMemInfo(asset.uuid??asset._uuid,asset)

        // this.checkPushAssetInfo()
    }

    onRes_destroy(asset:cc.Asset){
        
    }

    /**
     * 获取指定资源正在被多少个节点的相关组件使用
     * @param uuid 要检查的资源 (例如 cc.SpriteFrame)
     * @returns 所有引用该资源的节点和组件的uuid
     */
    getAssetUsageInScene(uuid: string): Record<string,Array<string>> {
        const _asset = cc.assetManager.assets.get(uuid);

        if (_asset == null) {
            console.error(`cc.Asset with UUID ${uuid} not found.`);
            return {};
        }

        const scene = cc.director.getScene(); // 获取当前场景
        if (!scene) {
            console.error('No active scene found.');
            return {};
        }

        const ret: Record<string,Array<string>> = {};//key为node.uuid，值为 comps.uuid[]

        // 遍历场景中的所有节点
        const preFunc = (node: cc.Node) => {
            let uuidsOfComp:Array<string> = []
            const _comps = node.components
            for(let comp of _comps){
                if(comp instanceof cc.UIRenderer){
                    if(comp.customMaterial==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }
                if(comp instanceof cc.Sprite){
                    if(comp.spriteFrame==_asset||comp.spriteAtlas==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof cc.Label){
                    if(comp.font==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof cc.EditBox){
                    if(comp.backgroundImage==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof cc.Mask){
                    if(comp.spriteFrame==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof cc.Camera){
                    if(comp.targetTexture==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof cc.ParticleSystem2D){
                    if(comp.file==_asset||comp.spriteFrame==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof cc.sp.Skeleton){
                    if(comp.skeletonData==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof cc.dragonBones.ArmatureDisplay){
                    if(comp.dragonAsset==_asset||comp.dragonAtlasAsset==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof cc.RichText){
                    if(comp.imageAtlas==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof cc.TiledMap){
                    if(comp.tmxAsset==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof cc.VideoPlayer){
                    if(comp.clip==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else if(comp instanceof cc.AudioSource){
                    if(comp.clip==_asset){
                        uuidsOfComp.push(comp.uuid)
                    }
                }else{
                    //这些是确定不会引用任何资源的组件，直接跳过
                    if(comp instanceof cc.Widget||comp instanceof cc.Layout||comp instanceof cc.UIOpacity||comp instanceof cc.Button
                        ||comp instanceof cc.PageView||comp instanceof cc.ScrollView||comp instanceof cc.ProgressBar||comp instanceof cc.Graphics
                        ||comp instanceof cc.ScrollBar||comp instanceof cc.Slider||comp instanceof cc.ToggleContainer||comp instanceof cc.Toggle
                        ||comp instanceof cc.ViewGroup||comp instanceof cc.SafeArea||comp instanceof cc.BlockInputEvents||comp instanceof cc.LabelOutline
                        ||comp instanceof cc.LabelShadow||comp instanceof cc.LabelShadow
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
     * @param uuid 要检查的资源 (例如 cc.SpriteFrame)
     * @returns 所有引用该资源的其他资源的uuid
     */
    getAssetUsageInOtherAsset(uuid:string){
        let ret = []
        cc.assetManager.assets.forEach((asset,key)=>{
            const deps = cc.assetManager.dependUtil.getDeps(key)
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
        const deps = cc.assetManager.dependUtil.getDeps(uuid)
        return deps
    }

    /**
     * 获取某个资源递归依赖的资源列表
     */
    getRecursiveDependsOfAsset(uuid:string){
        const deps = cc.assetManager.dependUtil.getDepsRecursively(uuid)
        return deps
    }

    /**
     * 获取某个节点直接依赖的资源列表
     * @param uuid 
     * @returns 
     */
    getDependsOfNode(uuid:string){
        const _node = this.m_nodeUuidMap[uuid]
        const _comps = _node.components

        const _uuids = []
        for(let comp of _comps){
            if(comp instanceof cc.UIRenderer){
                if(comp.customMaterial){
                    _uuids.push(comp.customMaterial.uuid)
                }
            }
            if(comp instanceof cc.Sprite){
                if(comp.spriteAtlas){
                    _uuids.push(comp.spriteAtlas.uuid)
                }
                if(comp.spriteFrame){
                    _uuids.push(comp.spriteFrame.uuid)
                }
            }else if(comp instanceof cc.Label){
                if(comp.font){
                    _uuids.push(comp.font.uuid)
                }
            }else if(comp instanceof cc.EditBox){
                if(comp.backgroundImage){
                    _uuids.push(comp.backgroundImage.uuid)
                }
            }else if(comp instanceof cc.Mask){
                if(comp.spriteFrame){
                    _uuids.push(comp.spriteFrame.uuid)
                }
            }else if(comp instanceof cc.Camera){
                if(comp.targetTexture){
                    _uuids.push(comp.targetTexture.uuid)
                }
            }else if(comp instanceof cc.ParticleSystem2D){
                if(comp.file){
                    _uuids.push(comp.file.uuid)
                }
                if(comp.spriteFrame){
                    _uuids.push(comp.spriteFrame.uuid)
                }
            }else if(comp instanceof cc.sp.Skeleton){
                if(comp.skeletonData){
                    _uuids.push(comp.skeletonData.uuid)
                }
            }else if(comp instanceof cc.dragonBones.ArmatureDisplay){
                if(comp.dragonAsset){
                    _uuids.push(comp.dragonAsset.uuid)
                }
                if(comp.dragonAtlasAsset){
                    _uuids.push(comp.dragonAtlasAsset.uuid)
                }
            }else if(comp instanceof cc.RichText){
                if(comp.imageAtlas){
                    _uuids.push(comp.imageAtlas.uuid)
                }
            }else if(comp instanceof cc.TiledMap){
                if(comp.tmxAsset){
                    _uuids.push(comp.tmxAsset.uuid)
                }
            }else if(comp instanceof cc.VideoPlayer){
                if(comp.clip){
                    _uuids.push(comp.clip.uuid)
                }
            }else if(comp instanceof cc.AudioSource){
                if(comp.clip){
                    _uuids.push(comp.clip.uuid)
                }
            }else{
                //这些是确定不会引用任何资源的组件，直接跳过
                if(comp instanceof cc.Widget||comp instanceof cc.Layout||comp instanceof cc.UIOpacity||comp instanceof cc.Button
                    ||comp instanceof cc.PageView||comp instanceof cc.ScrollView||comp instanceof cc.ProgressBar||comp instanceof cc.Graphics
                    ||comp instanceof cc.ScrollBar||comp instanceof cc.Slider||comp instanceof cc.ToggleContainer||comp instanceof cc.Toggle
                    ||comp instanceof cc.ViewGroup||comp instanceof cc.SafeArea||comp instanceof cc.BlockInputEvents||comp instanceof cc.LabelOutline
                    ||comp instanceof cc.LabelShadow||comp instanceof cc.LabelShadow
                ){
                    continue
                }else{
                    const _keys = Object.keys(comp)
                    for(let k of _keys){
                        if(typeof comp[k]=="object" && comp[k] instanceof cc.Asset){
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
        const ret = []
        const _node = this.m_nodeUuidMap[uuid]
        ret.push(...this.getDependsOfNode(_node.uuid))
        const preFunc = (node: cc.Node)=>{
            ret.push(...this.getDependsOfNode(node.uuid))
        }
        _node.walk(preFunc)
        return ret
    }

    private _fillNodeTree(treeObj: NodeTreeItem, children: Array<cc.Node>, parentPath: string = '') {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const childPath = parentPath?`${parentPath}/${child.name}`:child.name;
            const childTree: NodeTreeItem = {
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
    
    private _compareNodeTrees(tree1: NodeTreeItem, tree2: NodeTreeItem): boolean {
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
        const sceneNode: cc.Scene = cc.director.getScene();
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
        const nodeInfo:InspectorInfo_Node = {
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

    private _getComponentsInfo(node: cc.Node) {
        const componentsInfo:Array<CompInfo_Base> = [];
        const components = node.components;

        for (const component of components) {
            const info = this._getComponentProperties(component)
            componentsInfo.push(info);
        }

        return componentsInfo;
    }

    private _getComponentProperties(component: cc.Component):CompInfo_Base {
        const clsPrototype = component["__proto__"]
        const clsName = clsPrototype.__classname__
        if(clsName=="cc.MeshRenderer"){
            let g = 0;
        }
        let map = getAttrInfosOfComponentInst(component)
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
                val = component[k].map((item:cc.EventHandler)=>JSON.stringify({node:item?.target?.uuid,comp:item?._componentId,handler:item?.handler}))
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
            const comp = component as cc.UITransform
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

/**
 * 对 _getAttrInfosOfComponentProrotype 的补充
 */
function getAttrInfosOfComponentInst(compInst:cc.Component){
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
                if(_instVal instanceof cc.Color){
                    attrType = "cc.Color"
                }else if(_instVal instanceof cc.Vec2){
                    attrType = "cc.Vec2"
                }else if(_instVal instanceof cc.Vec3){
                    attrType = "cc.Vec3"
                }else if(_instVal instanceof cc.Vec4){
                    attrType = "cc.Vec4"
                }else if(_instVal instanceof cc.Rect){
                    attrType = "cc.Rect"
                }else if(_instVal instanceof cc.Size){
                    attrType = "cc.Size"
                }else if(_instVal instanceof cc.Node){
                    attrType = "cc.Node"
                }else if(_instVal instanceof cc.Component){
                    attrType = "cc.Component"
                }else if(_instVal instanceof cc.Asset){
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
        let v = attrs[`${name}$_$${p}`]??null
        // if(v==null&&p!="visible"&&p!="hasGetter"){
        //     if(_getAttr(attrs,name,"hasGetter")){
        //         v = _getAttr(attrs,`_${name}`,p)
        //         if(v==null){
        //             if(clsName=="Camera"){//camera有bug,手动修复
        //                 if(name=="clearColor"){
        //                     v = _getAttr(attrs,`_color`,p)
        //                 }else if(name=="clearDepth"){
        //                     v = _getAttr(attrs,`_depth`,p)
        //                 }else if(name=="clearStencil"){
        //                     v = _getAttr(attrs,`_stencil`,p)
        //                 }
        //             }
        //         }
        //     }
        // }
        return v
    }
    
    const _ctor = clsPrototype.constructor
    const props:Array<string> = _ctor.__props__
    const attrs = cc.CCClass.Attr.getClassAttrs(_ctor)

    const data = {}
    for(let k of props){
        if(k.startsWith("_")){
            continue
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
                if(param.default instanceof cc.Color){
                    param.type = "Color"
                }else if(param.default instanceof cc.Vec2){
                    param.type = "Vec2"
                }else if(param.default instanceof cc.Vec3){
                    param.type = "Vec3"
                }else if(param.default instanceof cc.Vec4){
                    param.type = "Vec4"
                }else if(param.default instanceof cc.Rect){
                    param.type = "Rect"
                }else if(param.default instanceof cc.Size){
                    param.type = "Size"
                }
            }
            
            
        }else if(param.type=="Object"){
            // if(param.ctor){
            //     param.type = param.ctor
            // }else{

            // }
            const isNode = cc.Node.prototype==pCtor.prototype || cc.Node.prototype.isPrototypeOf(pCtor.prototype)
            const isComponent = cc.Component.prototype==pCtor.prototype || cc.Component.prototype.isPrototypeOf(pCtor.prototype)
            const isAsset = cc.Asset.prototype==pCtor.prototype || cc.Asset.prototype.isPrototypeOf(pCtor.prototype)
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

function _getResMemory(asset:cc.Asset){
    if(asset instanceof cc.ImageAsset){
        return _memoryCaculator.getImageAssetMemorySize(asset)
    }
    return 0
}

function getDynamicTextureData(index:number){
    if(!cc.DynamicAtlasManager.instance.enabled){
        return null
    }
    //@ts-ignore
    const _atlases = cc.DynamicAtlasManager.instance._atlases
    if(_atlases.length==0){
        return null;
    }
    const _tex = _atlases[0]._texture;
    if(_tex==null){
        return null
    }
    
    const arr = readPixels(_tex,false)
    const base64String = uint8ArrayToBase64(arr)
    return {width:_tex.width,height:_tex.height,base64Data:base64String}
}

function readPixels(texture: cc.Texture2D, flipY = true): Uint8Array {
    const { width, height } = texture;
    const gfxTexture = texture.getGFXTexture();
    const gfxDevice = texture['_getGFXDevice']();
    const bufferViews = [];
    const region = new cc.gfx.BufferTextureCopy;
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

async function evalJsStr(jsStr:string){
    try{
        const content = cc.js.formatStr("(async function(){%s})()",jsStr)
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

namespace _memoryCaculator{
    export function getImageAssetMemorySize(imageAsset: cc.ImageAsset): number {
        const width = imageAsset.width;
        const height = imageAsset.height;
        const format = imageAsset.format; // 像素格式
    
        let bytesPerPixel = 4; // 默认 RGBA8888 格式，每个像素 4 字节
    
        switch (format) {
            case cc.Texture2D.PixelFormat.RGBA8888:
                bytesPerPixel = 4;
                break;
            case cc.Texture2D.PixelFormat.RGB888:
                bytesPerPixel = 3;
                break;
            case cc.Texture2D.PixelFormat.RGBA4444:
            case cc.Texture2D.PixelFormat.RGB565:
                bytesPerPixel = 2;
                break;
            case cc.Texture2D.PixelFormat.A8:
                bytesPerPixel = 1;
                break;
            // 其他格式根据需要添加
        }
    
        return width * height * bytesPerPixel;
    }
}



function _getSelfModelName() {
    let model = "";

    if (cc.sys.isNative) {
        if (cc.sys.os === cc.sys.OS.ANDROID) {
            model = "native_android";
        } else if (cc.sys.os === cc.sys.OS.IOS) {
            model = "native_ios";
        } else if (cc.sys.os === cc.sys.OS.WINDOWS) {
            model = "native_windows";
        } else if (cc.sys.os === cc.sys.OS.OSX) {
            model = "native_osx";
        } else if (cc.sys.os === cc.sys.OS.OHOS) {
            model = "native_ohos";
        } else if (cc.sys.os === cc.sys.OS.LINUX) {
            model = "native_linux";
        } else {
            model = "native_unknown";
        }
    } else {
        if (cc.sys.platform === cc.sys.Platform.ALIPAY_MINI_GAME) {
            model = "alipay_mini_game";
        } else if (cc.sys.platform === cc.sys.Platform.WECHAT_GAME) {
            model = "wechat_game";
        } else if (cc.sys.platform === cc.sys.Platform.QTT_MINI_GAME) {
            model = "qq_play";
        } else if (cc.sys.platform === cc.sys.Platform.BYTEDANCE_MINI_GAME) {
            model = "bytedance_mini_game";
        } else if (cc.sys.platform === cc.sys.Platform.BAIDU_MINI_GAME) {
            model = "baidu_mini_game";
        } else if (cc.sys.platform === cc.sys.Platform.XIAOMI_QUICK_GAME) {
            model = "xiaomi_quick_game";
        } else if (cc.sys.platform === cc.sys.Platform.OPPO_MINI_GAME) {
            model = "oppo_mini_game";
        } else if (cc.sys.platform === cc.sys.Platform.VIVO_MINI_GAME) {
            model = "vivo_mini_game";
        } else if (cc.sys.platform === cc.sys.Platform.TAOBAO_CREATIVE_APP) {
            model = "taobao_creative_app";
        } else if (cc.sys.platform === cc.sys.Platform.TAOBAO_MINI_GAME) {
            model = "taobao_mini_game";
        } else if (cc.sys.platform === cc.sys.Platform.COCOSPLAY) {
            model = "cocosplay";
        } else if (cc.sys.platform === cc.sys.Platform.LINKSURE_MINI_GAME) {
            model = "linksure_mini_game";
        } else if (cc.sys.platform === cc.sys.Platform.HUAWEI_QUICK_GAME) {
            model = "huawei_quick_game";
        } else if (cc.sys.browserType === cc.sys.BrowserType.CHROME) {
            model = "browser_chrome";
        } else if (cc.sys.browserType === cc.sys.BrowserType.FIREFOX) {
            model = "browser_firefox";
        } else if (cc.sys.browserType === cc.sys.BrowserType.SAFARI) {
            model = "browser_safari";
        } else if (cc.sys.browserType === cc.sys.BrowserType.EDGE) {
            model = "browser_edge";
        } else if (cc.sys.browserType === cc.sys.BrowserType.IE) {
            model = "browser_ie";
        } else if (cc.sys.browserType === cc.sys.BrowserType.OPERA) {
            model = "browser_opera";
        } else if (cc.sys.browserType === cc.sys.BrowserType.MIUI) {
            model = "browser_miui";
        } else if (cc.sys.browserType === cc.sys.BrowserType.UC) {
            model = "browser_uc";
        } else if (cc.sys.browserType === cc.sys.BrowserType.QQ) {
            model = "browser_qq";
        } else if (cc.sys.browserType === cc.sys.BrowserType.BAIDU) {
            model = "browser_baidu";
        } else {
            model = "unknown";
        }

        if (cc.sys.os === cc.sys.OS.ANDROID) {
            model = "android" + "_" +model;
        } else if (cc.sys.os === cc.sys.OS.IOS) {
            model = "ios" + "_" +model;
        } else if (cc.sys.os === cc.sys.OS.WINDOWS) {
            model = "windows" + "_" +model;
        } else if (cc.sys.os === cc.sys.OS.OSX) {
            model = "osx" + "_" +model;
        } else if (cc.sys.os === cc.sys.OS.OHOS) {
            model = "ohos" + "_" +model;
        } else if (cc.sys.os === cc.sys.OS.LINUX) {
            model = "linux" + "_" +model;
        }
    }

    if(cc.sys.isXR){
        model += "_isXR"
    }

    return model;
}

function interceptLog(){
    let _handleLog = window["cc_debuger_handleLog"]
    if(!_handleLog){
        window["cc_debuger_handleLog"] = _handleLog = function (level: LogLevel, args: any[]) {
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
            const logEntry: LogEntry = {
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

function _getImageAssetUrl(asset:cc.ImageAsset){
    if(cc.sys.isBrowser && asset.nativeUrl){
        const baseUrl = window.location.origin; // http://192.168.1.17:7456
        const fullPath = window.location.pathname; // /web-desktop/web-desktop/index.html
        const subPath = fullPath.substring(0, fullPath.lastIndexOf('/') + 1); // /web-desktop/web-desktop/

        const imgSrc = `${baseUrl}${subPath}${asset.nativeUrl}`;
        return imgSrc
    }else if(NATIVE && asset.url){
        const imgPath = cc.native.fileUtils.fullPathForFilename(asset.url)
        return imgPath
    }
}

/**获取可写目录下的目录结构 */
function getWitablePathFilesInfo():Array<WritableFileInfo>{
    if(!NATIVE){
        return []
    }
    
    const writablePath = cc.native.fileUtils.getWritablePath()
    function traverse(floder:string){
        const files = cc.native.fileUtils.listFiles(floder)
        const newList = []
        for(let i=files.length-1;i>=0;i--){
            const f = files[i]
            const x = cc.native.fileUtils.fullPathForFilename(f)
            if(x!=f){
                continue
            }
            
            let isFloder = cc.native.fileUtils.isDirectoryExist(f)
            let relativePath = f.replace(writablePath,"")
            relativePath = cc.path.stripSep(relativePath)
            const name = cc.path.basename(relativePath)
            const obj:WritableFileInfo = {
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
    const arr:Array<WritableFileInfo> = traverse(writablePath)
    // console.log("getWitablePathFilesInfo",arr)
    return arr
}

function getWritableFileData(filePath:string){
    if(!NATIVE){
        return null
    }
    const arr = cc.native.fileUtils.getDataFromFile(filePath);
    if (!arr || arr.byteLength <= 0) return null;
    const u8a = new Uint8Array(arr);
    const base64Str = uint8ArrayToBase64(u8a)
    return base64Str
}

let _runtimeSocket:RunTimeSocket = null
function _initOnce() {
    _data = new _RuntimeData();
    _runtimeSocket = new RunTimeSocket();
    _runtimeSocket.initSocket(plugin_server_address);

    _data.initAssetForPush()
    
    const _addRef = cc.Asset.prototype.addRef
    const _decRef = cc.Asset.prototype.decRef
    const _destroy = cc.Asset.prototype.destroy

    //@ts-ignore
    const cls_Cache = cc.assetManager.assets.__proto__
    const _add = cls_Cache?.add;
    const _remove = cls_Cache?.remove;
    if(_add){
        cc.assetManager.assets.add = function(key,val){
            // console.log("add key",key)
            
            let ret = _add.call(cc.assetManager.assets,key,val)
            _data.onAsset_added(key,val)
            return ret
        }
    }
    if(_remove){
        cc.assetManager.assets.remove = function(key){
            // console.log("remove key",key)
            
            let ret = _remove.call(cc.assetManager.assets,key)
            _data.onAsset_removed(key)
            return ret
        }
    }

    cc.Asset.prototype.addRef = function(){
        let ret = _addRef.call(this)

        _data.onRes_addRef(this)
        return ret
    }
    cc.Asset.prototype.decRef = function(autoRelease?: boolean){
        let ret = _decRef.call(this,autoRelease)

        _data.onRes_decRef(this)
        return ret
    }

    cc.Asset.prototype.destroy = function(autoRelease?: boolean){
        let ret = _destroy.call(this,autoRelease)

        _data.onRes_destroy(this)
        return ret
    }

    const duration = 1000
    setInterval(() => {
        _runtimeSocket.loop(duration)
    }, duration);

    
    cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, () => {
        _runtimeSocket.sendPush_sceneLaunched()
        _runtimeSocket.sendPush_checkUpdateSceneTree()
    })

    interceptLog()
}

if (!EDITOR) {

    cc.director.once(cc.Director.EVENT_BEFORE_SCENE_LAUNCH,_initOnce)
}

var plugin_server_address = `ws://localhost:8085`