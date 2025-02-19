const path = require("path");
import { eventBus } from "./_enentBus";
import { _funcs } from "./_funcs";

class _DataContext{
    
    /**从资源缓存里删除了，暂时还没使用的资源 */
    private m_unusing_uuids:Array<string> = [];

    /**资源列表数据，主要分为assets和internal */
    private _assetTreeInfo:Array<ResTreeItem> = [];
    /**平铺的资源信息(不包括文件夹了) */
    private m_asset_map:Record<string,ResTreeItem> = {};

    public getResTree_datas(){
        return this._assetTreeInfo
    }

    /**节点树 */
    public curNodeTreeInfo:NodeTreeItem = null

    private _curSelectNodeUuid:TypeUUID = ""
    private _nodeInspectorInfoMap:Record<TypeUUID,InspectorInfo_Node> = {}
    public setCurSelectNodeInfo(info:InspectorInfo_Node){
        if(this._nodeInspectorInfoMap[info.uuid]==null){

        }
        this._curSelectNodeUuid = info.uuid
        this._nodeInspectorInfoMap[info.uuid] = info
    }
    /**当前选中的节点信息 */
    public get curSelNodeInspectorInfo(){
        if(!this._curSelectNodeUuid){
            return null
        }
        return this._nodeInspectorInfoMap[this._curSelectNodeUuid]??null
    }

    private _compAttrMap = {}
    /**
     * 将从runtime穿过来的节点信息中的组件的inspector属性列表单独取出来
     * @param info 
     */
    public parseCompAttrInfos(info:InspectorInfo_Node){
        for(let obj of info.components){
            if(obj["__attrMap"]){
                this._compAttrMap[obj.typeStr] = obj["__attrMap"]
                delete obj["__attrMap"]
            }
            if(this._compAttrMap[obj.typeStr]==null){
                console.log("error,没有传递inspector属性",obj.typeStr)
            }
        }
    }

    public getCompAttrInfo(classname:string){
        return this._compAttrMap[classname]
    }

    /**bundle列表 */
    public m_bundles:Record<string,ResTreeItem> = {}
    /**
     * 标记正在被使用的资源
     * @param uuids 是资源列表，如SpriteFrame、Texture2D、AnimationClip等，不包含文件夹
     */
    private async _recordAssetUuid(arr:Array<ResMemInfo>){
        return new Promise(async (resolve)=>{
            // console.log("arr",JSON.stringify(arr))
            for(let i=0;i<arr.length;i++){
                const resObj = arr[i]
                let uuid = resObj.uuid
                let hasRecord = this.getResNodeInfoWithUuid(uuid)
                
                if(hasRecord){
                    if(resObj?.refCount>0){
                        hasRecord.refCount = resObj.refCount
                    }
                    if(resObj?.memory>0){
                        hasRecord.memory = resObj.memory
                    }
                    if(resObj?.width>0){
                        hasRecord.width = resObj.width
                    }
                    if(resObj?.height>0){
                        hasRecord.height = resObj.height
                    }
                    continue
                }

                if(i>1000 && i%1000=== 0){
                    await _funcs.waitForSeconds(0.01)
                    // _funcs.log_1("正在加载资源",i,arr.length,Date.now()/1000)
                }
                let info = await _funcs.getAssetInfoByUuid(uuid)
                if(info==null){
                    //是网络资源，如 http://xxx/prop/11.png 这种
                    if(_funcs.isValidURL(uuid)){
                        info = {
                            url:uuid,
                            type:resObj.classname,
                            uuid:uuid,
                            path:uuid,
                            isDirectory:false
                        }
                    }else{
                        console.error("uuid找不到资源",uuid,resObj.classname)
                        continue
                    }
                }
                // console.log("info",info)
                let _resPaths = _funcs.getAllSubpathsFromUrl(info.url);//根据资源的url解析出来的各级路径
                let _parentInfo:ResTreeItem = null
                let bundleName:string = null
                // console.log("打印路径",info.url)
            
                for(let i=0;i<_resPaths.length;i++){
                    let _path = _resPaths[i];
                    let isFloder = i<_resPaths.length-1;
                    let isDatabase = i==0
                    let obj = this._getTreeItemInfoFromPath(_path);
                    
                    if(!obj){
                        obj = await this._createNewItemToTreeDataFromPath(_path,isDatabase,info,isFloder);
                        if(isDatabase){
                            this._assetTreeInfo.push(obj);
                        }else{
                            if(_parentInfo.children==null){
                                // console.error("_parentInfo.children==null",_parentInfo)
                                // console.log("xxxx obj",obj)
                                _parentInfo.children = []
                            }
                            _parentInfo.children.push(obj);
                            if(_parentInfo.uuid){
                                obj.parent = _parentInfo.uuid
                            }
                            
                            if(obj.isBundleFloder){
                                bundleName = obj.bundleName
                                if(!this.m_bundles[obj.bundleName]){
                                    this.m_bundles[obj.bundleName] = obj
                                }
                            }else{
                                if(_parentInfo.bundleName){
                                    obj.bundleName = _parentInfo.bundleName
                                }
                            }
                        }
                    }
                    if(i==_resPaths.length-1){
                        if(resObj?.memory>0){
                            obj.memory = resObj.memory
                        }
                        if(resObj?.refCount>0){
                            obj.refCount = resObj.refCount
                        }
                        if(resObj?.width>0){
                            obj.width = resObj.width
                        }
                        if(resObj?.height>0){
                            obj.height = resObj.height
                        }
                        this.m_asset_map[uuid] = obj
                    }
                    _parentInfo = obj;
                    if(bundleName){
                        obj.bundleName = bundleName
                        
                    }
                }
            }
            this._assetTreeInfo.sort((a,b)=>{
                if(a.name=="assets"){
                    return -1
                }else if(b.name=="assets"){
                    return 1
                }else{
                    return this._assetTreeInfo.indexOf(a)-this._assetTreeInfo.indexOf(b)
                }
            })
            // console.log("打印树结构",JSON.stringify(this._assetTreeInfo))
            resolve(null)
        })
    }

