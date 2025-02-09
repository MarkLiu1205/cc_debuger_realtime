<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, reactive, ref, defineProps, nextTick} from 'vue';
import { ElMessage } from 'element-plus';
import { _funcs } from '../../../tools/_funcs';
import { _dataCtx } from '../../../tools/_dataCtx';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { TreeNodeData,TreeNode, TreeOptionProps,Tree } from 'element-plus/es/components/tree-v2/src/types';
import ContextMenu from './ContextMenu.vue';

const props = defineProps({
    resTree_datas: {
        type: Array<ResTreeItem>,
        default:[]
    },
    bundleNames: {
        type: Array,
        default: () => [],
    },
    nodeTree_datas: {
        type: Array<NodeTreeItem>,
        default:[]
    },
})

const emit = defineEmits([
    'onClick_asset',
    'onClick_node',
    'change2ListView',
])


function onMenuSelectBundle(selectMenu){
    console.log("onMenuSelectBundle",selectMenu)
}
function onMenuSelectUsege(selectMenu){
    console.log("onMenuSelectUsege",selectMenu)
}
function onRefreshRes(){
    emit("change2ListView")
}

const treeProp_res:TreeOptionProps = {
  value: 'path',
  label: 'name',
  children: 'children',
}

const treeProp_node:TreeOptionProps = {
  value: 'key',
  label: 'name',
  children: 'children',
}

const height_nodeTree = ref(200);
const height_resTree = ref(200);

const ref_parentContainer = ref(null);

const ref_container_nodeTree = ref(null);
const ref_nodeTree = ref(null);

const ref_container_resTree = ref(null);
const ref_resTree = ref(null);

const gap_line = ref(null); //拉伸边界的线

const onMouseDown = (e:MouseEvent) => {
    const startY = e.clientY
    const startHeight = height_nodeTree.value

    const onMouseMove = (moveEvent) => {
        const parentHeight = ref_parentContainer.value.clientHeight
        const newHeight = startHeight + (moveEvent.clientY - startY)
        // 限制最小和最大宽度
        height_nodeTree.value = _funcs.clamp(parentHeight*0.2,parentHeight*0.8,newHeight)
        height_resTree.value = parentHeight - height_nodeTree.value
    }

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
}

const updateTreeHeight = () => {
    if (ref_parentContainer.value) {
        const parentHeight = ref_parentContainer.value.clientHeight
        height_nodeTree.value = parentHeight * 0.5
        height_resTree.value = parentHeight * 0.5
    }
};

function handleClickOutside(event) {
    if(_funcs.checkMouseIsInElemen(ref_container_nodeTree.value, event)){
        if(selectedNodeId){
            selectedNodeId = null
            ref_nodeTree.value.setCurrentKey(null)   
            nextTick(() => {
                ref_nodeTree.value?.setCurrentKey(null); // 确保 UI 重新渲染
            });
            emit('onClick_node', null);
        }
    }else if(_funcs.checkMouseIsInElemen(ref_container_resTree.value, event)){
        if(selectedAssetId){
            selectedAssetId = null
            ref_resTree.value.setCurrentKey(null)
            nextTick(() => {
                ref_resTree.value?.setCurrentKey(null); // 确保 UI 重新渲染
            });
            emit('onClick_asset', null);
        }
    }
}

onMounted(() => {
    window.addEventListener("resize", updateTreeHeight);
    updateTreeHeight(); // 初始化高度


    gap_line.value.addEventListener('mousedown', onMouseDown);

    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    window.removeEventListener("resize", updateTreeHeight);

    if (gap_line.value) {
        gap_line.value.removeEventListener('mousedown', onMouseDown)
    }

    document.removeEventListener('click', handleClickOutside)
});

// 记录当前选中的节点
let selectedNodeId: string | null = null

