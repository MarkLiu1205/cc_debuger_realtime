<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, reactive, ref, defineProps,defineExpose, nextTick, watch, Ref} from 'vue';
import { ElMessage, MessageParams } from 'element-plus';
import { _funcs } from '../../../tools/_funcs';
import { _dataCtx } from '../../../tools/_dataCtx';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { TreeNodeData,TreeNode, TreeOptionProps,Tree } from 'element-plus/es/components/tree-v2/src/types';
import ContextMenu from './ContextMenu.vue';
import { eventBus } from '../../../tools/_enentBus';

const filterCmd_assetUsege = "assetUsege:"


const showToast = inject<ToastParam>("message")

const props = defineProps({
    height_nodeTree: {
        type: Number,
        
    }
})

const emit = defineEmits([
    'onSel_node',
    'onClickOutside',
])

const treeProp_node:TreeOptionProps = {
  value: '_key',
  label: 'name',
  children: '_children',
}

const nodeTree_datas = ref<Array<NodeTreeItem>>([]);

function onNodeTreeChanges(info:NodeTreeDiffInfo){
    // _funcs.log_1("节点树变化：",JSON.stringify(data,null,2))
    if(info){
        _dataCtx._dealWithNodeTreeDiffInfo(info)
        nodeTree_datas.value = [..._dataCtx.curNodeTreeInfo]
    }
}

let _cancelFor_onSceneNodeTree:()=>void = null
let _cancelFor_onMousePickNode:()=>void = null

const bCanOpenPickMode = ref(false)

onMounted(()=>{
    _cancelFor_onSceneNodeTree = _pluginSocket.listenSceneNodeTree(onNodeTreeChanges)
    _cancelFor_onMousePickNode = _pluginSocket.listenMousePickNodeAchanged((uuid)=>{

        const data = _dataCtx.getCcNodeInfoWithUuid(uuid)
        const _key = data ? data["_key"] : null;

        if (!_key) return;

        ref_nodeTree.value.setCurrentKey(_key)   
    
        _curSelUuid.value = data.uuid
        _curSelNodeInfo.value = null
        onClick_node(data,null,null)

        on_click_in_inspector_node(uuid)
    })

    _pluginSocket.getGameEnv().then((obj)=>{
        bCanOpenPickMode.value = !obj.isMobile&&obj.isBrowser
    })
})

onUnmounted(()=>{
    if(_cancelFor_onSceneNodeTree){
        _cancelFor_onSceneNodeTree()
        _cancelFor_onSceneNodeTree = null
    }
    if(_cancelFor_onMousePickNode){
        _cancelFor_onMousePickNode()
        _cancelFor_onMousePickNode = null
    }
})

const _curSelNodeInfo = ref<InspectorInfo_Node>(null)
const _curSelUuid = ref("")

let _timeOutId:any = 0
async function _onSelect_node(item:NodeTreeItem){
    if(item==null){
        console.log("取消选中几点")
        _curSelNodeInfo.value = null
        emit('onSel_node', null);
        _pluginSocket.getNodeInfo(null)
        return null
    }
    _curSelUuid.value = item.uuid

    let newVal: InspectorInfo_Node = null

    clearTimeout(_timeOutId)
    _timeOutId = setTimeout(() => {
        if(newVal==null){
            emit('onSel_node', {isLoading:true});
        }
    }, 10);
    newVal = await _pluginSocket.getNodeInfo(item.uuid)
    if(newVal==null){
        return
    }
    // console.log(newVal)
    _dataCtx.parseCompAttrInfos(newVal)
    resetCurSelNodeInfo(newVal)
}

function resetCurSelNodeInfo(newVal){
    _curSelNodeInfo.value = newVal
    _dataCtx.setCurSelectNodeInfo(JSON.parse(JSON.stringify(newVal)))

    emit('onSel_node', newVal);
}

