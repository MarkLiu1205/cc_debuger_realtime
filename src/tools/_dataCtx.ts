const path = require("path");
import { _funcs } from "./_funcs";

class _DataContext{
    /**正在被使用的资源 */
    private m_using_uuids:Record<string,number> = {};
    /**从资源缓存里删除了，暂时还没使用的资源 */
    private m_unusing_uuids:Array<string> = [];

    /**资源列表数据，主要分为assets和internal */
    private _allAssetArr:Array<ResTreeItem> = [];

    public getResTree_datas(){
        this._allAssetArr.sort(function(a,b) {
            if(a.name=="assets"){
                return -1
            }else if(b.name=="assets"){
                return 1
            }else{
                return this._allAssetArr.indexOf(a)-this._allAssetArr.indexOf(b)
            }
        })
        return this._allAssetArr
    }

    /**节点树 */
    public curNodeTreeInfo:ResTreeItem = null

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

    /**bundle列表 */
    public m_bundleNames:Array<string> = []
    /**
     * 标记正在被使用的资源
     * @param uuids 是资源列表，如SpriteFrame、Texture2D、AnimationClip等，不包含文件夹
     */
    async mark_using_uuids(uuidMap:Record<string,number>){
        const arr = []
        for(let uuid in uuidMap){
            this.m_using_uuids[uuid] = uuidMap[uuid]
            arr.push(uuid)
        }
        console.log("mark_using_uuids",arr.length)
        for(let i=0;i<arr.length;i++){
            let uuid = arr[i]
            if(i%1000=== 0){
                await _funcs.waitForSeconds(0.01)
                _funcs.log_1("正在加载资源",i,arr.length,Date.now()/1000)
            }
            let info = await _funcs.getAssetInfoByUuid(uuid)
            if(info==null){//比如网络图片等，下个版本再处理
                console.error("uuid找不到资源",uuid)
                continue
            }
            let _resPaths = _funcs.getAllSubpathsFromUrl(info.url);//根据资源的url解析出来的各级路径
            let _parentInfo:ResTreeItem = null
            let bundleName:string = null
            // console.log("打印路径",info.url)
            for(let i=0;i<_resPaths.length;i++){
                let _path = _resPaths[i];
                let isAsset = i==_resPaths.length-1;
                let isDatabase = i==0
                let obj = this._getTreeItemInfoFromPath(_path);
                if(!obj){
                    obj = await this._createNewItemToTreeDataFromPath(_path,isAsset,isDatabase,info);
                    if(isDatabase){
                        this._allAssetArr.push(obj);
                    }else{
                        _parentInfo.children.push(obj);
                        if(obj.isBundleFloder){
                            bundleName = obj.bundleName
                            if(this.m_bundleNames.indexOf(bundleName)==-1){
                                this.m_bundleNames.push(bundleName)
                            }
                        }
                    }
                }
                _parentInfo = obj;
                if(bundleName){
                    obj.bundleName = bundleName
                    if(obj.isAsset){
                        console.log("bundleName",bundleName,_path)
                    }
                }
            }
        }
        this._allAssetArr.sort(function(a,b) {
            if(a.name=="assets"){
                return -1
            }else if(b.name=="assets"){
                return 1
            }else{
                return this._allAssetArr.indexOf(a)-this._allAssetArr.indexOf(b)
            }
        })
        // console.log("打印树结构",JSON.stringify(this._allAssetArr,null,4))
    }

    private async _createNewItemToTreeDataFromPath(_path:string,isAsset:boolean,isDatabase:boolean,info: EditorAssetInfo){
        let name = path.basename(_path);
        let obj:ResTreeItem = {
            name: name,
            path: _path,
            isAsset: isAsset,
        }
        if(isDatabase){
            obj.icon = "database";
            obj.children = [];
        }else if(isAsset){
            obj.assetType = info.type;
            obj.uuid = info.uuid;
            obj.icon = _funcs.getIconOfResType(info.type);
            if(obj.assetType === "cc.ImageAsset"){
                obj.children = [];
            }
        }else {
            obj.icon = "directory";
            obj.children = [];
            let url = "db://"+_path
            let floderInfo = await _funcs.getAssetMetaByUuid(url)
            
            const userData: {isBundle?: boolean,bundleName?: string } = floderInfo?.userData;
            if(userData?.isBundle){
                obj.isBundleFloder = true
                obj.bundleName = userData?.bundleName ?? obj.name
            }
            obj.uuid = await _funcs.getUuidByUrl(url)

            // if(_path.indexOf("assets")>=0){
            //     console.log("是bundle?",userData.isBundle,obj.uuid)
            //     console.log("floderInfox",typeof floderInfo,floderInfo)
            // }
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
        for(let treeData of this._allAssetArr){
            let result = searchInTreeItemInfo(treeData);
            if(result){
                return result;
            }
        }
    }


}

export const _dataCtx = new _DataContext();