    private _assetTasks: Array<Array<ResMemInfo>> = [];
    private isProcessing = false;

    private async _processAssetTask() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        while (this._assetTasks.length > 0) {
            const task = this._assetTasks.shift();
            if (task) {
                await this._recordAssetUuid(task);
            }
        }
        this.isProcessing = false;
        for(let cb of this._onProcessCallback){
            cb()
        }
        this._onProcessCallback = []
    }
    private _onProcessCallback:Array<()=>void> = []
    mark_using_uuids(arr:Array<ResMemInfo>,callback:()=>void){
        this._onProcessCallback.push(callback)
        this._assetTasks.push(arr);
        this._processAssetTask();
    }

    private async _createNewItemToTreeDataFromPath(_path:string,isDatabase:boolean,info: EditorAssetInfo,isDirectory:boolean){
        let _url = "db://"+_path
        let name = path.basename(_path);
        let obj:ResTreeItem = {
            name: name,
            path: _path,
            isDirectory: isDirectory
        }
        if(isDirectory  && (info.type=="cc.Texture2D"||info.type=="cc.SpriteFrame")){
            let _data = await _funcs.getAssetInfoByUuid(_url)
            if(_data?.type=="cc.ImageAsset"||_data?.type=="cc.SpriteAtlas"){
                obj.isDirectory = isDirectory = false
                info = _data
            }
        }
        if(isDatabase){
            obj.icon = "database";
            obj.children = [];
        }else if(!isDirectory){
            obj.assetType = info.type;
            obj.uuid = info.uuid;
            obj.icon = _funcs.getIconOfResType(info.type);
            obj.url = info.url
            if(obj.assetType === "cc.ImageAsset" || obj.assetType === "cc.SpriteAtlas"){
                obj.children = [];
            }            
        }else {
            obj.icon = "directory";
            obj.children = [];
            let floderInfo = await _funcs.getAssetMetaByUuid(_url)
            
            const userData: {isBundle?: boolean,bundleName?: string } = floderInfo?.userData;
            if(userData?.isBundle){
                obj.isBundleFloder = true
                obj.bundleName = userData?.bundleName ?? obj.name
            }
            obj.uuid = await _funcs.getUuidByUrl(_url)
        }

        return obj
    }

    /**
     * 根据文件路径找到对应的TreeItemInfo
     * @param path 
     * @returns 
     */
    private _getTreeItemInfoFromPath(path:string,start:ResTreeItem=null):ResTreeItem{
        function searchInTreeItemInfo(treeItemInfo:ResTreeItem):ResTreeItem{
            if(treeItemInfo.path === path){
                return treeItemInfo;
            }else if(treeItemInfo.children){
                for(let child of treeItemInfo.children){
                    let result = searchInTreeItemInfo(child);
                    if(result){
                        return result;
                    }
                }
            }
            return null;
        }
        if(start){
            return searchInTreeItemInfo(start);
        }
        for(let treeData of this._assetTreeInfo){
            let result = searchInTreeItemInfo(treeData);
            if(result){
                return result;
            }
        }
    }
    /**
     * 根据uuid获取节点树中的项信息
     * @param uuid 
     * @returns 
     */
    getTreeNodeInfoWithUuid(uuid:string):NodeTreeItem{
        if(this.curNodeTreeInfo==null){
            return null
        }
        if(this.curNodeTreeInfo.uuid==uuid){
            return this.curNodeTreeInfo
        }
        for(let obj of this.curNodeTreeInfo.children){
            function traverse(node: NodeTreeItem) {
                // console.log(node.uuid,node.uuid == uuid)
                // console.log("path",node.path)
                if(node.uuid == uuid){
                    return node
                }
                if (node.children) {
                    for(let child of node.children){
                        let ret = traverse(child)
                        if(ret){
                            return ret
                        }
                    }
                }
            }

            let ret = traverse(obj)
            if(ret){
                return ret
            }
        }
        return null
    }

    /**
     * 根据uuid获取资源树中的项信息
     * @param uuid 
     * @returns 
     */
    getResNodeInfoWithUuid(uuid:string):ResTreeItem{
        if(this.m_asset_map[uuid]){
            return this.m_asset_map[uuid]
        }
        for(let obj of this._assetTreeInfo){
            function traverse(node: ResTreeItem) {
                if(node.uuid == uuid){
                    return node
                }
                if (node.children) {
                    for(let child of node.children){
                        let ret = traverse(child)
                        if(ret){
                            return ret
                        }
                    }
                }
            }

            let ret = traverse(obj)
            if(ret){
                return ret
            }
        }
        return null
    }

    /**Runtime掉线的时候调用 */
    clear(){
        this.m_asset_map = {}
        this._assetTreeInfo = []
        this.curNodeTreeInfo = null;
        this._curSelectNodeUuid = null;
        this._compAttrMap = {}
        this.m_bundles = {}
    }
}

export const _dataCtx = new _DataContext();