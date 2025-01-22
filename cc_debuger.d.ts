
type TypeUUID = string

interface EditorAssetInfo {
    url:string,
    type:string,
    uuid:string,
    path:string,
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
    /**是不是资源,不是资源的就是目录 */
    isAsset?:boolean;
    /**资源类型 cc.Prefab cc.ImageAsset cc.SpriteFrame 之类 */
    assetType?:string;
    /**图标 */
    icon?:string;
    uuid?:TypeUUID;
    /**除了文件夹以外，ImageAsset也有SpriteFrame作为子节点 */
    children?:Array<ResTreeItem>;
}

type CompType = "Sprite" | "Label" | "UITransform" | "Button" | "Canvas" | "EditBox" | "Layout" | 
    "Mask" | "ParticleSystem2D" | "ProgressBar" | "RichText" | "ScrollView" | "Slider" | "Spine" | 
    "VideoPlayer" | "WebView" | "Widget" | "Animation" | "AudioSource" | "Camera" | "RenderTexture" | 
    "TiledMap" | "Graphics" | "Script" | "PageView" | "TiledTile" | "UIOpacity" | "LabelShadow" | 
    "LabelOutline"

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

interface CompInfo_Sprite extends CompInfo_Base{
    color:HexColor,
    atlas:TypeUUID,
    spriteFrame:TypeUUID,
    grayscale:boolean,
    sizeMode:number,
    type:number,
    trim:boolean,
}

interface CompInfo_Label extends CompInfo_Base{
    color:HexColor,
    string:string,

    horizontalAlign:number,
    verticalAlign:number,
    
    fontSize:number,
    lineHeight:number,
    overflow:number,
    
    enableWrapText:boolean,
    fontFamily:string,
    
    useSystemFont:boolean,
    font:TypeUUID,
    spacingX:number,

    isBold:boolean,
    isItalic:boolean,
    isUnderline:boolean,
}


interface CompInfo_RichText extends CompInfo_Base{
    string:string,
    horizontalAlign:number,
    verticalAlign:number,
    fontSize:number,
    lineHeight:number,
    fontFamily:string,
    useSystemFont:boolean,
    font:TypeUUID,

    cacheMode:number,
    maxWidth:number,
    imageAtlas:TypeUUID,
}

interface CompInfo_Button extends CompInfo_Base{
    interactable:boolean,
    transition:number,
    
    duration:number,
    zoomScale:number,
    
    normalSprite:TypeUUID,
    pressedSprite:TypeUUID,
    hoverSprite:TypeUUID,
    disabledSprite:TypeUUID,

    normalColor:HexColor,
    pressedColor:HexColor,
    hoverColor:HexColor,
    disabledColor:HexColor,
}