const customClass_Node = (nodeData): string => {
  return nodeData.uuid === selectedNodeId ? 'custom-current' : ''
}
function onClick_node (data: NodeTreeItem, node: TreeNode, e: MouseEvent){
    if(selectedNodeId == data.uuid){
        if(ref_nodeTree.value){            
            selectedNodeId = null
            ref_nodeTree.value.setCurrentKey(null)   
            nextTick(() => {
                ref_nodeTree.value?.setCurrentKey(null); // 确保 UI 重新渲染
            });
            emit('onClick_node', null);
        }
    }else{
        selectedNodeId = data.uuid
        emit('onClick_node', data);
    }
}

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
            emit('onClick_asset', null);
        }
    }else{
        selectedAssetId = data.path
        emit('onClick_asset', data);
    }
}

const contextMenuRef = ref(null);

// 菜单选项
const menuOptions_node = [
    { label: '选项 1', action: () => {
        console.log("点击1")
    }},
    { label: '选项选项选项 2', action: () => alert('选项 2 被点击') },
    { label: '选项选项选项 3', action: () => alert('选项 3 被点击') },
];
/**右键点击节点项 */
function onRightClick_node( event: MouseEvent, data: NodeTreeItem, node: TreeNode) {
    console.log("右键点击节点",data)
    contextMenuRef.value.showContextMenu(event, menuOptions_node);
}

// 菜单选项
const menuOptions_asset = [
    { label: '选项 1', action: () => {
        console.log("点击1")
    }},
    { label: '选项选项选项 2', action: () => alert('选项 2 被点击') },
    { label: '选项选项选项 3', action: () => alert('选项 3 被点击') },
];
/**右键点击资源项 */
function onRightClick_asset( event: MouseEvent, data: ResTreeItem, node: TreeNode) {
    contextMenuRef.value.showContextMenu(event, menuOptions_asset);
    console.log("右键点击资源",data)
}

</script>

<template>
    <div ref="ref_parentContainer" class="parent-container">
        <div ref="ref_container_nodeTree"  :style="{ height: height_nodeTree + 'px'}">
            <div class="loading-div" v-if="nodeTree_datas.length==0">
                <ui-loading></ui-loading>
                <span style="margin-left: 10px;">正在加载资源节点树</span>
            </div>
            <el-tree-v2 v-else ref="ref_nodeTree"
                style="max-width: 600px;"
                :data="props.nodeTree_datas"
                :props="{...treeProp_node,class: customClass_Node}"
                :height="height_nodeTree"
                @node-click="onClick_node"
                :highlight-current="true"
                :expand-on-click-node="false"
                @node-contextmenu="onRightClick_node"
            >
                <template #default="{ node }">
                    <ui-label class="nodeItem" :class="{noActive:!node.data.activeInHierarchy}">{{ node.label }}</ui-label>
                </template>
            </el-tree-v2>
        </div>
        <div class="gap_line" ref="gap_line"></div>
        <div ref="ref_container_resTree" :style="{ height: height_resTree + 'px' }">
            <div class="loading-div" v-if="resTree_datas.length==0">
                <ui-loading></ui-loading>
                <span style="margin-left: 10px;">正在加载资源列表</span>
            </div>
            <el-tree-v2 v-else  ref="ref_resTree"
                style="max-width: 600px;"
                :data="props.resTree_datas"
                :props="{...treeProp_res,class: customClass_Asset}"
                :height="height_resTree"
                @node-click="onClick_asset"
                :highlight-current="true"
                :expand-on-click-node="false"
                @node-contextmenu="onRightClick_asset"
            >
            <template #default="{ node }">
                <ui-icon color="red" :value="node.data.icon"></ui-icon>
                <span>{{ node.label }}</span>
            </template>
            </el-tree-v2>
        </div>
        <ContextMenu ref="contextMenuRef" />
    </div>
    
</template>

<style scoped>

.parent-container { 
    height: 100%;
    display: flex;
    flex-direction: column;
    /* overflow-y: auto;  */
    /* border: 1px solid #ccc; */
}

/* .border {
    border: 1px solid #ccc;
} */

.gap_line {
    height: 2px; /* 分隔条宽度 */
    cursor: row-resize; /* 改变鼠标光标样式 */
    user-select: none; /* 禁止用户选择文本 */
    background-color: #ccc; /* 分隔条背景色 */
    padding-top: 1px;
    /* padding-bottom: 2px; */
}

.loading-div {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
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
</style>