watch(_curSelNodeInfo, (newVal,old) => {
    if(old==null){
        return
    }
    if(newVal==null){
        return
    }
    
    const oldVal = _dataCtx.curSelNodeInspectorInfo;
    if(oldVal==null){
        return
    }
    if(oldVal.uuid!=newVal.uuid){
        return
    }

    compareChangedNodeInfo(newVal,oldVal)
   
}, { deep: true })

function compareChangedNodeInfo(newVal:InspectorInfo_Node,oldVal:InspectorInfo_Node){
    const _obj:ChangedNodeInfo = {
        uuid:newVal.uuid,
        nodeChange:{},
        compChanges:{}
    }
    
    for (let key in newVal) {
        if (key === "components") {
            continue;
        }
        if (typeof newVal[key] === 'object' && newVal[key] !== null) {
            _obj.nodeChange = _obj.nodeChange ?? {};
            _obj.nodeChange[key] = deepCompare(newVal[key], oldVal[key]);
            if(_obj.nodeChange[key]==null){
                delete _obj.nodeChange[key]
            }
        } else if (newVal[key] !== oldVal[key]) {
            _obj.nodeChange = _obj.nodeChange ?? {};
            _obj.nodeChange[key] = newVal[key];
        }
    }
    
    for(let i=0;i<newVal.components.length;i++){
        let newComp = newVal.components[i]
        let oldComp = oldVal.components[i];
        
        if(oldComp==null){
            break
        }

        for(let key in newComp){
            if (typeof newComp[key] === 'object' && newComp[key] !== null) {
                _obj.compChanges[newComp.uuid] = _obj.compChanges[newComp.uuid] ?? {};
                _obj.compChanges[newComp.uuid][key] = deepCompare(newComp[key], oldComp[key]);
                if(_obj.compChanges[newComp.uuid][key]==null){
                    delete _obj.compChanges[newComp.uuid][key]
                }
            } else if (newComp[key] !== oldComp[key]) {
                _obj.compChanges[newComp.uuid] = _obj.compChanges[newComp.uuid] ?? {};
                _obj.compChanges[newComp.uuid][key] = newComp[key];
            }
            
        }
        if(_obj.compChanges[newComp.uuid]!=null && Object.keys(_obj.compChanges[newComp.uuid]).length==0){
            delete _obj.compChanges[newComp.uuid]
        }else{
            applyChange(oldComp,_obj.compChanges[newComp.uuid])
        }

    }
    if(Object.keys(_obj.nodeChange).length==0){
        delete _obj.nodeChange
    }else{
        applyChange(oldVal,_obj.nodeChange)
    }
    if(Object.keys(_obj.compChanges).length==0){
        delete _obj.compChanges
    }
    if(_obj.nodeChange==null && _obj.compChanges==null){
        return
    }
    // console.log("节点改变",JSON.stringify(_obj))
    _pluginSocket.reqModifyNodeInfo(_obj)
}

/**递归比较两个对象 */
function deepCompare(newObj: any, oldObj: any) {
    if(oldObj==null){
        return null
    }
    let changes: Record<string, any> = {}
    for (let key in newObj) {
        if (typeof newObj[key] === 'object' && newObj[key] !== null) {
            if (!oldObj[key]) {
                changes[key] = newObj[key];
            } else {
                changes[key] = deepCompare(newObj[key], oldObj[key]);
                if (changes[key]==null || Object.keys(changes[key]).length === 0) {
                    delete changes[key];
                }
            }
        } else if (newObj[key] !== oldObj[key]) {
            changes[key] = newObj[key];
            // oldObj[key] = newObj[key];
        }
    }
    if(Object.keys(changes).length==0){
        return null
    }
    return changes;
}

function applyChange(oldoObj,changeMap:Record<string,any>){
    for(let key in changeMap){
        const oldVal = oldoObj[key]
        const newVal = changeMap[key]
        
        if(typeof newVal === "object"){
            applyChange(oldVal,newVal)
        }else{
            oldoObj[key] = newVal
        }
    }
}

