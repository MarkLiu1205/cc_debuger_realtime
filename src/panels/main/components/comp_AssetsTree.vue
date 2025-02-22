<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, reactive, ref, defineProps, nextTick, watch, Ref} from 'vue';
import { ElMessage } from 'element-plus';
import { _funcs } from '../../../tools/_funcs';
import { _dataCtx } from '../../../tools/_dataCtx';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { TreeNodeData,TreeNode, TreeOptionProps,Tree } from 'element-plus/es/components/tree-v2/src/types';
import ContextMenu from './ContextMenu.vue';
import { eventBus } from '../../../tools/_enentBus';

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
])

const treeProp_res = computed(()=>{
    if(_isTreeMode.value){
        return {
            value: 'key',
            label: 'name',
            children: 'children',
        }
    }else{
        return {
            value: 'key',
            label: 'path',
            children: 'children',
        }
    }
    
})

const resTree_datas = ref<ResTreeItem[]>([])

function _updateNodeTreeKeys(arr:Array<ResTreeItem>){
    function traverse(node: ResTreeItem) {
        node["key"] = node.path+""+node.uuid
        if (node.children) {
            node.children.forEach(child => traverse(child));
        }
    }
    for(let node of arr){
        traverse(node)
    }
}

_pluginSocket.listenAssetAdded((arr:Array<ResMemInfo>)=>{
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

const ref_container_resTree = ref(null);
const ref_resTree = ref(null);


function handleClickOutside(event) {
    if(_funcs.checkMouseIsInElemen(ref_container_resTree.value, event)){
        if(selectedAssetId){
            selectedAssetId = null
            ref_resTree.value.setCurrentKey(null)
            nextTick(() => {
                ref_resTree.value?.setCurrentKey(null); // 确保 UI 重新渲染
            });
            emit('onSel_asset', null);
        }
    }
}

onMounted(() => {

    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {

    document.removeEventListener('click', handleClickOutside)
});

function on_click_in_inspector_asset(uuid: string){
    const info = _dataCtx.getResNodeInfoWithUuid(uuid)
    const key = info ? info["key"] : null;

    if (!key) return;
    shakeTreeItem(key); // 触发抖动动画
    const tree = ref_resTree.value;
    if (!tree) return;
    const nodeItem = tree.getNode(key);
    if (!nodeItem) {
        console.warn("资源未找到:", key);
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
            tree.scrollToNode(nodeItem);
        });
    }, 100);
}

function on_check_asset_usege_asset(uuid:string){
    console.log("检查引用此资源的资源列表:",uuid)
}

function on_check_asset_depend(uuid:string){
    console.log("检查此资源依赖的资源列表:",uuid)
}

function on_check_asset_depend_traverse(uuid:string){
    console.log("检查此资源依赖的资源列表(递归):",uuid)
}

onMounted(() => {
    eventBus.on("click-asset-in-inspector", on_click_in_inspector_asset);

    eventBus.on("check-asset-usege-asset", on_check_asset_usege_asset);

    eventBus.on("check-asset-depend", on_check_asset_depend);
    eventBus.on("check-asset-depend-traverse", on_check_asset_depend_traverse);
});

onUnmounted(() => {
    eventBus.off("click-asset-in-inspector", on_click_in_inspector_asset);

    eventBus.off("check-asset-usege-asset", on_check_asset_usege_asset);

    eventBus.off("check-asset-depend", on_check_asset_depend);
    eventBus.off("check-asset-depend-traverse", on_check_asset_depend_traverse);
});

let selectedAssetId: string | null = null
const customClass_Asset = (nodeData): string => {
  return nodeData.path === selectedAssetId ? 'custom-current' : ''
}

function onClick_asset (data: ResTreeItem, node: TreeNode, e: MouseEvent){
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
        emit('onSel_asset', data);
    }
}

const contextMenuRef = ref(null);


/**右键点击资源项 */
function onRightClick_asset( event: MouseEvent, data: ResTreeItem, node: TreeNode) {
    ref_resTree.value.setCurrentKey(node.key)   
    
    selectedAssetId = null
    onClick_asset(data,node,event)

    const menuOptions_asset = [
        { 
            label: '列举相关节点', 
            action: () => {
                console.log("点击1")
            }
        },{ 
            label: '监控引用计数', 
            action: () => {
                console.log("点击2")
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
    let bMatch = data.path.toLowerCase().includes(query.toLowerCase());
    if(!bMatch){
        if(data.uuid?.indexOf(query)>=0){
            bMatch = true
        }
    }
    return bMatch;
};

const onQueryChanged = (event) => {
    if (ref_resTree.value) {
        // console.log("开始筛选，输入值:", event.target.value);
        ref_resTree.value.filter(event.target.value);
    }
};

const _isTreeMode = ref(true)
function changeToListMode(){
    _isTreeMode.value = false
    updateRealAssetsData()
}
function changeToTreeMode(){
    _isTreeMode.value = true
    updateRealAssetsData()
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

</script>

<template>
    <div ref="ref_container_resTree" :style="{ height: height_resTree + 'px' }">
        <div class="loading-div" v-if="resTree_datas.length==0">
            <ui-loading></ui-loading>
            <span style="margin-left: 10px;">正在加载资源列表</span>
        </div>
        <div v-else>
            <div class="searchBar" :style="{height:searchBarHeight+'px'}">
                <ui-input style="flex: 1;" @change="onQueryChanged" placeholder="筛选路径或uuid" type="text"/>
                <div class="searchBar-button-container">
                    <ui-button type="icon" tooltip="切换为列表模式" @confirm="changeToListMode" v-if="_isTreeMode">
                        <ui-icon value="list"></ui-icon>
                    </ui-button>
                    <ui-button type="icon" tooltip="切换为树形模式" @confirm="changeToTreeMode" v-else>
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
                        :class="{ 'shake-animation': shakingNodeKey === node.data.key }"
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


</style>