
import { sys } from 'cc';
import { Asset } from 'cc';
import { Color } from 'cc';
import { Button } from 'cc';
import { Camera } from 'cc';
import { Graphics } from 'cc';
import { Mask } from 'cc';
import { PageView } from 'cc';
import { ScrollView } from 'cc';
import { Widget } from 'cc';
import { Vec2 } from 'cc';
import { color } from 'cc';
import { Rect } from 'cc';
import { Size } from 'cc';
import { EventHandler } from 'cc';
import { profiler } from 'cc';
import { native } from 'cc';
import { log } from 'cc';
import { CCClass } from 'cc';
import { Vec4 } from 'cc';
import { Quat } from 'cc';
import { Vec3 } from 'cc';
import { Canvas } from 'cc';
import { UIOpacity } from 'cc';
import { ParticleSystem2D } from 'cc';
import { UITransform } from 'cc';
import { Layout } from 'cc';
import { EditBox } from 'cc';
import { js } from 'cc';
import { RichText } from 'cc';
import { Scene } from 'cc';
import { Director } from 'cc';
import { 
    assetManager, director, Node, 
    SpriteFrame, Sprite, AnimationClip, Animation, AudioClip, AudioSource, Material, Renderer, Prefab, 
    Texture2D, MeshRenderer, Mesh, 
    Skeleton, ParticleAsset, ParticleSystem, 
    Font, Label, SpriteAtlas, VideoClip, ImageAsset, TextAsset, JsonAsset, EffectAsset, 
    Component,
    sp
} from 'cc';

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
                const content = js.formatStr("(async function(){%s})()",msg.data)
                eval(content).then((ret)=>{
                    const type = typeof ret;
                    if(type=="object"){
                        ret = JSON.stringify(ret)
                    }else{
                        ret = ret + ""
                    }
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
                    profiler.showStats()
                }else if(bool=="false"){
                    profiler.hideStats()
                }
                data = profiler.isShowingStats()
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

    /**资源添加进 assetManager.assets */
    sendPush_resAdded(obj){
        return this._sendPush( 'onAssetAdded', obj);
    }

    /**资源从 assetManager.assets 移出 */
    sendPush_resRemoveed(obj){
        return this._sendPush( 'onAssetRemoved', obj);
    }

    /**发送drawcall等信息 */
    sendPush_profile(){
        let stats = profiler._stats
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
    public m_nodeUuidMap:Record<string,Node> = {}
    /**记录当前所有组件实例的uuid映射 */
    public m_compUuidMap:Record<string,Component> = {}

    /**记录已经发送过的组件属性（用于inspectorUI显示），避免重复发送 */
    public m_hasSendCompAttrsMap:Record<string,boolean> = {}

    constructor(){
        director.on(Director.EVENT_AFTER_SCENE_LAUNCH,this._onSceneChange,this)
    }

    doModifyNodeInfo(obj:ChangedNodeInfo){
        const _node = this.m_nodeUuidMap[obj.uuid]
        if(_node==null){
            return js.formatStr("[ERROR] node is error,uuid:%s",obj.uuid)
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
        const components:Component[] = _node._components;
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

    async applyCompChange(_comp:Component,map:Record<string,any>){
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
                        let asset = await new Promise<Asset>((resolve)=>{
                            assetManager.loadAny({uuid:newV},(err,asset)=>{
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
                if(oldV instanceof Node || oldV instanceof Asset || oldV instanceof Component){
                    _comp[key] = null //不为null的情况，上面已经检查过了
                    continue
                }else {
                    if(oldV instanceof Color){
                        _newV = color().fromHEX(newV)
                    }else if(oldV instanceof Vec2){
                        _newV = new Vec2(newV.x??oldV.x,newV.y??oldV.y)
                    }else if(oldV instanceof Vec3){
                        _newV = new Vec3(newV.x??oldV.x,newV.y??oldV.y,newV.z??oldV.z)
                    }else if(oldV instanceof Vec4){
                        _newV = new Vec4(newV.x??oldV.x,newV.y??oldV.y,newV.z??oldV.z,newV.w??oldV.w)
                    }else if(oldV instanceof Quat){
                        _newV = new Quat(newV.x??oldV.x,newV.y??oldV.y,newV.z??oldV.z,newV.w??oldV.w)
                    }else if(oldV instanceof Rect){
                        _newV = new Rect(newV.x??oldV.x,newV.y??oldV.y,newV.width??oldV.width,newV.height??oldV.height)
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
        const components:Component[] = _node._components;
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
            isNative:sys.isNative,
            isBrowser:sys.isBrowser,
            isMobile:sys.isMobile,
            CC_DEV: DEV,
            CC_DEBUG: DEBUG,
            CC_PREVIEW: PREVIEW,
            CC_JSB: JSB,
            CC_SUPPORT_JIT: SUPPORT_JIT,
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

        assetManager.assets.forEach((asset,uuid)=>{
            this.m_waitForPushResArr.push(uuid)
        })
    }

    private _onSceneChange(sceneNode:Scene){
        this.m_curSceneName = sceneNode.name

    }

    /**
     * 获取资源的使用情况,-1表示资源没有被加载
     * @param uuid 
     */
    getRefCount(uuid:string){
        const asset = assetManager.assets.get(uuid);
        if(asset){
            return asset.refCount
        }
        return -1
    }

    private _checkRecordResMemInfo(uuid:string,asset?:Asset){
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
     * 资源被添加进 assetManager.assets
     */
    onAsset_added(key:string,asset:Asset){
        this._checkRecordResMemInfo(key,asset)

        // this.checkPushAssetInfo()
    }
    /**
     * 资源被添加进 assetManager.assets
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
                const asset = assetManager.assets.get(uuid)
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
                
                if(asset instanceof ImageAsset){
                    obj.width = asset.width
                    obj.height = asset.height
                    if(uuid.length==9){
                        obj.isAutoPackImg = true
                        obj.imgSrc = _getImactAssetUrl(asset)
                        if(sys.isBrowser){
                            obj.isUrlImg = true
                        }else if(NATIVE){
                            obj.isNativeImg = true
                        }
                    }
                }else if(asset instanceof Texture2D){
                    obj.width = asset.width
                    obj.height = asset.height
                    obj.imageUuid = asset.image?.uuid??asset.image?._uuid
                    if(uuid.length==15){
                        //@ts-ignore
                        obj.imgSrc = _getImactAssetUrl(asset.image)
                        obj.isAutoPackImg = true
                        if(sys.isBrowser){
                            obj.isUrlImg = true
                        }else if(NATIVE){
                            obj.isNativeImg = true
                        }
                    }
                }else if(asset instanceof SpriteFrame){
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

    onRes_addRef(asset:Asset){
        this._checkRecordResMemInfo(asset.uuid??asset._uuid,asset)

        // this.checkPushAssetInfo()
    }

    onRes_decRef(asset:Asset){
        this._checkRecordResMemInfo(asset.uuid??asset._uuid,asset)

        // this.checkPushAssetInfo()
    }

    onRes_destroy(asset:Asset){
        
    }

    /**
     * 获取指定资源正在被多少个节点的相关组件使用
     * @param uuid 要检查的资源 (例如 SpriteFrame)
     * @returns 所有引用该资源的组件的uuid的列表
     */
    getAssetUsageInScene(uuid: string): string[] {
        const asset = assetManager.assets.get(uuid);

        if (asset == null) {
            console.error(`Asset with UUID ${uuid} not found.`);
            return [];
        }

        const scene = director.getScene(); // 获取当前场景
        if (!scene) {
            console.error('No active scene found.');
            return [];
        }

        const ret: string[] = [];

        // 遍历场景中的所有节点
        scene.walk((node: Node) => {
            // 检查 SpriteFrame
            if (asset instanceof SpriteFrame) {
                const _comp = node.getComponent(Sprite);
                if (_comp && _comp.spriteFrame === asset) {
                    ret.push(_comp.uuid);
                }
            }
            // 检查 AnimationClip
            else if (asset instanceof AnimationClip) {
                const _comp = node.getComponent(Animation);
                if (_comp && _comp.clips.includes(asset)) {
                    ret.push(_comp.uuid);
                }
            }
            // 检查 AudioClip
            else if (asset instanceof AudioClip) {
                const _comp = node.getComponent(AudioSource);
                if (_comp && _comp.clip === asset) {
                    ret.push(_comp.uuid);
                }
            }
            // 检查 Material
            else if (asset instanceof Material) {
                const _comp = node.getComponent(Renderer);
                if (_comp && _comp.materials.includes(asset as any)) {
                    ret.push(_comp.uuid);
                }
            }
            // 检查 Prefab
            else if (asset instanceof Prefab) {
                // @ts-ignore
                if (node.prefabInfo?.asset === asset) {
                    ret.push(node.uuid);
                }
            }
            // 检查 Texture2D
            else if (asset instanceof Texture2D) {
                const spriteComp = node.getComponent(Sprite);
                if (spriteComp && spriteComp.spriteFrame?.texture === asset) {
                    ret.push(spriteComp.uuid);
                }
                const rendererComp = node.getComponent(Renderer);
                if (rendererComp && rendererComp.materials.some(mat => mat?.getProperty('mainTexture') === asset)) {
                    ret.push(rendererComp.uuid);
                }
            }
            else if (asset instanceof sp.SkeletonData) {
                const spComp = node.getComponent(sp.Skeleton);
                if (spComp && spComp.skeletonData === asset) {
                    ret.push(spComp.uuid);
                }
            }
            // 检查 Mesh
            else if (asset instanceof Mesh) {
                const meshRendererComp = node.getComponent(MeshRenderer);
                if (meshRendererComp && meshRendererComp.mesh === asset) {
                    ret.push(meshRendererComp.uuid);
                }
            }
            // 检查 ParticleAsset
            else if (asset instanceof ParticleAsset) {
                const particleComp = node.getComponent(ParticleSystem);
                // @ts-ignore
                if (particleComp && particleComp.file === asset) {
                    ret.push(particleComp.uuid);
                }
            }
            // 检查 Font
            else if (asset instanceof Font) {
                const labelComp = node.getComponent(Label);
                if (labelComp && labelComp.font === asset) {
                    ret.push(labelComp.uuid);
                }
            }
            // 检查 SpriteAtlas
            else if (asset instanceof SpriteAtlas) {
                const spriteComp = node.getComponent(Sprite);
                if (spriteComp && asset.getSpriteFrame(spriteComp.spriteFrame?.name || '') === spriteComp.spriteFrame) {
                    ret.push(spriteComp.uuid);
                }
            }
            // 检查 VideoClip
            else if (asset instanceof VideoClip) {
                // Add logic if applicable, since VideoPlayer component may reference this
            }
            // 检查 ImageAsset
            else if (asset instanceof ImageAsset) {
                // Add logic if this is directly used or referenced
            }
            // 检查 TextAsset
            else if (asset instanceof TextAsset) {
                // Add logic if this is directly used or referenced
            }
            // 检查 JsonAsset
            else if (asset instanceof JsonAsset) {
                // Add logic if this is directly used or referenced
            }
            // 检查 EffectAsset
            else if (asset instanceof EffectAsset) {
                const rendererComp = node.getComponent(Renderer);
                if (rendererComp && rendererComp.materials.some(mat => mat?.effectAsset === asset)) {
                    ret.push(rendererComp.uuid);
                }
            }
        });

        return ret;
    }

    private _fillNodeTree(treeObj: NodeTreeItem, children: Array<Node>, parentPath: string = '') {
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
        const sceneNode: Scene = director.getScene();
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

    private _getComponentsInfo(node: Node) {
        const componentsInfo:Array<CompInfo_Base> = [];
        const components = node.components;

        for (const component of components) {
            const info = this._getComponentProperties(component)
            componentsInfo.push(info);
        }

        return componentsInfo;
    }

    private _getComponentProperties(component: Component):CompInfo_Base {
        const clsPrototype = component["__proto__"]
        const clsName = clsPrototype.__classname__
        let map = getAttrInfosOfComponentInst(component)
        let data = {}
        for(let k in map){
            
            data[k] = component[k]
            if(map[k].type=="Node"||map[k].type=="Component"||map[k].type=="Asset"){
                data[k] = data[k]?.uuid??""
            }else if(map[k].type=="Color"){
                data[k] = data[k].toHEX()
            }else if(map[k].ctor=="cc.ClickEvent"){
                data[k] = component[k].map((item:EventHandler)=>JSON.stringify({node:item?.target?.uuid,comp:item?._componentId,handler:item?.handler}))
            }
        }
        if(clsName === "cc.UITransform"){//因为UITransform比较特殊，contentSize和anchorPoint都是readonly的，实际是通过width、height/anchorX、anchorY修改的
            const comp = component as UITransform
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
function getAttrInfosOfComponentInst(compInst:Component){
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
                if(_instVal instanceof Color){
                    attrType = "Color"
                }else if(_instVal instanceof Vec2){
                    attrType = "Vec2"
                }else if(_instVal instanceof Vec3){
                    attrType = "Vec3"
                }else if(_instVal instanceof Vec4){
                    attrType = "Vec4"
                }else if(_instVal instanceof Rect){
                    attrType = "Rect"
                }else if(_instVal instanceof Size){
                    attrType = "Size"
                }else if(_instVal instanceof Node){
                    attrType = "Node"
                }else if(_instVal instanceof Component){
                    attrType = "Component"
                }else if(_instVal instanceof Asset){
                    attrType = "Asset"
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
        //             if(clsName=="cc.Camera"){//camera有bug,手动修复
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
    const attrs = CCClass.Attr.getClassAttrs(_ctor)

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
        type PType = "string"|"boolean"|"number"|
        "Enum"|"Object"|
        "Node"|"Component"|"Asset"|"Color"|"Vec2"|"Vec3"|"Vec4"|"Rect"|"Size"
        const pCtor = _getAttr(attrs,k,"ctor")
        const pCtorClassname = pCtor?.prototype?.__classname__
        const param = {
            displayOrder : _getAttr(attrs,k,"displayOrder") as number,
            displayName : _getAttr(attrs,k,"displayName") as string,
            type : _getAttr(attrs,k,"type") as PType,
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
                if(param.default instanceof Color){
                    param.type = "Color"
                }else if(param.default instanceof Vec2){
                    param.type = "Vec2"
                }else if(param.default instanceof Vec3){
                    param.type = "Vec3"
                }else if(param.default instanceof Vec4){
                    param.type = "Vec4"
                }else if(param.default instanceof Rect){
                    param.type = "Rect"
                }else if(param.default instanceof Size){
                    param.type = "Size"
                }
            }
            
            
        }else if(param.type=="Object"){
            // if(param.ctor){
            //     param.type = param.ctor
            // }else{

            // }
            const isNode = Node.prototype==pCtor.prototype || Node.prototype.isPrototypeOf(pCtor.prototype)
            const isComponent = Component.prototype==pCtor.prototype || Component.prototype.isPrototypeOf(pCtor.prototype)
            const isAsset = Asset.prototype==pCtor.prototype || Asset.prototype.isPrototypeOf(pCtor.prototype)
            if(isNode){
                param.type = "Node"
            }else if(isComponent){
                param.type = "Component"
            }else if(isAsset){
                param.type = "Asset"
            }else if(param.ctor=="cc.ClickEvent"){
                let g = 0 
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

function _getResMemory(asset:Asset){
    if(asset instanceof ImageAsset){
        return _memoryCaculator.getImageAssetMemorySize(asset)
    }
    return 0
}

namespace _memoryCaculator{
    export function getImageAssetMemorySize(imageAsset: ImageAsset): number {
        const width = imageAsset.width;
        const height = imageAsset.height;
        const format = imageAsset.format; // 像素格式
    
        let bytesPerPixel = 4; // 默认 RGBA8888 格式，每个像素 4 字节
    
        switch (format) {
            case Texture2D.PixelFormat.RGBA8888:
                bytesPerPixel = 4;
                break;
            case Texture2D.PixelFormat.RGB888:
                bytesPerPixel = 3;
                break;
            case Texture2D.PixelFormat.RGBA4444:
            case Texture2D.PixelFormat.RGB565:
                bytesPerPixel = 2;
                break;
            case Texture2D.PixelFormat.A8:
                bytesPerPixel = 1;
                break;
            // 其他格式根据需要添加
        }
    
        return width * height * bytesPerPixel;
    }
}



function _getSelfModelName() {
    let model = "";

    if (sys.isNative) {
        if (sys.os === sys.OS.ANDROID) {
            model = "native_android";
        } else if (sys.os === sys.OS.IOS) {
            model = "native_ios";
        } else if (sys.os === sys.OS.WINDOWS) {
            model = "native_windows";
        } else if (sys.os === sys.OS.OSX) {
            model = "native_osx";
        } else if (sys.os === sys.OS.OHOS) {
            model = "native_ohos";
        } else if (sys.os === sys.OS.LINUX) {
            model = "native_linux";
        } else {
            model = "native_unknown";
        }
    } else {
        if (sys.platform === sys.Platform.ALIPAY_MINI_GAME) {
            model = "alipay_mini_game";
        } else if (sys.platform === sys.Platform.WECHAT_GAME) {
            model = "wechat_game";
        } else if (sys.platform === sys.Platform.QTT_MINI_GAME) {
            model = "qq_play";
        } else if (sys.platform === sys.Platform.BYTEDANCE_MINI_GAME) {
            model = "bytedance_mini_game";
        } else if (sys.platform === sys.Platform.BAIDU_MINI_GAME) {
            model = "baidu_mini_game";
        } else if (sys.platform === sys.Platform.XIAOMI_QUICK_GAME) {
            model = "xiaomi_quick_game";
        } else if (sys.platform === sys.Platform.OPPO_MINI_GAME) {
            model = "oppo_mini_game";
        } else if (sys.platform === sys.Platform.VIVO_MINI_GAME) {
            model = "vivo_mini_game";
        } else if (sys.platform === sys.Platform.TAOBAO_CREATIVE_APP) {
            model = "taobao_creative_app";
        } else if (sys.platform === sys.Platform.TAOBAO_MINI_GAME) {
            model = "taobao_mini_game";
        } else if (sys.platform === sys.Platform.COCOSPLAY) {
            model = "cocosplay";
        } else if (sys.platform === sys.Platform.LINKSURE_MINI_GAME) {
            model = "linksure_mini_game";
        } else if (sys.platform === sys.Platform.HUAWEI_QUICK_GAME) {
            model = "huawei_quick_game";
        } else if (sys.browserType === sys.BrowserType.CHROME) {
            model = "browser_chrome";
        } else if (sys.browserType === sys.BrowserType.FIREFOX) {
            model = "browser_firefox";
        } else if (sys.browserType === sys.BrowserType.SAFARI) {
            model = "browser_safari";
        } else if (sys.browserType === sys.BrowserType.EDGE) {
            model = "browser_edge";
        } else if (sys.browserType === sys.BrowserType.IE) {
            model = "browser_ie";
        } else if (sys.browserType === sys.BrowserType.OPERA) {
            model = "browser_opera";
        } else if (sys.browserType === sys.BrowserType.MIUI) {
            model = "browser_miui";
        } else if (sys.browserType === sys.BrowserType.UC) {
            model = "browser_uc";
        } else if (sys.browserType === sys.BrowserType.QQ) {
            model = "browser_qq";
        } else if (sys.browserType === sys.BrowserType.BAIDU) {
            model = "browser_baidu";
        } else {
            model = "unknown";
        }

        if (sys.os === sys.OS.ANDROID) {
            model = "android" + "_" +model;
        } else if (sys.os === sys.OS.IOS) {
            model = "ios" + "_" +model;
        } else if (sys.os === sys.OS.WINDOWS) {
            model = "windows" + "_" +model;
        } else if (sys.os === sys.OS.OSX) {
            model = "osx" + "_" +model;
        } else if (sys.os === sys.OS.OHOS) {
            model = "ohos" + "_" +model;
        } else if (sys.os === sys.OS.LINUX) {
            model = "linux" + "_" +model;
        }
    }

    if(sys.isXR){
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

function _getImactAssetUrl(asset:ImageAsset){
    if(sys.isBrowser && asset.nativeUrl){
        const baseUrl = window.location.origin; // http://192.168.1.17:7456
        const fullPath = window.location.pathname; // /web-desktop/web-desktop/index.html
        const subPath = fullPath.substring(0, fullPath.lastIndexOf('/') + 1); // /web-desktop/web-desktop/

        const imgSrc = `${baseUrl}${subPath}${asset.nativeUrl}`;
        return imgSrc
    }else if(NATIVE && asset.url){
        const imgPath = native.fileUtils.fullPathForFilename(asset.url)
        return imgPath
    }
}

let _runtimeSocket:RunTimeSocket = null
function _initOnce() {
    _data = new _RuntimeData();
    _runtimeSocket = new RunTimeSocket();
    _runtimeSocket.initSocket(plugin_server_address);

    _data.initAssetForPush()
    
    const _addRef = Asset.prototype.addRef
    const _decRef = Asset.prototype.decRef
    const _destroy = Asset.prototype.destroy

    //@ts-ignore
    const cls_Cache = assetManager.assets.__proto__
    const _add = cls_Cache?.add;
    const _remove = cls_Cache?.remove;
    if(_add){
        assetManager.assets.add = function(key,val){
            // console.log("add key",key)
            
            let ret = _add.call(assetManager.assets,key,val)
            _data.onAsset_added(key,val)
            return ret
        }
    }
    if(_remove){
        assetManager.assets.remove = function(key){
            // console.log("remove key",key)
            
            let ret = _remove.call(assetManager.assets,key)
            _data.onAsset_removed(key)
            return ret
        }
    }

    Asset.prototype.addRef = function(){
        let ret = _addRef.call(this)

        _data.onRes_addRef(this)
        return ret
    }
    Asset.prototype.decRef = function(autoRelease?: boolean){
        let ret = _decRef.call(this,autoRelease)

        _data.onRes_decRef(this)
        return ret
    }

    Asset.prototype.destroy = function(autoRelease?: boolean){
        let ret = _destroy.call(this,autoRelease)

        _data.onRes_destroy(this)
        return ret
    }

    const duration = 1000
    setInterval(() => {
        _runtimeSocket.loop(duration)
    }, duration);

    
    director.on(Director.EVENT_AFTER_SCENE_LAUNCH, () => {
        _runtimeSocket.sendPush_sceneLaunched()
        _runtimeSocket.sendPush_checkUpdateSceneTree()
    })

    interceptLog()
}

if (!EDITOR) {

    director.once(Director.EVENT_BEFORE_SCENE_LAUNCH,_initOnce)
}

var plugin_server_address = `ws://localhost:8085`