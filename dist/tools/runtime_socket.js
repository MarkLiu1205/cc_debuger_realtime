"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const cc_2 = require("cc");
const cc_3 = require("cc");
const cc_4 = require("cc");
// @ts-ignore
const env_1 = require("cc/env");
let _data = null;
let _accId = 0;
function _getAccId() {
    return ++_accId;
}
class RunTimeSocket {
    constructor() {
        this.m_socket = null;
        this.m_url = "";
        this.m_isActive = false;
        this._spiltMsg = {};
    }
    getIsActive() {
        return this.m_isActive;
    }
    initSocket(url) {
        this.m_url = url;
        this.m_socket = new WebSocket(url);
        this.m_socket.onopen = () => {
            console.log('[Runtime] Connected to server');
            this._send({ type: 'identify', role: 'runtime', name: _getSelfModelName() });
        };
        this.m_socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            this._onMessage(msg);
        };
        this.m_socket.onclose = this._onClose.bind(this);
        this.m_socket.onerror = this._onError.bind(this);
    }
    _checkIsConnect() {
        if (this.m_socket && this.m_socket.readyState === WebSocket.OPEN) {
            return true;
        }
        return false;
    }
    _send(data) {
        var _a, _b;
        const step = 1024 * 10;
        const jsonStr = JSON.stringify(data);
        if (jsonStr.length <= step) {
            (_a = this.m_socket) === null || _a === void 0 ? void 0 : _a.send(jsonStr);
        }
        else {
            let idx = 0;
            const total = Math.ceil(jsonStr.length / step);
            const uniqueId = _getAccId();
            while (idx < total) {
                const subStr = jsonStr.substring(idx * step, Math.min((idx + 1) * step, jsonStr.length));
                const subObj = {
                    isSplit: true, idx: idx + 1, total: total, data: subStr, uniqueId: uniqueId,
                };
                (_b = this.m_socket) === null || _b === void 0 ? void 0 : _b.send(JSON.stringify(subObj));
                idx += 1;
            }
        }
    }
    _onMessage(msg) {
        console.log("onMesage", JSON.stringify(msg));
        if (msg["isSplit"]) {
            const obj = msg;
            this._spiltMsg[obj.uniqueId] = this._spiltMsg[obj.uniqueId] || [];
            this._spiltMsg[obj.uniqueId].push(obj);
            if (this._spiltMsg[obj.uniqueId].length === obj.total) {
                this._spiltMsg[obj.uniqueId].sort((a, b) => {
                    return a.idx - b.idx;
                });
                let str = "";
                for (let item of this._spiltMsg[obj.uniqueId]) {
                    str += item.data;
                }
                delete this._spiltMsg[obj.uniqueId];
                msg = JSON.parse(str);
            }
            else {
                return;
            }
        }
        const responseData = { type: 'response', action: msg.action, data: null, requestId: msg.requestId };
        if (msg.type === 'request') { //表示是从插件发来的请求，需要进行回复
            let data = null;
            if (msg.action === 'getNewAddedAssets') {
                const uuids = [];
                cc_4.assetManager.assets.forEach((_, uuid) => uuids.push(uuid));
                data = _data.getNewAddedAssets();
            }
            else if (msg.action === 'getRefCount') {
                const uuid = msg.data.uuid;
                data = _data.getRefCount(uuid);
            }
            else if (msg.action === 'getNodeInfo') {
                const uuid = msg.data.uuid;
                data = _data.getNodeInfo(uuid);
            }
            responseData.data = data;
            this._send(responseData);
        }
        else if (msg.type === "push") {
            if (msg.action === 'markActive') {
                this.m_isActive = msg.data;
                if (!this.m_isActive) {
                    _data.clear();
                }
                console.log("this.m_isActive", this.m_isActive);
            }
        }
    }
    _onClose(event) {
        // console.log('[Runtime] Disconnected from server');
        _data.clear();
        this.m_isActive = false;
        const interval = 5; //5秒重试
        setTimeout(() => {
            if (this.m_socket != null) {
                this.m_socket.close();
                this.m_socket = null;
            }
            this.initSocket(this.m_url);
        }, interval * 1000);
    }
    _onError(error) {
        // console.error('[Runtime] WebSocket error:', error);
    }
    loop() {
        if (!this._checkIsConnect()) {
            return;
        }
        if (!this.m_isActive) {
            return;
        }
        if (_data.searchNodeTree()) {
            this._send({ type: 'push', action: 'updateSceneTree', data: _data.m_sceneTree });
        }
    }
}
class _RuntimeData {
    constructor() {
        /**记录出现过的uuid和相应引用计数 */
        this.m_assetUuidMap = {};
        /**当前节点数 */
        this.m_sceneTree = null;
        /**当前场景 */
        this.m_curSceneName = "";
        /**记录当前节点的uuid映射 */
        this.m_nodeUuidMap = {};
        cc_4.director.on(cc_3.Director.EVENT_AFTER_SCENE_LAUNCH, this._onSceneChange, this);
    }
    clear() {
        this.m_assetUuidMap = {};
        this.m_sceneTree = null;
    }
    _onSceneChange(sceneNode) {
        this.m_curSceneName = sceneNode.name;
    }
    /**
     * 获取相对于上次的新增资源的uuid和相应引用计数
     * @returns
     */
    getNewAddedAssets() {
        const ret = {};
        cc_4.assetManager.assets.forEach((info, uuid) => {
            if (this.m_assetUuidMap[uuid] == null || this.m_assetUuidMap[uuid] != info.refCount) {
                ret[uuid] = info.refCount;
                this.m_assetUuidMap[uuid] = info.refCount;
            }
        });
        return ret;
    }
    /**
     * 获取资源的使用情况,-1表示资源没有被加载
     * @param uuid
     */
    getRefCount(uuid) {
        const asset = cc_4.assetManager.assets.get(uuid);
        if (asset) {
            return asset.refCount;
        }
        return -1;
    }
    onRes_addRef(asset) {
    }
    onRes_decRef(asset) {
    }
    /**
     * 获取指定资源正在被多少个节点的相关组件使用
     * @param uuid 要检查的资源 (例如 SpriteFrame)
     * @returns 所有引用该资源的组件的uuid的列表
     */
    getAssetUsageInScene(uuid) {
        const asset = cc_4.assetManager.assets.get(uuid);
        if (asset == null) {
            console.error(`Asset with UUID ${uuid} not found.`);
            return [];
        }
        const scene = cc_4.director.getScene(); // 获取当前场景
        if (!scene) {
            console.error('No active scene found.');
            return [];
        }
        const ret = [];
        // 遍历场景中的所有节点
        scene.walk((node) => {
            var _a, _b, _c;
            // 检查 SpriteFrame
            if (asset instanceof cc_4.SpriteFrame) {
                const _comp = node.getComponent(cc_4.Sprite);
                if (_comp && _comp.spriteFrame === asset) {
                    ret.push(_comp.uuid);
                }
            }
            // 检查 AnimationClip
            else if (asset instanceof cc_4.AnimationClip) {
                const _comp = node.getComponent(cc_4.Animation);
                if (_comp && _comp.clips.includes(asset)) {
                    ret.push(_comp.uuid);
                }
            }
            // 检查 AudioClip
            else if (asset instanceof cc_4.AudioClip) {
                const _comp = node.getComponent(cc_4.AudioSource);
                if (_comp && _comp.clip === asset) {
                    ret.push(_comp.uuid);
                }
            }
            // 检查 Material
            else if (asset instanceof cc_4.Material) {
                const _comp = node.getComponent(cc_4.Renderer);
                if (_comp && _comp.materials.includes(asset)) {
                    ret.push(_comp.uuid);
                }
            }
            // 检查 Prefab
            else if (asset instanceof cc_4.Prefab) {
                // @ts-ignore
                if (((_a = node.prefabInfo) === null || _a === void 0 ? void 0 : _a.asset) === asset) {
                    ret.push(node.uuid);
                }
            }
            // 检查 Texture2D
            else if (asset instanceof cc_4.Texture2D) {
                const spriteComp = node.getComponent(cc_4.Sprite);
                if (spriteComp && ((_b = spriteComp.spriteFrame) === null || _b === void 0 ? void 0 : _b.texture) === asset) {
                    ret.push(spriteComp.uuid);
                }
                const rendererComp = node.getComponent(cc_4.Renderer);
                if (rendererComp && rendererComp.materials.some(mat => (mat === null || mat === void 0 ? void 0 : mat.getProperty('mainTexture')) === asset)) {
                    ret.push(rendererComp.uuid);
                }
            }
            else if (asset instanceof cc_4.sp.SkeletonData) {
                const spComp = node.getComponent(cc_4.sp.Skeleton);
                if (spComp && spComp.skeletonData === asset) {
                    ret.push(spComp.uuid);
                }
            }
            // 检查 Mesh
            else if (asset instanceof cc_4.Mesh) {
                const meshRendererComp = node.getComponent(cc_4.MeshRenderer);
                if (meshRendererComp && meshRendererComp.mesh === asset) {
                    ret.push(meshRendererComp.uuid);
                }
            }
            // 检查 ParticleAsset
            else if (asset instanceof cc_4.ParticleAsset) {
                const particleComp = node.getComponent(cc_4.ParticleSystem);
                // @ts-ignore
                if (particleComp && particleComp.file === asset) {
                    ret.push(particleComp.uuid);
                }
            }
            // 检查 Font
            else if (asset instanceof cc_4.Font) {
                const labelComp = node.getComponent(cc_4.Label);
                if (labelComp && labelComp.font === asset) {
                    ret.push(labelComp.uuid);
                }
            }
            // 检查 SpriteAtlas
            else if (asset instanceof cc_4.SpriteAtlas) {
                const spriteComp = node.getComponent(cc_4.Sprite);
                if (spriteComp && asset.getSpriteFrame(((_c = spriteComp.spriteFrame) === null || _c === void 0 ? void 0 : _c.name) || '') === spriteComp.spriteFrame) {
                    ret.push(spriteComp.uuid);
                }
            }
            // 检查 VideoClip
            else if (asset instanceof cc_4.VideoClip) {
                // Add logic if applicable, since VideoPlayer component may reference this
            }
            // 检查 ImageAsset
            else if (asset instanceof cc_4.ImageAsset) {
                // Add logic if this is directly used or referenced
            }
            // 检查 TextAsset
            else if (asset instanceof cc_4.TextAsset) {
                // Add logic if this is directly used or referenced
            }
            // 检查 JsonAsset
            else if (asset instanceof cc_4.JsonAsset) {
                // Add logic if this is directly used or referenced
            }
            // 检查 EffectAsset
            else if (asset instanceof cc_4.EffectAsset) {
                const rendererComp = node.getComponent(cc_4.Renderer);
                if (rendererComp && rendererComp.materials.some(mat => (mat === null || mat === void 0 ? void 0 : mat.effectAsset) === asset)) {
                    ret.push(rendererComp.uuid);
                }
            }
        });
        return ret;
    }
    _fillNodeTree(treeObj, children, parentPath = '') {
        var _a;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const childPath = parentPath ? `${parentPath}/${child.name}` : child.name;
            const childTree = {
                name: child.name,
                uuid: child.uuid,
                children: [],
                active: child.active,
                activeInHierarchy: child.activeInHierarchy,
                parentUuid: (_a = child.parent) === null || _a === void 0 ? void 0 : _a.uuid,
                path: childPath
            };
            this.m_nodeUuidMap[child.uuid] = child;
            this._fillNodeTree(childTree, child.children, childPath);
            treeObj.children.push(childTree);
        }
    }
    _compareNodeTrees(tree1, tree2) {
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
    searchNodeTree() {
        this.m_nodeUuidMap = {};
        const lastSceneTree = this.m_sceneTree;
        const sceneNode = cc_4.director.getScene();
        this.m_sceneTree = {
            name: sceneNode.name,
            uuid: sceneNode.uuid,
            children: [],
            active: true,
            activeInHierarchy: true,
            parentUuid: "",
            path: "",
            isSceneNode: true,
        };
        this._fillNodeTree(this.m_sceneTree, sceneNode.children);
        this.m_nodeUuidMap[this.m_sceneTree.uuid] = sceneNode;
        if (lastSceneTree === null) {
            return true;
        }
        return !this._compareNodeTrees(lastSceneTree, this.m_sceneTree);
    }
    getNodeInfo(uuid) {
        const node = this.m_nodeUuidMap[uuid];
        const nodeInfo = {
            active: node.active,
            name: node.name,
            position: node.position,
            scale: node.scale,
            layer: node.layer,
            components: this._getComponentsInfo(node)
        };
        return nodeInfo;
    }
    _getComponentsInfo(node) {
        const componentsInfo = [];
        const components = node.components;
        for (const component of components) {
            const name = component["__proto__"].constructor.name;
            const properties = this._getComponentProperties(component, name);
            const componentInfo = {
                name: name,
                uuid: component.uuid,
                properties: properties
            };
            componentsInfo.push(componentInfo);
        }
        return componentsInfo;
    }
    _getComponentProperties(component, name) {
        if (name === "Sprite") {
            return _compUtil.getCompInfo_sprite(component);
        }
        else if (name === "Label") {
            return _compUtil.getCompInfo_label(component);
        }
        else if (name === "RichText") {
            return _compUtil.getCompInfo_richText(component);
        }
        else if (name === "Button") {
            return _compUtil.getCompInfo_button(component);
        }
        else if (name === "Animation") {
            // return _compUtil.getCompInfo_animation(component as Animation)
        }
        else if (name === "AudioSource") {
            // return _compUtil.getCompInfo_audioSource(component as AudioSource)
        }
        else {
        }
    }
}
var _compUtil;
(function (_compUtil) {
    function getCompInfo_sprite(comp) {
        var _a, _b;
        return {
            color: comp.color,
            uuid_atlas: ((_a = comp.spriteAtlas) === null || _a === void 0 ? void 0 : _a.uuid) || "",
            uuid_spriteFrame: ((_b = comp.spriteFrame) === null || _b === void 0 ? void 0 : _b.uuid) || "",
            grayscale: comp.grayscale,
            sizeMode: comp.sizeMode,
            type: comp.type,
            trim: comp.trim,
        };
    }
    _compUtil.getCompInfo_sprite = getCompInfo_sprite;
    function getCompInfo_label(comp) {
        var _a;
        return {
            color: comp.color,
            string: comp.string,
            fontSize: comp.fontSize,
            lineHeight: comp.lineHeight,
            overflow: comp.overflow,
            enableWrapText: comp.enableWrapText,
            fontFamily: comp.fontFamily,
            useSystemFont: comp.useSystemFont,
            uuid_font: ((_a = comp.font) === null || _a === void 0 ? void 0 : _a.uuid) || "",
            spacingX: comp.spacingX,
            isBold: comp.isBold,
            isItalic: comp.isItalic,
            isUnderline: comp.isUnderline,
            horizontalAlign: comp.horizontalAlign,
            verticalAlign: comp.verticalAlign,
        };
    }
    _compUtil.getCompInfo_label = getCompInfo_label;
    function getCompInfo_richText(comp) {
        var _a, _b;
        return {
            string: comp.string,
            fontSize: comp.fontSize,
            lineHeight: comp.lineHeight,
            fontFamily: comp.fontFamily,
            useSystemFont: comp.useSystemFont,
            uuid_font: ((_a = comp.font) === null || _a === void 0 ? void 0 : _a.uuid) || "",
            horizontalAlign: comp.horizontalAlign,
            verticalAlign: comp.verticalAlign,
            cacheMode: comp.cacheMode,
            maxWidth: comp.maxWidth,
            uuid_imageAtlas: ((_b = comp.imageAtlas) === null || _b === void 0 ? void 0 : _b.uuid) || "",
        };
    }
    _compUtil.getCompInfo_richText = getCompInfo_richText;
    function getCompInfo_button(comp) {
        var _a, _b, _c, _d;
        return {
            interactable: comp.interactable,
            transition: comp.transition,
            duration: comp.duration,
            zoomScale: comp.zoomScale,
            uuid_normalSprite: ((_a = comp.normalSprite) === null || _a === void 0 ? void 0 : _a.uuid) || "",
            uuid_pressedSprite: ((_b = comp.pressedSprite) === null || _b === void 0 ? void 0 : _b.uuid) || "",
            uuid_hoverSprite: ((_c = comp.hoverSprite) === null || _c === void 0 ? void 0 : _c.uuid) || "",
            uuid_disabledSprite: ((_d = comp.disabledSprite) === null || _d === void 0 ? void 0 : _d.uuid) || "",
            normalColor: comp.normalColor,
            pressedColor: comp.pressedColor,
            hoverColor: comp.hoverColor,
            disabledColor: comp.disabledColor,
        };
    }
    _compUtil.getCompInfo_button = getCompInfo_button;
})(_compUtil || (_compUtil = {}));
function _getSelfModelName() {
    let model = "";
    if (cc_1.sys.isNative) {
        if (cc_1.sys.os === cc_1.sys.OS.ANDROID) {
            model = "native_android";
        }
        else if (cc_1.sys.os === cc_1.sys.OS.IOS) {
            model = "native_ios";
        }
        else if (cc_1.sys.os === cc_1.sys.OS.WINDOWS) {
            model = "native_windows";
        }
        else if (cc_1.sys.os === cc_1.sys.OS.OSX) {
            model = "native_osx";
        }
        else if (cc_1.sys.os === cc_1.sys.OS.OHOS) {
            model = "native_ohos";
        }
        else if (cc_1.sys.os === cc_1.sys.OS.LINUX) {
            model = "native_linux";
        }
        else {
            model = "native_unknown";
        }
    }
    else if (cc_1.sys.platform === cc_1.sys.Platform.ALIPAY_MINI_GAME) {
        model = "alipay_mini_game";
    }
    else if (cc_1.sys.platform === cc_1.sys.Platform.WECHAT_GAME) {
        model = "wechat_game";
    }
    else if (cc_1.sys.platform === cc_1.sys.Platform.QTT_MINI_GAME) {
        model = "qq_play";
    }
    else if (cc_1.sys.platform === cc_1.sys.Platform.BYTEDANCE_MINI_GAME) {
        model = "bytedance_mini_game";
    }
    else if (cc_1.sys.platform === cc_1.sys.Platform.BAIDU_MINI_GAME) {
        model = "baidu_mini_game";
    }
    else if (cc_1.sys.platform === cc_1.sys.Platform.XIAOMI_QUICK_GAME) {
        model = "xiaomi_quick_game";
    }
    else if (cc_1.sys.platform === cc_1.sys.Platform.OPPO_MINI_GAME) {
        model = "oppo_mini_game";
    }
    else if (cc_1.sys.platform === cc_1.sys.Platform.VIVO_MINI_GAME) {
        model = "vivo_mini_game";
    }
    else if (cc_1.sys.platform === cc_1.sys.Platform.TAOBAO_CREATIVE_APP) {
        model = "taobao_creative_app";
    }
    else if (cc_1.sys.platform === cc_1.sys.Platform.TAOBAO_MINI_GAME) {
        model = "taobao_mini_game";
    }
    else if (cc_1.sys.platform === cc_1.sys.Platform.COCOSPLAY) {
        model = "cocosplay";
    }
    else if (cc_1.sys.platform === cc_1.sys.Platform.LINKSURE_MINI_GAME) {
        model = "linksure_mini_game";
    }
    else if (cc_1.sys.platform === cc_1.sys.Platform.HUAWEI_QUICK_GAME) {
        model = "huawei_quick_game";
    }
    else if (cc_1.sys.browserType === cc_1.sys.BrowserType.CHROME) {
        model = "browser_chrome";
    }
    else if (cc_1.sys.browserType === cc_1.sys.BrowserType.FIREFOX) {
        model = "browser_firefox";
    }
    else if (cc_1.sys.browserType === cc_1.sys.BrowserType.SAFARI) {
        model = "browser_safari";
    }
    else if (cc_1.sys.browserType === cc_1.sys.BrowserType.EDGE) {
        model = "browser_edge";
    }
    else if (cc_1.sys.browserType === cc_1.sys.BrowserType.IE) {
        model = "browser_ie";
    }
    else if (cc_1.sys.browserType === cc_1.sys.BrowserType.OPERA) {
        model = "browser_opera";
    }
    else if (cc_1.sys.browserType === cc_1.sys.BrowserType.MIUI) {
        model = "browser_miui";
    }
    else if (cc_1.sys.browserType === cc_1.sys.BrowserType.UC) {
        model = "browser_uc";
    }
    else if (cc_1.sys.browserType === cc_1.sys.BrowserType.QQ) {
        model = "browser_qq";
    }
    else if (cc_1.sys.browserType === cc_1.sys.BrowserType.BAIDU) {
        model = "browser_baidu";
    }
    else {
        model = "unknown";
    }
    if (cc_1.sys.isXR) {
        model += "_isXR";
    }
    return model;
}
function _initOnce() {
    _data = new _RuntimeData();
    const _socket = new RunTimeSocket();
    _socket.initSocket(`ws://localhost:${plugin_server_port}`);
    const _addRef = cc_2.Asset.prototype.addRef;
    const _decRef = cc_2.Asset.prototype.decRef;
    cc_2.Asset.prototype.addRef = function () {
        _addRef.call(this);
        _data.onRes_addRef(this);
        return this;
    };
    cc_2.Asset.prototype.decRef = function (autoRelease) {
        _decRef.call(this, autoRelease);
        _data.onRes_decRef(this);
        return this;
    };
    setInterval(() => {
        _socket.loop();
    }, 1000);
}
if (!env_1.EDITOR) {
    cc_4.director.once(cc_3.Director.EVENT_BEFORE_SCENE_LAUNCH, _initOnce);
}
var plugin_server_port = 8085;
