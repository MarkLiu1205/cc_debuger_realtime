<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, reactive, ref, defineProps, nextTick, watch, Ref} from 'vue';
import { ElMessage,ElTreeV2 } from 'element-plus';
import { _funcs } from '../../../tools/_funcs';
import { _dataCtx } from '../../../tools/_dataCtx';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { TreeNodeData,TreeNode, TreeOptionProps,Tree } from 'element-plus/es/components/tree-v2/src/types';
import ContextMenu from './ContextMenu.vue';
import { eventBus } from '../../../tools/_enentBus';

const filterCmd_assetUsege = "assetUsege:"
const filterCmd_assetRefer = "assetRefer:"
const filterCmd_recursive_assetRefer = "assetRefer_recursive:"

const filterCmd_nodeDepends = "nodeDepends:"
const filterCmd_recursive_nodeDepends = "recursive_nodeDepends:"

const showToast = inject<ToastParam>("message")

const props = defineProps({
    
    height_resTree: {
        type: Number
    }
})

watch(props,(newVal,oldVal)=>{
    // console.log("资源树 发生改变",JSON.stringify(newVal))
},{ deep: true })

const emit = defineEmits([
    'onSel_asset',
    'onClickOutside',
])

const treeProp_res = computed(()=>{
    if(_isTreeMode.value){
        return {
            value: '_key',
            label: 'name',
            children: 'children',
        }
    }else{
        return {
            value: '_key',
            label: 'path',
            children: 'children',
        }
    }
    
})

const resTree_datas = ref<ResTreeItem[]>([])

function _updateNodeTreeKeys(arr:Array<ResTreeItem>){
    function traverse(node: ResTreeItem) {
        node["_key"] = node.path+""+node.uuid
        if (node.children) {
            node.children.forEach(child => traverse(child));
        }
    }
    for(let node of arr){
        traverse(node)
    }
}


let _cancelFor_onAssetAdded:()=>void = null
onMounted(()=>{
    _cancelFor_onAssetAdded = _pluginSocket.listenAssetAdded((arr:Array<ResMemInfo>)=>{
        if(arr==null){
            return
        }
        // console.log("获取到新增资源",JSON.stringify(arr))
        _dataCtx.mark_using_uuids(arr,() => {
            resTree_datas.value = [..._dataCtx.getResTree_datas()]
            _updateNodeTreeKeys(resTree_datas.value)
            updateRealAssetsData()
        })
    })
})

onUnmounted(()=>{
    if(_cancelFor_onAssetAdded){
        _cancelFor_onAssetAdded()
        _cancelFor_onAssetAdded = null
    }
})

const ref_container_resTree = ref(null);
const ref_searchBar = ref(null);
const ref_resTree = ref(null);


function handleClickOutside(event) {
    if(_funcs.checkMouseIsInElemen(ref_container_resTree.value, event)){
        if(_funcs.checkMouseIsInElemen(ref_searchBar.value, event)){
            return
        }
        checkCancelSelect()
        emit('onClickOutside', null);
    }
}

function checkCancelSelect(){
    if(selectedAssetId){
        selectedAssetId = null
        ref_resTree.value.setCurrentKey(null)
        nextTick(() => {
            ref_resTree.value?.setCurrentKey(null); // 确保 UI 重新渲染
        });
        emit('onSel_asset', null);
    }
}

defineExpose({
    checkCancelSelect,
});

