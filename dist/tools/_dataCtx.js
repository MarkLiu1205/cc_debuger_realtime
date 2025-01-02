"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._dataCtx = void 0;
const path_1 = __importDefault(require("path"));
const _editor_1 = require("./_editor");
const _misc_1 = require("./_misc");
class _DataContext {
    constructor() {
        /**正在被使用的资源 */
        this.m_using_uuids = {};
        /**从资源缓存里删除了，暂时还没使用的资源 */
        this.m_unusing_uuids = [];
        /**资源列表数据，主要分为assets和internal */
        this.m_treeDatas = [];
        /**bundle列表 */
        this.m_bundleNames = [];
    }
    get treeData_assets() {
        for (let treeData of this.m_treeDatas) {
            if (treeData.name === "assets") {
                return treeData;
            }
        }
    }
    get treeData_internal() {
        for (let treeData of this.m_treeDatas) {
            if (treeData.name === "internal") {
                return treeData;
            }
        }
    }
    /**
     * 标记正在被使用的资源
     * @param uuids 是资源列表，如SpriteFrame、Texture2D、AnimationClip等，不包含文件夹
     */
    async mark_using_uuids(uuidMap) {
        const arr = [];
        for (let uuid in uuidMap) {
            this.m_using_uuids[uuid] = uuidMap[uuid];
            arr.push(uuid);
        }
        console.log("mark_using_uuids", arr.length);
        for (let i = 0; i < arr.length; i++) {
            let uuid = arr[i];
            if (i % 1000 === 0) {
                await _misc_1._misc.waitForSeconds(0.01);
                _misc_1._misc.log_1("正在加载资源", i, arr.length, Date.now() / 1000);
            }
            let info = await _editor_1._editor.getAssetInfoByUuid(uuid);
            if (info == null) { //比如网络图片等，下个版本再处理
                console.error("uuid找不到资源", uuid);
                continue;
            }
            let _resPaths = _misc_1._misc.getAllSubpathsFromUrl(info.url); //根据资源的url解析出来的各级路径
            let _parentInfo = null;
            let bundleName = null;
            // console.log("打印路径",info.url)
            for (let i = 0; i < _resPaths.length; i++) {
                let _path = _resPaths[i];
                let isAsset = i == _resPaths.length - 1;
                let isDatabase = i == 0;
                let obj = this._getTreeItemInfoFromPath(_path);
                if (!obj) {
                    obj = await this._createNewItemToTreeDataFromPath(_path, isAsset, isDatabase, info);
                    if (isDatabase) {
                        this.m_treeDatas.push(obj);
                    }
                    else {
                        _parentInfo.children.push(obj);
                        if (obj.isBundleFloder) {
                            bundleName = obj.bundleName;
                            if (this.m_bundleNames.indexOf(bundleName) == -1) {
                                this.m_bundleNames.push(bundleName);
                            }
                        }
                    }
                }
                _parentInfo = obj;
                if (bundleName) {
                    obj.bundleName = bundleName;
                    if (obj.isAsset) {
                        console.log("bundleName", bundleName, _path);
                    }
                }
            }
        }
        // console.log("打印树结构",JSON.stringify(this.m_treeDatas,null,4))
    }
    async _createNewItemToTreeDataFromPath(_path, isAsset, isDatabase, info) {
        var _a;
        let name = path_1.default.basename(_path);
        let obj = {
            name: name,
            path: _path,
            isAsset: isAsset,
        };
        if (isDatabase) {
            obj.icon = "database";
            obj.children = [];
        }
        else if (isAsset) {
            obj.assetType = info.type;
            obj.uuid = info.uuid;
            obj.icon = _misc_1._misc.getIconOfResType(info.type);
            if (obj.assetType === "cc.ImageAsset") {
                obj.children = [];
            }
        }
        else {
            obj.icon = "directory";
            obj.children = [];
            let url = "db://" + _path;
            let floderInfo = await _editor_1._editor.getAssetMetaByUuid(url);
            const userData = floderInfo === null || floderInfo === void 0 ? void 0 : floderInfo.userData;
            if (userData === null || userData === void 0 ? void 0 : userData.isBundle) {
                obj.isBundleFloder = true;
                obj.bundleName = (_a = userData === null || userData === void 0 ? void 0 : userData.bundleName) !== null && _a !== void 0 ? _a : obj.name;
            }
            obj.uuid = await _editor_1._editor.getUuidByUrl(url);
            // if(_path.indexOf("assets")>=0){
            //     console.log("是bundle?",userData.isBundle,obj.uuid)
            //     console.log("floderInfox",typeof floderInfo,floderInfo)
            // }
        }
        return obj;
    }
    /**
     * 根据文件路径找到对应的TreeItemInfo
     * @param path
     * @returns
     */
    _getTreeItemInfoFromPath(path, start = null) {
        function searchInTreeItemInfo(treeItemInfo) {
            if (treeItemInfo.path === path) {
                return treeItemInfo;
            }
            else if (treeItemInfo.children) {
                for (let child of treeItemInfo.children) {
                    let result = searchInTreeItemInfo(child);
                    if (result) {
                        return result;
                    }
                }
            }
            return null;
        }
        if (start) {
            return searchInTreeItemInfo(start);
        }
        for (let treeData of this.m_treeDatas) {
            let result = searchInTreeItemInfo(treeData);
            if (result) {
                return result;
            }
        }
    }
}
exports._dataCtx = new _DataContext();
