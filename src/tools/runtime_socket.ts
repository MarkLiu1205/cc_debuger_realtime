
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
                uuid: child?.uuid??"",
                children: [],
                active: child.active,
                activeInHierarchy: child.activeInHierarchy,
                parentUuid: child.parent?.uuid??"",
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
            const name = component["__proto__"].constructor.name
            const info = this._getComponentProperties(component,name)
            componentsInfo.push(info);
        }

        return componentsInfo;
    }

    private _getComponentProperties(component: Component,name:string):CompInfo_Base {
        
        if(name === "Sprite"){
            return _compUtil.getCompInfo_Sprite(component as Sprite)
        }else if(name === "Label"){
            return _compUtil.getCompInfo_Label(component as Label)
        }else if(name === "RichText"){
            return _compUtil.getCompInfo_RichText(component as RichText)
        }else if(name === "Button"){
            return _compUtil.getCompInfo_Button(component as Button)
        }else if(name === "Camera"){
            return _compUtil.getCompInfo_Camera(component as Camera)
        }else if(name === "EditBox"){
            return _compUtil.getCompInfo_Editbox(component as EditBox)
        }else if(name === "Graphics"){
            return _compUtil.getCompInfo_Graphics(component as Graphics)
        }else if(name === "Layout"){
            return _compUtil.getCompInfo_Layout(component as Layout)
        }else if(name === "Mask"){
            return _compUtil.getCompInfo_Mask(component as Mask)
        }else if(name === "UITransform"){
            return _compUtil.getCompInfo_UITransform(component as UITransform)
        }else if(name === "PageView"){
            return _compUtil.getCompInfo_PageView(component as PageView)
        }else if(name === "ParticleSystem2D"){
            return _compUtil.getCompInfo_ParticleSystem2D(component as ParticleSystem2D)
        }else if(name === "ScrollView"){
            return _compUtil.getCompInfo_ScrollView(component as ScrollView)
        }else if(name === "Skeleton"){
            return _compUtil.getCompInfo_Skeleton(component as sp.Skeleton)
        }else if(name === "UIOpacity"){
            return _compUtil.getCompInfo_UIOpacity(component as UIOpacity)
        }else if(name === "Widget"){
            return _compUtil.getCompInfo_Widget(component as Widget)
        }else{

        }
        
    }
}

namespace _compUtil{
    function getCompInfo_bass(comp:Component):CompInfo_Base{
        return {
            enabled:comp.enabled,
            //@ts-ignore
            typeStr:comp.__proto__.constructor.name,
            uuid:comp?.uuid??"",
        }
    }

    export function getCompInfo_Camera(comp:Camera):CompInfo_Camera{
        return {
            ...getCompInfo_bass(comp),...{
                priority: comp.priority,
                visibility: comp.visibility,
                clearFlags: comp.clearFlags,
                clearColor: comp.clearColor.toHEX(),
                projection: comp.projection,
                fov: comp.fov,
                orthoHeight: comp.orthoHeight,
                targetTexture: comp.targetTexture?.uuid || "",
                rect: comp.rect,
                screenScale: comp.screenScale,
                clearDepth: comp.clearDepth,
                clearStencil: comp.clearStencil,

                fovAxis: comp.fovAxis,
                near: comp.near,
                far: comp.far,
                aperture: comp.aperture,
                shutter: comp.shutter,
                iso: comp.iso,
            }
        }
        
    }

    export function getCompInfo_Editbox(comp:EditBox):CompInfo_EditBox{
        return {
            ...getCompInfo_bass(comp),...{
                string: comp.string,
                maxLength: comp.maxLength,
                tabIndex: comp.tabIndex,
                inputMode: comp.inputMode,
                inputFlag: comp.inputFlag,
                keyboardReturnType: comp.returnType,
                placeholder: comp.placeholder,
                backgroundImage: comp.backgroundImage?.uuid??"",
                textLabel: comp.textLabel?.uuid??"",
                placeholderLabel: comp.placeholderLabel?.uuid??"",
            }
        }
        
    }

    export function getCompInfo_Graphics(comp:Graphics):CompInfo_Graphics{
        return {
            ...getCompInfo_bass(comp),...{
                lineWidth: comp.lineWidth,
                strokeColor: comp.color.toHEX(),
                fillColor: comp.fillColor.toHEX(),
                miterLimit: comp.miterLimit,
                lineJoin: comp.lineJoin,
                lineCap: comp.lineCap,
            }
        }
        
    }

