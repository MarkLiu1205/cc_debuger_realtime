
type TypeUUID = string
type TypeColor = string

interface EditorAssetInfo {
    url:string,
    type:string,
    uuid:string,
    path:string,
    isDirectory?:boolean,
}

interface ResTreeItem{
    /**名字 */
    name:string;
    /**路径 */
    path:string;
    /**当前是否是bundle文件夹 */
    isBundleFloder?:boolean,
    /**当前所属的bundle名字 */
    bundleName?:string,
    /**是不是目录,不是目录的就是资源 */
    isDirectory?:boolean;
    /**资源类型 cc.Prefab cc.ImageAsset cc.SpriteFrame 之类 */
    assetType?:string;
    /**图标 */
    icon?:string;
    uuid?:TypeUUID;
    /** 在资源管理器的URL， 开头为：db:// */
    url?:string;
    /**除了文件夹以外，ImageAsset也有SpriteFrame作为子节点 */
    children?:Array<ResTreeItem>;


    /**
     * 是否是远程资源或者文件缓存资源（如远程图片url、本地图片路径等）
     */
    isUrlAsset?:boolean,

}

// type CompType = "Sprite" | "Label" | "UITransform" | "Button" | "Canvas" | "EditBox" | "Layout" | 
//     "Mask" | "ParticleSystem2D" | "ProgressBar" | "RichText" | "ScrollView" | "Slider" | "Spine" | 
//     "VideoPlayer" | "WebView" | "Widget" | "Animation" | "AudioSource" | "Camera" | "RenderTexture" | 
//     "TiledMap" | "Graphics" | "Script" | "PageView" | "TiledTile" | "UIOpacity" | "LabelShadow" | 
//     "LabelOutline" | "Skeleton" | "PageViewIndicator"

type CompType = string

/**节点树信息 */
interface NodeTreeItem{
    name:string
    uuid:TypeUUID
    children:NodeTreeItem[]
    active:boolean
    activeInHierarchy:boolean
    parentUuid:TypeUUID,
    path:string,
    isSceneNode?:boolean,
}

type HexColor = string

/**inspector 节点信息 */
interface NodeInfo{
    uuid: TypeUUID,
    active: boolean,
    name: string,
    position: import("cc").Vec3,
    rotation: import("cc").Quat,
    scale: import("cc").Vec3,
    layer: number
}

interface InspectorInfo_Node extends NodeInfo{
    components:Array<CompInfo_Base>;
}

interface CompInfo_Base{
    enabled:boolean,
    typeStr:CompType,
    uuid:TypeUUID,
}


/**改变的节点信息 */
interface ChangedNodeInfo{
    uuid:string,
    /**节点信息健值对，旋转缩放坐标这些 */
    nodeChange?:Record<string,any>,
    /**节点的组件信息的改变，key为组件的uuid，val为组件信息健值对 */
    compChanges?:Record<string,Record<string,any>>
}

type LogLevel = "log" | "warn" | "error";

interface LogEntry {
    message: string;
    level: LogLevel;
    timestamp: string;
}

interface GameEnvParam{
    isNative:boolean,
    isBrowser:boolean,
    isMobile:boolean,
    CC_DEV: boolean,
    CC_DEBUG: boolean,
    CC_PREVIEW: boolean,
    CC_JSB: boolean,
    CC_SUPPORT_JIT: boolean,
}

/**
 * 由runtime发给plugin的资源内存信息
 */
interface ResMemInfo{
    uuid:string,
    /**所占用内存 */
    memory:number,
    /**引用计数 */
    refCount:number,
    /**资源类名，如cc.SpriteFrame */
    classname:string,
}