const ref_container_nodeTree = ref(null);
const ref_searchBar = ref(null);
const ref_nodeTree = ref(null);


function handleClickOutside(event) {
    if(_funcs.checkMouseIsInElemen(ref_container_nodeTree.value, event)){
        if(_funcs.checkMouseIsInElemen(ref_searchBar.value, event)){
            return
        }
        emit('onClickOutside', null);
    }
}

function checkCancelSelect(){
    if(_curSelNodeInfo.value){
        _curSelUuid.value = ""
        _curSelNodeInfo.value = null
        ref_nodeTree.value.setCurrentKey(null)   
        nextTick(() => {
            ref_nodeTree.value?.setCurrentKey(null); // 确保 UI 重新渲染
        });
        
        _onSelect_node(null)
    }
}

defineExpose({
    checkCancelSelect,
    resetCurSelNodeInfo,
});

onMounted(() => {

    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {

    document.removeEventListener('click', handleClickOutside)
});

function on_click_in_inspector_node(uuid: string) {
    const info = _dataCtx.getCcNodeInfoWithUuid(uuid);
    const _key = info ? info["_key"] : null;

    if (!_key) return;
    shakeTreeItem(_key); // 触发抖动动画
    const tree = ref_nodeTree.value;
    if (!tree) return;
    const nodeItem = tree.getNode(_key);
    if (!nodeItem) {
        console.warn("节点未找到:", _key);
        return;
    }
    // console.log("目标节点:", nodeItem);
    // 递归展开所有父节点
    let parent = nodeItem.parent;
    while (parent) {
        tree.expandNode(parent, true); // 确保父级被展开
        parent = parent.parent;
    }
    // 滚动到目标节点
    nextTick(() => {
        tree.scrollToNode(_key);
    });
}

async function on_click_in_inspector_component(uuid: string){
    const {uuid:nodeUuid} = await _pluginSocket.getNodeOfComp(uuid)
    on_click_in_inspector_node(nodeUuid)
}

async function on_check_asset_usege_node(uuid:string){
    // console.log("检查引用此资源的节点:",uuid)
    const old = str_filter.value
    str_filter.value = `${filterCmd_assetUsege}${uuid}`
    if(old==str_filter.value){
        onFilterStrChange(str_filter.value,old)
    }
}

onMounted(() => {
    eventBus.on("click-node-in-inspector", on_click_in_inspector_node);
    eventBus.on("click-component-in-inspector", on_click_in_inspector_component);

    eventBus.on("check-asset-usege-node", on_check_asset_usege_node);
});

onUnmounted(() => {
    eventBus.off("click-node-in-inspector", on_click_in_inspector_node);
    eventBus.off("click-component-in-inspector", on_click_in_inspector_component);

    eventBus.off("check-asset-usege-node", on_check_asset_usege_node);
});

const customClass_Node = (nodeData): string => {
  return nodeData.uuid === _curSelUuid.value ? 'custom-current' : ''
}
async function onClick_node (data: NodeTreeItem, node: TreeNode, e: MouseEvent){
    if(_curSelNodeInfo.value?.uuid == data.uuid){
        if(ref_nodeTree.value){            
            _curSelUuid.value = ""
            _curSelNodeInfo.value = null
            ref_nodeTree.value.setCurrentKey(null)   
            nextTick(() => {
                ref_nodeTree.value?.setCurrentKey(null); // 确保 UI 重新渲染
            });
            
            _onSelect_node(null)
        }
    }else{

        _onSelect_node(data)
    }

}

const contextMenuRef = ref(null);

const defaultEvalFormat = `
const scene = cc.director.getScene();
let _node = null
scene.walk((child)=>{
    if(child.uuid == "{0}"){
        _node = child;
    }
})


const _comps = _node.components

return _comps.map(item=>item.__proto__.__classname__)

`

/**右键点击节点项 */
function onRightClick_node( event: MouseEvent, data: NodeTreeItem, node: TreeNode) {
    ref_nodeTree.value.setCurrentKey(node.key)   
    
    _curSelUuid.value = data.uuid
    _curSelNodeInfo.value = null
    onClick_node(data,node,event)

    const menuOptions_node = [
    { 
            label: "以此为上下文打开eval面板", 
            action: () => {
                console.log("----",data.path)
                const str = _funcs.formatStr(defaultEvalFormat,data.uuid)
                _funcs.openEvalPanel(str)
            }
        },{ 
            label: _funcs.getI18nText("text_37"), 
            action: () => {
                _funcs.log_1("Path",data.path)
                _funcs.log_1("UUID(已被复制)",data.uuid)
                navigator.clipboard.writeText(data.uuid)
            }
        },{ 
            label: _funcs.getI18nText("text_38"), 
            action: () => {
                // console.log("点击1",data.uuid,data.path)
                eventBus.emit("check-node-depends-asset", data.uuid);
            }
        },{ 
            label: _funcs.getI18nText("text_39"), 
            action: () => {
                // console.log("点击2",data.uuid,data.path)
                eventBus.emit("check-node-traverse-depends-asset", data.uuid);
            }
        },{ 
            label: _funcs.getI18nText("text_123"), 
            action: () => {
                if(data.isSceneNode){
                    showToast("场景节点不可删除")
                    return
                }
                _pluginSocket.destoryNode(data.uuid).then(()=>{
                    _funcs.log_1("节点删除成功")
                    _onSelect_node(null)
                }).catch((err)=>{
                    _funcs.log_1("删除节点失败",err)
                })
            }
        },{ 
            label:_funcs.getI18nText("text_124"), 
            action: () => {
                if(data.isSceneNode){
                    showToast("场景节点不可创建副本")
                    return
                }
                _pluginSocket.duplicateNode(data.uuid).then(()=>{
                    _funcs.log_1("创建副本成功")
                }).catch((err)=>{
                    _funcs.log_1("创建副本失败",err)
                })
            }
        }
    ];
    nextTick(()=>{
        contextMenuRef.value.showContextMenu(event, menuOptions_node);
    })
}

const shakingNodeKey = ref<string | null>(null);

function shakeTreeItem(nodeKey: string) {
    shakingNodeKey.value = nodeKey;

    // 动画持续 1.2s，之后清除高亮状态
    setTimeout(() => {
        shakingNodeKey.value = null;
    }, 0.8*1000);
}

function onDrop(data: TreeNodeData, node: TreeNode, e: DragEvent){
    console.log(data)
}

const filterMethod = (query:string, data:ResTreeItem,node) => {
    if (!query) return true;
    
    if (!data || !data.path) return false;
    let bMatch = false
    if(query.startsWith(filterCmd_assetUsege)){
        return filteredMapByAssetUuid[data.uuid]!=null
    }else{
        bMatch = data.path.toLowerCase().includes(query.toLowerCase());
        if(!bMatch){
            if(data.uuid?.indexOf(query)>=0){
                bMatch = true
            }
        }
    }
    
    return bMatch;
};

const str_filter = ref("")
let filteredMapByAssetUuid = {}

async function onFilterStrChange(newVal:string,oldVal?:string){
    if (ref_nodeTree.value) {
        if(newVal?.startsWith(filterCmd_assetUsege)){
            const assetUuid = newVal.replace(filterCmd_assetUsege,"")

            filteredMapByAssetUuid = await _pluginSocket.getAssetUsageInScene(assetUuid)

            const arr = Object.keys(filteredMapByAssetUuid)
            if(arr.length==0){
                // Editor.Dialog.error("没有节点引用引用此资源",{buttons:["确定"]})
                _funcs.log_1(_funcs.getI18nText("text_40"))
                showToast(_funcs.getI18nText("text_40"))
                
            }else{
                const nodePaths = arr.map((nodeUuid)=>{
                    return _dataCtx.getCcNodeInfoWithUuid(nodeUuid)?.path
                })
                _funcs.log_1(_funcs.getI18nText("text_42"),nodePaths)
                showToast(_funcs.formatStr(_funcs.getI18nText("text_41"),nodePaths.length))
            }
        }
        
        // console.log("开始筛选，输入值:", newVal);
        ref_nodeTree.value.filter(newVal);
    }
}

watch(str_filter,async (newVal,oldVal)=>{
    onFilterStrChange(newVal,oldVal)
})

const isCollapsed = ref(true)

//el-tree-v2 在 data 變更時會把展開狀態重設成 default-expanded-keys(element-plus 2.14 行為),
//因此自己維護目前展開的 key,綁到 :default-expanded-keys,讓節點樹更新(如顯示 border 會在場景
//新增 Graphics 節點觸發推送)時不會整棵收合。
const treeExpandedKeys = ref<string[]>([])

function onNodeExpand(data:any){
    const key = data?._key
    if(key!=null && !treeExpandedKeys.value.includes(key)){
        treeExpandedKeys.value.push(key)
    }
}

function onNodeCollapse(data:any){
    const key = data?._key
    const idx = treeExpandedKeys.value.indexOf(key)
    if(idx>=0){
        treeExpandedKeys.value.splice(idx,1)
    }
}

function doExpandAll() {
    isCollapsed.value = false;
    treeExpandedKeys.value = [..._dataCtx.allParendKeys]
    if (ref_nodeTree.value) {

        ref_nodeTree.value.setExpandedKeys(_dataCtx.allParendKeys);
    }
}

function doCollapseAll() {
    isCollapsed.value = true;
    treeExpandedKeys.value = []
    if (ref_nodeTree.value) {
        ref_nodeTree.value.setExpandedKeys([]);
    }
}

const searchBarHeight = 26;

const isHover = ref(false);

const clearFilterStr = () => {
    str_filter.value = ""
};

const bAutoFresh = ref(true)

async function handleAutoRefresh() {
    bAutoFresh.value = !bAutoFresh.value
    _pluginSocket.setLoopInterval(bAutoFresh.value?1000:0)
}

async function handlePickMode(event) {
    const bool = event.target.value
    await _pluginSocket.setIsPickMode(bool)
    if(bool){
        _funcs.log_1("设置为PickMode成功")
    }else{
        _funcs.log_1("已取消PickMode")
    }
    
}

async function doRefresh(){
    let timeBefore = Date.now()
    await _pluginSocket.updateNodeAndAssetInfo()
    let timeAfter = Date.now()
    _funcs.log_1(_funcs.formatStr("主动刷新，用时{0}ms",timeAfter-timeBefore))
}

</script>

<template>
    <div ref="ref_container_nodeTree"  :style="{ height: height_nodeTree + 'px'}">
        <div class="loading-div" v-if="nodeTree_datas.length==0">
            <ui-loading></ui-loading>
            <span style="margin-left: 10px;">{{_funcs.getI18nText("text_43")}}</span>
        </div>
        <div v-else>

        </div>
            <div ref="ref_searchBar" class="searchBar" :style="{height:searchBarHeight+'px'}">
                <div
                    class="input-container"
                    @mouseover="isHover = true"
                    @mouseleave="isHover = false"
                >
                    <ui-input
                        style="flex: 1;"
                        v-model="str_filter"
                        :placeholder='_funcs.getI18nText("text_44")'
                        type="text"
                    />
                    <ui-icon
                        v-if="isHover&&str_filter.length>0"
                        class="delete-btn"
                        value="close"
                        @click="clearFilterStr"
                    ></ui-icon>
                </div>
                <div class="searchBar-button-container">
                    <div style="width: 22px;">
                        <ui-button type="icon" :tooltip='_funcs.getI18nText("text_45")' @confirm="doExpandAll" v-if="isCollapsed">
                            <ui-icon value="expand"></ui-icon>
                        </ui-button>
                        <ui-button type="icon" :tooltip='_funcs.getI18nText("text_46")' @confirm="doCollapseAll" v-else>
                            <ui-icon value="collapse"></ui-icon>
                        </ui-button>
                    </div>
                    
                    <div style="width: 24px;display: flex; justify-content: center;align-items: center;" v-if="!bAutoFresh">
                        <ui-button type="icon" :tooltip='"点击主动刷新节点树"' @confirm="doRefresh" >
                            <ui-icon value="refresh"></ui-icon>
                        </ui-button>
                    </div>
                    <ui-checkbox tooltip="是否按时自动刷新节点树" :value="bAutoFresh" @change="handleAutoRefresh" v-if="false">自动刷新</ui-checkbox>
                    <ui-checkbox tooltip="是否开启pickMode" v-if="bCanOpenPickMode" @change="handlePickMode">PickMode</ui-checkbox>
                </div>
            </div>
            <el-tree-v2 ref="ref_nodeTree"
                :data="nodeTree_datas"
                :props="{...treeProp_node,class: customClass_Node}"
                :height="props.height_nodeTree - searchBarHeight-10"
                :default-expanded-keys="treeExpandedKeys"
                @node-click="onClick_node"
                @node-expand="onNodeExpand"
                @node-collapse="onNodeCollapse"
                :highlight-current="true"
                :expand-on-click-node="false"
                @node-contextmenu="onRightClick_node"
                :filter-method="filterMethod"
                @node-drop="onDrop"
            >
                <template #default="{ node }">
                    <ui-label 
                        class="nodeItem" 
                        :class="{ 'shake-animation': shakingNodeKey === node.data._key, noActive: !node.data.activeInHierarchy }"
                    >
                        {{ node.label }}
                    </ui-label>
                </template>
            </el-tree-v2>
    </div>
    
    <ContextMenu ref="contextMenuRef" />
</template>

<style scoped>

.loading-div {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.searchBar{
    display: flex;
    flex-direction: row;
    margin: 5px;
}

.searchBar-button-container {
    display: flex;
    justify-content: center; /* 横向居中对齐 */
    align-items: center;
    gap: 2px;
    /* width: 30px; */
}

:deep(.el-tree-node__content) {
    cursor: default !important;
}

/* 自定义高亮背景和文字颜色 */
:deep(.custom-current) > .el-tree-node__content {
    background-color: #227F9B !important; /* 金黄色背景 */
    color: #ffffff !important; /* 白色文字 */
}

/* 修改 hover 状态下的背景色 */
:deep(.el-tree-node__content:hover) {
    background-color: #525252 !important; /* 橙色背景 */
    color: #ffffff !important; /* 白色文字 */
}

/* 当前节点 hover 状态下应用高亮 */
:deep(.custom-current:hover) > .el-tree-node__content {
    background-color: #227F9B !important; /* 高亮背景色 */
    color: #ffffff !important; /* 文字颜色 */
}

.nodeItem{
    color: #EDEDED;
}

.nodeItem.noActive{
    color: #929292;
}

@keyframes shakeEffect {
    0% { transform: scale(1) rotate(0deg); color: #C68D4B; }
    10% { transform: scale(1.1) rotate(-5deg); }
    20% { transform: scale(1.1) rotate(5deg); }
    30% { transform: scale(1.1) rotate(-5deg); }
    40% { transform: scale(1.1) rotate(5deg); }
    50% { transform: scale(1.1) rotate(-5deg); }
    60% { transform: scale(1.1) rotate(0deg); }
    100% { transform: scale(1) rotate(0deg); color: inherit; }
}

.shake-animation {
    animation: shakeEffect 0.8s ease-in-out;
}

.input-container {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
}

.delete-btn {
    position: absolute; /* 绝对定位 */
    right: 5px; /* 距离右侧 8px */
    cursor: pointer;
    z-index: 1; /* 确保图标在输入框上方 */
}
</style>
