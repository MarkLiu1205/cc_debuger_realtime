
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

    /**对于cc.SpriteFrame、cc.Texture2D，可能存在父节点cc.ImageAsset和cc.SpriteAtlas */
    parent?:string,
    /**
     * 是否是远程资源或者文件缓存资源（如远程图片url、本地图片路径等）
     */
    isUrlAsset?:boolean,

    /**目前只有ImageAsset统计了memory、width、height */
    memory?:number,
    width?:number,
    height?:number,
    refCount?:number,

    imgSrc?:string,
    textureUuid?:string,
    imageUuid?:string,
    //是否是http链接的图片资源
    isUrlImg?:boolean,
    //是本地文件夹的资源
    isNativeImg?:boolean,
}

// type CompType = "Sprite" | "Label" | "UITransform" | "Button" | "Canvas" | "EditBox" | "Layout" | 
//     "Mask" | "ParticleSystem2D" | "ProgressBar" | "RichText" | "ScrollView" | "Slider" | "Spine" | 
//     "VideoPlayer" | "WebView" | "Widget" | "Animation" | "AudioSource" | "Camera" | "RenderTexture" | 
//     "TiledMap" | "Graphics" | "Script" | "PageView" | "TiledTile" | "UIOpacity" | "LabelShadow" | 
//     "LabelOutline" | "Skeleton" | "PageViewIndicator"

type CompType = string
type AssetType = string

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

interface CompInfo_Camera extends CompInfo_Base{
    priority: number,
    visibility: number,
    clearFlags: import("cc").Camera.ClearFlag,
    clearColor: TypeColor,
    clearDepth:number,
    clearStencil:number,
    projection: import("cc").Camera.CameraProjection,
    fovAxis: import("cc").Camera.CameraFOVAxis,
    fov: number,
    near: number,
    far: number,
    orthoHeight: number,
    targetTexture: TypeUUID,
    aperture: import("cc").Camera.CameraAperture,
    shutter: import("cc").Camera.CameraShutter,
    iso: import("cc").Camera.CameraISO,
    rect: import("cc").Rect,
}

interface CompInfo_EditBox extends CompInfo_Base{
    string: string,
    maxLength: number,
    tabIndex: number,
    inputMode: import("cc").EditBox.InputMode,
    inputFlag: import("cc").EditBox.InputFlag,
    returnType: import("cc").EditBox.KeyboardReturnType,
    placeholder: string
    backgroundImage: string,
    textLabel: string,
    placeholderLabel: string,
}

interface CompInfo_Graphics extends CompInfo_Base{
    lineWidth: number,
    strokeColor: TypeColor,
    fillColor: TypeColor,
    miterLimit: number,
    lineJoin: import("cc").Graphics.LineJoin,
    lineCap: import("cc").Graphics.LineCap,
}

interface CompInfo_Layout extends CompInfo_Base{
    type: import("cc").Layout.Type,
    resizeMode: import("cc").Layout.ResizeMode,
    paddingLeft: number,
    paddingRight: number,
    paddingTop: number,
    paddingBottom: number,
    spacingX: number,
    spacingY: number,
    alignHorizontal: boolean,
    alignVertical: boolean,
    affectByScale: boolean,
    verticalDirection: import("cc").Layout.VerticalDirection,
    horiazonDirection: import("cc").Layout.HoriazonDirection,
    startAxis:import("cc").Layout.AxisDirection,
    constraint:import("cc").Layout.Constraint,
}

interface CompInfo_Mask extends CompInfo_Base{
    type: import("cc").Mask.MaskType,
    inverted: boolean,
    segments: number,
    alphaThreshold: number,
}

interface CompInfo_UITransform extends CompInfo_Base{
    anchorX:number,
    anchorY:number,
    width:number,
    height:number,
}

interface CompInfo_PageView extends CompInfo_Base{
    inertia: boolean,
    elastic: boolean,
    bounceDuration: number,
    indicator: TypeUUID,
    pageTurningSpeed: number,
    autoPageTurningThreshold: number,
    scrollThreshold: number,
    pageTurningEventTiming: number,
    brake:number,

    content:TypeUUID,
    sizeMode:import("cc").PageView.SizeMode,
    direction:import("cc").PageView.Direction,
}

interface CompInfo_ParticleSystem2D extends CompInfo_Base{
    customMaterial: TypeUUID,
    preview: boolean,
    playOnLoad: boolean,
    autoRemoveOnFinish: boolean,
    file: TypeUUID,
    spriteFrame: TypeUUID,
    totalParticles: number,
    duration: number,
    emissionRate: number,
    life: number,
    lifeVar: number,
    startColor: TypeColor, 
    startColorVar: TypeColor,
    endColor: TypeColor,
    endColorVar: TypeColor,
    angle: number,
    angleVar: number,
    startSize: number,
    startSizeVar: number,
    endSize: number,
    endSizeVar: number,
    startSpin: number,
    startSpinVar: number,
    endSpin: number,
    endSpinVar: number,
    posVar: import("cc").Vec2,
    positionType: import("cc").ParticleSystem2D.PositionType,
    emitterMode: import("cc").ParticleSystem2D.EmitterMode,
    gravity: import("cc").Vec2,
    speed: number,
    speedVar: number,
    tangentialAccel: number,
    tangentialAccelVar: number,
    radialAccel: number,
    radialAccelVar: number,
    rotationIsDir: boolean,
}

interface CompInfo_Sprite extends CompInfo_Base{
    customMaterial:TypeUUID,
    color:HexColor,
    spriteAtlas:TypeUUID,
    spriteFrame:TypeUUID,
    grayscale:boolean,
    sizeMode:number,
    type:number,
    trim:boolean,
}