onMounted(() => {

    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {

    document.removeEventListener('click', handleClickOutside)
});

function on_click_in_inspector_asset(uuid: string){
    const info = _dataCtx.getAssetItemInfoWithUuid(uuid)
    const _key = info ? info["_key"] : null;

    if (!_key) return;
    shakeTreeItem(_key); // 触发抖动动画
    const tree = ref_resTree.value;
    if (!tree) return;
    const nodeItem = tree.getNode(_key);
    if (!nodeItem) {
        console.warn("资源未找到:", _key);
        return;
    }
    // 递归展开所有父节点
    let parent = nodeItem.parent;
    while (parent) {
        tree.expandNode(parent, true); // 确保父级被展开
        parent = parent.parent;
    }
    // 滚动到目标节点
    setTimeout(() => {
        nextTick(() => {
            tree.scrollToNode(_key);
        });
    }, 100);
}

const str_filter = ref("")
let filteredArr_usege = []
let filteredArr_refer = []
let filteredArr_recursive_refer = []

async function onFilterStrChange(newVal:string,oldVal?:string){
    if (ref_resTree.value) {
        let arr = null;
        if(newVal?.startsWith(filterCmd_assetUsege)){
            const assetUuid = newVal.replace(filterCmd_assetUsege,"")
            filteredArr_usege = await _pluginSocket.getAssetUsageInOtherAsset(assetUuid)
            arr = filteredArr_usege
        }else if(newVal?.startsWith(filterCmd_assetRefer)){
            const assetUuid = newVal.replace(filterCmd_assetRefer,"")
            filteredArr_refer = await _pluginSocket.getDependsOfAsset(assetUuid)
            arr = filteredArr_refer
        }else if(newVal?.startsWith(filterCmd_recursive_assetRefer)){
            const assetUuid = newVal.replace(filterCmd_recursive_assetRefer,"")
            filteredArr_recursive_refer = await _pluginSocket.getRecursiveDependsOfAsset(assetUuid)
            arr = filteredArr_recursive_refer
        }else if(newVal?.startsWith(filterCmd_nodeDepends)){
            const assetUuid = newVal.replace(filterCmd_nodeDepends,"")
            filteredArr_recursive_refer = await _pluginSocket.getDependsOfNode(assetUuid)
            arr = filteredArr_recursive_refer
        }else if(newVal?.startsWith(filterCmd_recursive_nodeDepends)){
            const assetUuid = newVal.replace(filterCmd_recursive_nodeDepends,"")
            filteredArr_recursive_refer = await _pluginSocket.getRecursiveDependsOfNode(assetUuid)
            arr = filteredArr_recursive_refer
        }

        if(arr!=null){
            if(arr.length==0){
                _funcs.log_1(_funcs.getI18nText("text_21"))
                showToast(_funcs.getI18nText("text_21"))
                
            }else{
                const nodePaths = arr.map((nodeUuid)=>{
                    return _dataCtx.getAssetItemInfoWithUuid(nodeUuid)?.path
                })
                _funcs.log_1(_funcs.getI18nText("text_23"),nodePaths)
                showToast(_funcs.formatStr(_funcs.getI18nText("text_22"),nodePaths.length))
                
            }
        }
        
        // console.log("开始筛选，输入值:", newVal);
        ref_resTree.value.filter(newVal);
    }
}

watch(str_filter,async (newVal,oldVal)=>{
    onFilterStrChange(newVal,oldVal)
})

async function on_check_asset_usege_asset(uuid:string){
    // _isTreeMode.value = false
    const old = str_filter.value
    str_filter.value = `${filterCmd_assetUsege}${uuid}`
    if(old==str_filter.value){
        onFilterStrChange(str_filter.value,old)
    }
}

function on_check_asset_depend(uuid:string){
    // _isTreeMode.value = false
    const old = str_filter.value
    str_filter.value = `${filterCmd_assetRefer}${uuid}`
    if(old==str_filter.value){
        onFilterStrChange(str_filter.value,old)
    }
}

function on_check_asset_depend_traverse(uuid:string){
    // _isTreeMode.value = false
    const old = str_filter.value
    str_filter.value = `${filterCmd_recursive_assetRefer}${uuid}`
    if(old==str_filter.value){
        onFilterStrChange(str_filter.value,old)
    }
}

/**
 * 获取指定节点直接依赖的资源列表
 * @param nodeUuid 
 */
function on_check_node_depends_asset(nodeUuid:string){
    _isTreeMode.value = false
    str_filter.value = `${filterCmd_nodeDepends}${nodeUuid}`
    onFilterStrChange(str_filter.value)
}

/**
 * 获取指定节点递归依赖（即包含子节点）的资源列表
 * @param nodeUuid 
 */
 function on_check_node_traverse_depends_asset(nodeUuid:string){
    _isTreeMode.value = false
    str_filter.value = `${filterCmd_recursive_nodeDepends}${nodeUuid}`
    onFilterStrChange(str_filter.value)
}

onMounted(() => {
    eventBus.on("click-asset-in-inspector", on_click_in_inspector_asset);

    eventBus.on("check-asset-usege-asset", on_check_asset_usege_asset);

    eventBus.on("check-asset-depend", on_check_asset_depend);
    eventBus.on("check-asset-depend-traverse", on_check_asset_depend_traverse);

    eventBus.on("check-node-depends-asset", on_check_node_depends_asset);
    eventBus.on("check-node-traverse-depends-asset", on_check_node_traverse_depends_asset);
});

onUnmounted(() => {
    eventBus.off("click-asset-in-inspector", on_click_in_inspector_asset);

    eventBus.off("check-asset-usege-asset", on_check_asset_usege_asset);

    eventBus.off("check-asset-depend", on_check_asset_depend);
    eventBus.off("check-asset-depend-traverse", on_check_asset_depend_traverse);

    eventBus.off("check-node-depends-asset", on_check_node_depends_asset);
    eventBus.off("check-node-traverse-depends-asset", on_check_node_traverse_depends_asset);
});

let selectedAssetId: string | null = null
const customClass_Asset = (nodeData): string => {
  return nodeData.path === selectedAssetId ? 'custom-current' : ''
}

async function onClick_asset (data: ResTreeItem, node: TreeNode, e: MouseEvent){
    if(selectedAssetId==data.path){
        if(ref_resTree.value){
            ref_resTree.value.setCurrentKey(null)
            selectedAssetId = null
            nextTick(() => {
                ref_resTree.value?.setCurrentKey(null); // 确保 UI 重新渲染
            });
            emit('onSel_asset', null);
        }
    }else{
        selectedAssetId = data.path
        if(data.assetType=="cc.SpriteFrame"){
            let info = await _pluginSocket.getSpriteFrameInfo(data.uuid)
            if(info.dynamicTexId!=null){
                data.dynamicTexId = info.dynamicTexId
            }
            // console.log("=======info",info)
        }
        
        emit('onSel_asset', data);
    }
}

const contextMenuRef = ref(null);


/**右键点击资源项 */
function onRightClick_asset( event: MouseEvent, data: ResTreeItem, node: TreeNode) {
    ref_resTree.value.setCurrentKey(node.key)   
    
    selectedAssetId = null
    onClick_asset(data,node,event)

    if(data.isDirectory){
       return 
    }
    const menuOptions_asset = [
        { 
            label: _funcs.getI18nText("text_24"), 
            action: () => {
                _funcs.log_1(_funcs.getI18nText("text_25"),data.uuid)
                navigator.clipboard.writeText(data.uuid)
            }
        },{ 
            label: _funcs.getI18nText("text_26"), 
            action: () => {
                eventBus.emit("check-asset-usege-node", data.uuid);
            }
        },{ 
            label: _funcs.getI18nText("text_27"), 
            action: () => {
                eventBus.emit("check-asset-usege-asset", data.uuid);
            }
        },{ 
            label: _funcs.getI18nText("text_28"), 
            action: () => {
                eventBus.emit("check-asset-depend", data.uuid);
            }
        },{ 
            label: _funcs.getI18nText("text_29"), 
            action: () => {
                eventBus.emit("check-asset-depend-traverse", data.uuid);
            }
        }
    ];
    nextTick(()=>{
        contextMenuRef.value.showContextMenu(event, menuOptions_asset);
    })
    
    // console.log("右键点击资源",data)
}

const shakingNodeKey = ref<string | null>(null);

function shakeTreeItem(nodeKey: string) {
    shakingNodeKey.value = nodeKey;

    // 动画持续 1.2s，之后清除高亮状态
    setTimeout(() => {
        shakingNodeKey.value = null;
    }, 0.8*1000);
}

function getItemDesc(data:ResTreeItem){
    if (data.isDirectory) {
        return "";
    }
    if(data.refCount == null){
        return '⚠️'
    }
    let str = `(${data.refCount})`;
    if (data.assetType == 'cc.ImageAsset') {
        str += `(${data.width}x${data.height})`;
    }
    return str;
}

function getItemStyle(data:ResTreeItem){
    if(!data.isDirectory && data.refCount == null){
        return 'margin-left: 5px;color: #ff0000;'
    }
    return 'margin-left: 5px;color: aquamarine;'
}

const filterMethod = (query:string, data:ResTreeItem,node) => {
    if (!query) return true;
    
    if (!data || !data.path) return false;
    let bMatch = false
    if(query.startsWith(filterCmd_assetUsege)){
        return filteredArr_usege.indexOf(data.uuid)>=0
    }else if(query.startsWith(filterCmd_assetRefer)){
        return filteredArr_refer.indexOf(data.uuid)>=0
    }else if(query.startsWith(filterCmd_recursive_assetRefer)){
        return filteredArr_recursive_refer.indexOf(data.uuid)>=0
    }else if(query.startsWith(filterCmd_nodeDepends)){
        return filteredArr_recursive_refer.indexOf(data.uuid)>=0
    }else if(query.startsWith(filterCmd_recursive_nodeDepends)){
        return filteredArr_recursive_refer.indexOf(data.uuid)>=0
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


const _isTreeMode = ref(true)

watch(_isTreeMode,(newVal,oldVal)=>{
    updateRealAssetsData()
})

function changeToListMode(){
    _isTreeMode.value = false
    
    // str_filter.value = ""
}
function changeToTreeMode(){
    _isTreeMode.value = true
    // str_filter.value = ""
}

function flattenTree(arr: ResTreeItem[]) {
    const result = [];

    function traverse(node: ResTreeItem) {
        if (!node.isDirectory) {
            const obj = {...node}
            obj.children = null
            result.push(obj);
        }
        if (node.children) {
            node.children.forEach(child => traverse(child));
        }
    }

    for(let item of arr){
        traverse(item)
    }
    return result;
}

const _listDatas = computed(()=>{
    return flattenTree(resTree_datas.value)
})

const _realAssetsData = ref(null)
function updateRealAssetsData(){
    if(_isTreeMode.value){
        _realAssetsData.value = resTree_datas.value
    }else{
        _realAssetsData.value = _listDatas.value
    }
}

const searchBarHeight = 26;

const isHover = ref(false);

const clearFilterStr = () => {
    str_filter.value = ""
};

</script>

<template>
    <div ref="ref_container_resTree" :style="{ height: height_resTree + 'px' }">
        <div class="loading-div" v-if="resTree_datas.length==0">
            <ui-loading></ui-loading>
            <span style="margin-left: 10px;">{{ _funcs.getI18nText("text_30") }}</span>
        </div>
        <div v-else>
            <div ref="ref_searchBar" class="searchBar" :style="{height:searchBarHeight+'px'}">
                <div
                    class="input-container"
                    @mouseover="isHover = true"
                    @mouseleave="isHover = false"
                >
                    <ui-input
                        style="flex: 1;"
                        v-model="str_filter"
                        :placeholder='_funcs.getI18nText("text_31")'
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
                    <ui-button type="icon" :tooltip='_funcs.getI18nText("text_32")' @confirm="changeToListMode" v-if="_isTreeMode">
                        <ui-icon value="list"></ui-icon>
                    </ui-button>
                    <ui-button type="icon" :tooltip='_funcs.getI18nText("text_33")' @confirm="changeToTreeMode" v-else>
                        <ui-icon value="render-stage"></ui-icon>
                    </ui-button>
                </div>
            </div>
            <el-tree-v2  ref="ref_resTree"
                :key="_isTreeMode ? 'tree' : 'list'"
                :data="_realAssetsData"
                :props="{...treeProp_res,class: customClass_Asset}"
                :height="height_resTree - searchBarHeight - 5"
                @node-click="onClick_asset"
                :highlight-current="true"
                :expand-on-click-node="false"
                @node-contextmenu="onRightClick_asset"
                :filter-method="filterMethod"
            >
                <template #default="{ node }">
                    <ui-icon color="red" :value="node.data.icon"></ui-icon>

                    <ui-label 
                        :class="{ 'shake-animation': shakingNodeKey === node.data._key }"
                    >
                        {{ _isTreeMode?node.label:node.data.url }}
                    </ui-label>

                    <span :style="getItemStyle(node.data)" > {{ getItemDesc(node.data) }}</span>
                </template>
            </el-tree-v2>
        </div>
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
}

.searchBar-button-container {
    display: flex;
    justify-content: center; /* 横向居中对齐 */
    align-items: center;
    width: 30px;
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