    export function getCompInfo_Layout(comp:Layout):CompInfo_Layout{
        return {
            ...getCompInfo_bass(comp),...{
                type: comp.type,
                resizeMode: comp.resizeMode,
                paddingLeft: comp.paddingLeft,
                paddingRight: comp.paddingRight,
                paddingTop: comp.paddingTop,
                paddingBottom: comp.paddingBottom,
                spacingX: comp.spacingX,
                spacingY: comp.spacingY,
                alignHorizontal: comp.alignHorizontal,
                alignVertical: comp.alignVertical,
                affectByScale: comp.affectedByScale,
                verticalDirection: comp.verticalDirection,
                horiazonDirection: comp.horizontalDirection,
                startAxis:comp.startAxis,
                constraint:comp.constraint,
            }
        }
        
    }

    export function getCompInfo_Mask(comp:Mask):CompInfo_Mask{
        return {
            ...getCompInfo_bass(comp),...{
                type: comp.type,
                inverted: comp.inverted,
                segments: comp.segments,
                alphaThreshold: comp.alphaThreshold,
            }
        }
        
    }

    export function getCompInfo_UITransform(comp:UITransform):CompInfo_UITransform{
        return {
            ...getCompInfo_bass(comp),...{
                anchorPoint:comp.anchorPoint,
                contentSize:comp.contentSize
            }
        }
        
    }

    export function getCompInfo_PageView(comp:PageView):CompInfo_PageView{
        return {
            ...getCompInfo_bass(comp),...{
                inertia: comp.inertia,
                elastic: comp.elastic,
                bounceDuration: comp.bounceDuration,
                indicator: comp.indicator?.uuid??"",
                pageTurningSpeed: comp.pageTurningSpeed,
                autoPageTurningThreshold: comp.autoPageTurningThreshold,
                scrollThreshold: comp.scrollThreshold,
                pageTurningEventTiming: comp.pageTurningEventTiming,
                brake:comp.brake,

                content:comp.content?.uuid??"",
                sizeMode:comp.sizeMode,
                direction:comp.direction,
            }
        }
        
    }

    export function getCompInfo_ParticleSystem2D(comp:ParticleSystem2D):CompInfo_ParticleSystem2D{
        return {
            ...getCompInfo_bass(comp),...{
                customMaterial: comp.customMaterial?.uuid??"",
                preview: comp.preview,
                playOnLoad: comp.playOnLoad,
                autoRemoveOnFinish: comp.autoRemoveOnFinish,
                file: comp.file?.uuid??"",
                spriteFrame: comp.spriteFrame?.uuid??"",
                totalParticles: comp.totalParticles,
                duration: comp.duration,
                emissionRate: comp.emissionRate,
                life: comp.life,
                lifeVar: comp.lifeVar,
                startColor: comp.startColor.toHEX(),
                startColorVar: comp.startColorVar.toHEX(),
                endColor: comp.endColor.toHEX(),
                endColorVar: comp.endColorVar.toHEX(),
                angle: comp.angle,
                angleVar: comp.angleVar,
                startSize: comp.startSize,
                startSizeVar: comp.startSizeVar,
                endSize: comp.endSize,
                endSizeVar: comp.endSizeVar,
                startSpin: comp.startSpin,
                startSpinVar: comp.startSpinVar,
                endSpin: comp.endSpin,
                endSpinVar: comp.endSpinVar,
                posVar: comp.posVar,
                positionType: comp.positionType,
                emitterMode: comp.emitterMode,
                gravity: comp.gravity,
                speed: comp.speed,
                speedVar: comp.speedVar,
                tangentialAccel: comp.tangentialAccel,
                tangentialAccelVar: comp.tangentialAccelVar,
                radialAccel: comp.radialAccel,
                radialAccelVar: comp.radialAccelVar,
                rotationIsDir: comp.rotationIsDir,
            }
        }
        
    }
    
    export function getCompInfo_Sprite(comp:Sprite):CompInfo_Sprite{
        return {
            ...getCompInfo_bass(comp),...{
                customMaterial:comp.customMaterial?.uuid??"",
                color:comp.color.toHEX(),
                spriteAtlas:comp.spriteAtlas?.uuid || "",
                spriteFrame:comp.spriteFrame?.uuid || "",
                grayscale:comp.grayscale,
                sizeMode:comp.sizeMode,
                type:comp.type,
                trim:comp.trim,
            }
        }
        
    }
    
