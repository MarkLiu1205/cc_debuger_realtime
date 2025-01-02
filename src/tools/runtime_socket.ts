
import { sys } from 'cc';
import { Asset } from 'cc';
import { Color } from 'cc';
import { Button } from 'cc';
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
import { EDITOR } from 'cc/env';

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
        console.log("onMesage",JSON.stringify(msg))
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
            if (msg.action === 'getNewAddedAssets') {
                const uuids:Array<string> = [];
                assetManager.assets.forEach((_, uuid) => uuids.push(uuid));
                data = _data.getNewAddedAssets()
            } else if (msg.action === 'getRefCount') {
                const uuid = msg.data.uuid;
                data = _data.getRefCount(uuid)
            } else if (msg.action === 'getNodeInfo') {
                const uuid = msg.data.uuid;
                data = _data.getNodeInfo(uuid)
            }
    
            responseData.data = data
            this._send(responseData);
        }else if(msg.type === "push"){
            if (msg.action === 'markActive'){
                this.m_isActive = msg.data as boolean
                if(!this.m_isActive){
                    _data.clear()
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

    loop(){
        if(!this._checkIsConnect()){
            return
        }
        if(!this.m_isActive){
            return
        }

        if(_data.searchNodeTree()){
            this._send({ type: 'push', action: 'updateSceneTree', data: _data.m_sceneTree });
        }
    }
}

class _RuntimeData{
    /**记录出现过的uuid和相应引用计数 */
    public m_assetUuidMap:Record<string,number> = {}
    /**当前节点数 */
    public m_sceneTree: NodeTreeItem = null;

    /**当前场景 */
    public m_curSceneName:string = ""
    /**记录当前节点的uuid映射 */
    public m_nodeUuidMap:Record<string,Node> = {}

    constructor(){
        director.on(Director.EVENT_AFTER_SCENE_LAUNCH,this._onSceneChange,this)
    }

    clear(){
        this.m_assetUuidMap = {}
        this.m_sceneTree = null
    }

    private _onSceneChange(sceneNode:Scene){
        this.m_curSceneName = sceneNode.name

    }

    /**
     * 获取相对于上次的新增资源的uuid和相应引用计数
     * @returns 
     */
    getNewAddedAssets() {
        const ret:Record<string,number> = {}
        assetManager.assets.forEach((info, uuid) =>{
            if(this.m_assetUuidMap[uuid]==null || this.m_assetUuidMap[uuid]!=info.refCount){
                ret[uuid] = info.refCount
                this.m_assetUuidMap[uuid] = info.refCount
            }   
        });
        return ret
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

    onRes_addRef(asset:Asset){
        
    }

    onRes_decRef(asset:Asset){

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
                uuid: child.uuid,
                children: [],
                active: child.active,
                activeInHierarchy: child.activeInHierarchy,
                parentUuid: child.parent?.uuid,
                path: childPath
            }
            this.m_nodeUuidMap[child.uuid] = child;
            this._fillNodeTree(childTree, child.children, childPath);
            treeObj.children.push(childTree);

        }
    }
    
    private _compareNodeTrees(tree1: NodeTreeItem, tree2: NodeTreeItem): boolean {
        if (tree1.uuid !== tree2.uuid || 
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

        const lastSceneTree = this.m_sceneTree;
        const sceneNode: Scene = director.getScene();
        this.m_sceneTree = {
            name: sceneNode.name,
            uuid: sceneNode.uuid,
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
        const nodeInfo = {
            active: node.active,
            name: node.name,
            position: node.position,
            scale: node.scale,
            layer: node.layer,
            components: this._getComponentsInfo(node)
        };
        return nodeInfo
    }

    private _getComponentsInfo(node: Node) {
        const componentsInfo = [];
        const components = node.components;

        for (const component of components) {
            const name = component["__proto__"].constructor.name
            const properties = this._getComponentProperties(component,name)
            const componentInfo = {
                name: name,
                uuid: component.uuid,
                properties: properties
            };
            componentsInfo.push(componentInfo);
        }

        return componentsInfo;
    }

    private _getComponentProperties(component: Component,name:string) {
        
        if(name === "Sprite"){
            return _compUtil.getCompInfo_sprite(component as Sprite)
        }else if(name === "Label"){
            return _compUtil.getCompInfo_label(component as Label)
        }else if(name === "RichText"){
            return _compUtil.getCompInfo_richText(component as RichText)
        }else if(name === "Button"){
            return _compUtil.getCompInfo_button(component as Button)
        }else if(name === "Animation"){
            // return _compUtil.getCompInfo_animation(component as Animation)
        }else if(name === "AudioSource"){
            // return _compUtil.getCompInfo_audioSource(component as AudioSource)
        }else{

        }
        
    }
}

namespace _compUtil{
    export interface _Color{
        r:number,
        g:number,
        b:number,
        a:number,
    }
    
    export interface CompInfo_Sprite{
        color:_Color,
        uuid_atlas:string,
        uuid_spriteFrame:string,
        grayscale:boolean,
        sizeMode:number,
        type:number,
        trim:boolean,
    }
    
    export function getCompInfo_sprite(comp:Sprite):CompInfo_Sprite{
        return {
            color:comp.color,
            uuid_atlas:comp.spriteAtlas?.uuid || "",
            uuid_spriteFrame:comp.spriteFrame?.uuid || "",
            grayscale:comp.grayscale,
            sizeMode:comp.sizeMode,
            type:comp.type,
            trim:comp.trim,
        }
        
    }
    
    export interface CompInfo_Label{
        color:_Color,
        string:string,
    
        horizontalAlign:number,
        verticalAlign:number,
        
        fontSize:number,
        lineHeight:number,
        overflow:number,
        
        enableWrapText:boolean,
        fontFamily:string,
        
        useSystemFont:boolean,
        uuid_font:string,
        spacingX:number,
    
        isBold:boolean,
        isItalic:boolean,
        isUnderline:boolean,
    }
    
    export function getCompInfo_label(comp:Label):CompInfo_Label{
        return {
            color:comp.color,
            string:comp.string,
            fontSize:comp.fontSize,
            lineHeight:comp.lineHeight,
            overflow:comp.overflow,
            enableWrapText:comp.enableWrapText,
            fontFamily:comp.fontFamily,
            useSystemFont:comp.useSystemFont,
            uuid_font:comp.font?.uuid || "",
            spacingX:comp.spacingX,
            isBold:comp.isBold,
            isItalic:comp.isItalic,
            isUnderline:comp.isUnderline,
            horizontalAlign:comp.horizontalAlign,
            verticalAlign:comp.verticalAlign,
        }
    }
    
    export interface CompInfo_RichText{
        string:string,
        horizontalAlign:number,
        verticalAlign:number,
        fontSize:number,
        lineHeight:number,
        fontFamily:string,
        useSystemFont:boolean,
        uuid_font:string,
    
        cacheMode:number,
        maxWidth:number,
        uuid_imageAtlas:string,
    }
    
    export function getCompInfo_richText(comp:RichText):CompInfo_RichText{
        return {
            string:comp.string,
            fontSize:comp.fontSize,
            lineHeight:comp.lineHeight,
            fontFamily:comp.fontFamily,
            useSystemFont:comp.useSystemFont,
            uuid_font:comp.font?.uuid || "",
            horizontalAlign:comp.horizontalAlign,
            verticalAlign:comp.verticalAlign,
            cacheMode:comp.cacheMode,
            maxWidth:comp.maxWidth,
            uuid_imageAtlas:comp.imageAtlas?.uuid || "",
        }
    }

    interface CompInfo_Button{
        interactable:boolean,
        transition:number,
        
        duration:number,
        zoomScale:number,
        
        uuid_normalSprite:string,
        uuid_pressedSprite:string,
        uuid_hoverSprite:string,
        uuid_disabledSprite:string,

        normalColor:_Color,
        pressedColor:_Color,
        hoverColor:_Color,
        disabledColor:_Color,
    }

    export function getCompInfo_button(comp:Button):CompInfo_Button{
        return {
            interactable:comp.interactable,
            transition:comp.transition,
            duration:comp.duration,
            zoomScale:comp.zoomScale,
            uuid_normalSprite:comp.normalSprite?.uuid || "",
            uuid_pressedSprite:comp.pressedSprite?.uuid || "",
            uuid_hoverSprite:comp.hoverSprite?.uuid || "",
            uuid_disabledSprite:comp.disabledSprite?.uuid || "",
            normalColor:comp.normalColor,
            pressedColor:comp.pressedColor,
            hoverColor:comp.hoverColor,
            disabledColor:comp.disabledColor,
        }
    }
       
}

interface NodeTreeItem{
    name:string
    uuid:string
    children:NodeTreeItem[]
    active:boolean
    activeInHierarchy:boolean
    parentUuid:string,
    path:string,
    isSceneNode?:boolean,
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
    } else if (sys.platform === sys.Platform.ALIPAY_MINI_GAME) {
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

    if(sys.isXR){
        model += "_isXR"
    }

    return model;
}


function _initOnce() {
    _data = new _RuntimeData();
    const _socket = new RunTimeSocket();
    _socket.initSocket(`ws://localhost:${plugin_server_port}`);

    const _addRef = Asset.prototype.addRef
    const _decRef = Asset.prototype.decRef

    Asset.prototype.addRef = function():Asset{
        _addRef.call(this)

        _data.onRes_addRef(this)
        return this
    }
    Asset.prototype.decRef = function(autoRelease?: boolean):Asset{
        _decRef.call(this,autoRelease)

        _data.onRes_decRef(this)
        return this
    }

    setInterval(() => {
        _socket.loop()
    }, 1000);
}

if (!EDITOR) {

    director.once(Director.EVENT_BEFORE_SCENE_LAUNCH,_initOnce)
}

var plugin_server_port = 8085