interface CompInfo_Label extends CompInfo_Base{
    customMaterial:TypeUUID,
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

    underlineHeight:number,
    cacheMode:import("cc").CacheMode
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
    handleTouchEvent:boolean,
}

interface CompInfo_Button extends CompInfo_Base{
    interactable:boolean,
    transition:number,
    
    duration:number,
    zoomScale:number,
    target:TypeUUID,
    
    normalSprite:TypeUUID,
    pressedSprite:TypeUUID,
    hoverSprite:TypeUUID,
    disabledSprite:TypeUUID,

    normalColor:HexColor,
    pressedColor:HexColor,
    hoverColor:HexColor,
    disabledColor:HexColor,
}

interface CompInfo_ScrollView extends CompInfo_Base{
    horizontal: boolean,
    vertical: boolean,
    inertia: boolean,
    brake: number,
    bounceDuration: number,
    elastic: boolean,
        
    cancelInnerEvents: boolean,
    content: TypeUUID,
    horizontalScrollBar: TypeUUID,
    verticalScrollBar: TypeUUID,
}

interface CompInfo_Skeleton extends CompInfo_Base{
    skeletonData: TypeUUID,
    _defaultSkinIndex: number,
    skinArr:Array<string>,
    
    animationArr: Array<string>,
    animation: string,

    loop: boolean,
    timeScale: number,
    premultipliedAlpha: boolean,
    useTint: boolean,
    debugSlots: boolean,
    debugBones: boolean,
    debugMesh: boolean,
    enableBatch: boolean,

    defaultCacheMode:import("cc").sp.Skeleton.AnimationCacheMode,
}

interface CompInfo_UIOpacity extends CompInfo_Base{
    opacity:number
}

interface CompInfo_Widget extends CompInfo_Base{
    alignMode: import("cc").Widget.AlignMode,
    left: number,
    right: number,
    top: number,
    bottom: number,
    horizontalCenter: number,
    verticalCenter: number,
    isAlignLeft: boolean,
    isAlignRight: boolean,
    isAlignTop: boolean,
    isAlignBottom: boolean,
    isAlignHorizontalCenter: boolean,
    isAlignVerticalCenter: boolean,
}

interface CompInfo_Canvas extends CompInfo_Base{
    cameraComponent:TypeUUID,
    alignCanvasWithScreen:boolean,
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
    writablePath?: string,
}

/**
 * 由runtime发给plugin的资源内存信息
 */
interface ResMemInfo{
    uuid:string,
    /**所占用内存 */
    memory?:number,
    /**引用计数 */
    refCount:number,
    /**资源类名，如cc.SpriteFrame */
    classname:string,

    width?:number,
    height?:number,

    //是否是自动图集（暂时是根据uuid的长度判断,imageAsset长度是9，texture2D的长度是15）
    isAutoPackImg?:boolean,
    //主要给自动合图用
    imgSrc?:string,
    //对于texture2D，其依赖的Texture2D的Uuid
    textureUuid?:string,
    //对于texture2D，其依赖的ImageAsset的uuid
    imageUuid?:string,
    
    //是否是http链接的图片资源
    isUrlImg?:boolean,
    //是本地文件夹的资源
    isNativeImg?:boolean,
}

interface OnlineInfo{
    bIsOnline:boolean,
    name:string,
    info: { 
        IP: string, 
        Port: number, 
        Family: string 
    }
}

interface WritableFileInfo{
    name:string,
    path:string,
    isFloder:boolean,
    children?:Array<WritableFileInfo>
}

type ToastParam = (param:string|MessageParams,type?:"error" | "success" | "warning" | "info")=>void

interface SelfBuildParam{
    /**是否剔除cc_debuger,(构建时从assets中剔除相关插件代码) */
    cut_plugin_from_runtime:boolean,
    /**是否自动连接插件 */
    bAutoStarPlugin:boolean,
    /**中转websocket服务器地址 */
    serverAddress:boolean
}

interface TexDataInfo{
    width: number,
    height: number,
    buffer: Uint8Array,
    base64Data?: string,
    oldWidth?: number,
    oldHeight?: number,
    top?: number,
    left?: number,
    right?: number,
    bottom?: number
}

interface VerifyReqParam{
    /**激活码 */
    activationCode:string,
    /**当前硬件的设备号 */
    deviceId:string,
    /**用户的uid（可能为空） */
    cocos_uid:string,
    /**用户的邮件 */
    email:string,
    /**用户的昵称 */
    nickname:string,
    /**软件版本名称 如1.0.0 */
    versionName:string,
}

enum VerifyState {
	State_none = 0,
	//未通过验证
	State_unverified = 1,
	//在试用期中
	State_in_trial = 2,
	//已经验证通过
	State_verify_success = 3,
	//激活码过期了
	State_verify_expired = 4,
}

interface VerifyRespParam{
    /**激活状态  0表示正在验证 1未激活  2试用期中  3已激活 4激活码已过期(激活码分为永久激活码和3个月有效激活码) */
    state:VerifyState,
    //返回激活码(如果暂未激活，返回空字符串)
    activationCode:string,
    /**时间戳，试用期时表示试用结束时间，激活码过期时表示过期时间 */
    endTime:number,
    /**软件的最新版本号 */
    latestVersion:string,
    /**联系作者信息(可扩展json) */
    authorInfo:{
        helpDocUrl:string,
        feedbackUrl:string,
        qq:Array<string>,
        qqgroups:Array<string>,
        wechat:Array<string>,
    }
}