    export function getCompInfo_Label(comp:Label):CompInfo_Label{
        return {
            ...getCompInfo_bass(comp),...{
                customMaterial:comp.customMaterial?.uuid??"",
                color:comp.color.toHEX(),
                string:comp.string,
                fontSize:comp.fontSize,
                lineHeight:comp.lineHeight,
                overflow:comp.overflow,
                enableWrapText:comp.enableWrapText,
                fontFamily:comp.fontFamily,
                useSystemFont:comp.useSystemFont,
                font:comp.font?.uuid || "",
                spacingX:comp.spacingX,
                isBold:comp.isBold,
                isItalic:comp.isItalic,
                isUnderline:comp.isUnderline,
                horizontalAlign:comp.horizontalAlign,
                verticalAlign:comp.verticalAlign,
                underlineHeight:comp.underlineHeight,
                cacheMode:comp.cacheMode,
            }
        }
    }
    
    
    export function getCompInfo_RichText(comp:RichText):CompInfo_RichText{
        return {
            ...getCompInfo_bass(comp),...{
                string:comp.string,
                fontSize:comp.fontSize,
                lineHeight:comp.lineHeight,
                fontFamily:comp.fontFamily,
                useSystemFont:comp.useSystemFont,
                font:comp.font?.uuid || "",
                horizontalAlign:comp.horizontalAlign,
                verticalAlign:comp.verticalAlign,
                cacheMode:comp.cacheMode,
                maxWidth:comp.maxWidth,
                imageAtlas:comp.imageAtlas?.uuid || "",
                handleTouchEvent:comp.handleTouchEvent,
            }
        }
    }

    export function getCompInfo_Button(comp:Button):CompInfo_Button{
        return {
            ...getCompInfo_bass(comp),...{
                interactable:comp.interactable,
                transition:comp.transition,
                duration:comp.duration,
                zoomScale:comp.zoomScale,
                target:comp.target?.uuid??"",
                normalSprite:comp.normalSprite?.uuid || "",
                pressedSprite:comp.pressedSprite?.uuid || "",
                hoverSprite:comp.hoverSprite?.uuid || "",
                disabledSprite:comp.disabledSprite?.uuid || "",
                normalColor:comp.normalColor.toHEX(),
                pressedColor:comp.pressedColor.toHEX(),
                hoverColor:comp.hoverColor.toHEX(),
                disabledColor:comp.disabledColor.toHEX(),
            }
        }
    }

    export function getCompInfo_ScrollView(comp:ScrollView):CompInfo_ScrollView{
        return {
            ...getCompInfo_bass(comp),...{
                horizontal: comp.horizontal,
                vertical: comp.vertical,
                inertia: comp.inertia,
                brake: comp.brake,
                bounceDuration: comp.bounceDuration,
                elastic: comp.elastic,
                    
                cancelInnerEvents: comp.cancelInnerEvents,
                content: comp.content?.uuid??"",
                horizontalScrollBar: comp.horizontalScrollBar?.uuid??"",
                verticalScrollBar: comp.verticalScrollBar?.uuid??"",
            }
        }
        
    }

    export function getCompInfo_Skeleton(comp:sp.Skeleton):CompInfo_Skeleton{
        return {
            ...getCompInfo_bass(comp),...{
                skeletonData: comp.skeletonData?.uuid??"",
                _defaultSkinIndex: comp._defaultSkinIndex,
                skinArr:["default"],
                
                animationArr: ["animation"],
                _animationIndex: comp._animationIndex,

                loop: comp.loop,
                timeScale: comp.timeScale,
                premultipliedAlpha: comp.premultipliedAlpha,
                useTint: comp.useTint,
                debugSlots: comp.debugSlots,
                debugBones: comp.debugBones,
                debugMesh: comp.debugMesh,
                enableBatch: comp.enableBatch,

                animationCacheMode: comp.defaultCacheMode,
            }
        }
        
    }
       
    export function getCompInfo_UIOpacity(comp:UIOpacity):CompInfo_UIOpacity{
        return {
            ...getCompInfo_bass(comp),...{
                opacity:comp.opacity
            }
        }
        
    }

    export function getCompInfo_Widget(comp:Widget):CompInfo_Widget{
        return {
            ...getCompInfo_bass(comp),...{
                alignMode: comp.alignMode,
                left: comp.left,
                right: comp.right,
                top: comp.top,
                bottom: comp.bottom,
                horizontalCenter: comp.horizontalCenter,
                verticalCenter: comp.verticalCenter,
                isAlignLeft: comp.isAlignLeft,
                isAlignRight: comp.isAlignRight,
                isAlignTop: comp.isAlignTop,
                isAlignBottom: comp.isAlignBottom,
                isAlignHorizontalCenter: comp.isAlignHorizontalCenter,
                isAlignVerticalCenter: comp.isAlignVerticalCenter,
            }
        }
        
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