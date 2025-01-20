<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, reactive, ref, defineProps} from 'vue';
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
  value: 'path',
  label: 'name',
  children: 'children',
}

const height_nodeTree = ref(200);
const height_resTree = ref(200);

const parentContainer = ref(null);


const gap_line = ref(null); //拉伸边界的线

const onMouseDown = (e:MouseEvent) => {
    const startY = e.clientY
    const startHeight = height_nodeTree.value

    const onMouseMove = (moveEvent) => {
        const parentHeight = parentContainer.value.clientHeight
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
    if (parentContainer.value) {
        const parentHeight = parentContainer.value.clientHeight
        height_nodeTree.value = parentHeight * 0.5
        height_resTree.value = parentHeight * 0.5
    }
};

onMounted(() => {
    window.addEventListener("resize", updateTreeHeight);
    updateTreeHeight(); // 初始化高度


    gap_line.value.addEventListener('mousedown', onMouseDown);
});

onUnmounted(() => {
    window.removeEventListener("resize", updateTreeHeight);

    if (gap_line.value) {
        gap_line.value.removeEventListener('mousedown', onMouseDown)
    }
});

// 记录当前选中的节点
let selectedNodeId: string | null = null

const customClass_Node = (nodeData): string => {
  return nodeData.uuid === selectedNodeId ? 'custom-current' : ''
}
function onClick_node (data: NodeTreeItem, node: TreeNode, e: MouseEvent){
    emit('onClick_node', data);
    selectedNodeId = data.uuid
}

let selectedAssetId: string | null = null
const customClass_Asset = (nodeData): string => {
  return nodeData.path === selectedAssetId ? 'custom-current' : ''
}

function onClick_asset (data: ResTreeItem, node: TreeNode, e: MouseEvent){
    emit('onClick_asset', data);
    selectedAssetId = data.path
}

const contextMenuRef = ref(null);

// 菜单选项
const menuOptions = [
    { label: '选项 1', action: () => alert('选项 1 被点击') },
    { label: '选项 2', action: () => alert('选项 2 被点击') },
    { label: '选项 3', action: () => alert('选项 3 被点击') },
];

/**右键点击节点项 */
function onRightClick_node( event: MouseEvent, data: NodeTreeItem, node: TreeNode) {
    console.log("右键点击节点",data)
}

/**右键点击资源项 */
function onRightClick_asset( event: MouseEvent, data: ResTreeItem, node: TreeNode) {
    contextMenuRef.value.showContextMenu(event, menuOptions);
    console.log("右键点击资源",data)
}

</script>

<template>
    <div ref="parentContainer" class="parent-container">
        <div :style="{ height: height_nodeTree + 'px' }">
            <el-tree-v2
                style="max-width: 600px;"
                :data="props.nodeTree_datas"
                :props="{...treeProp_node,class: customClass_Node}"
                :height="height_nodeTree"
                @node-click="onClick_node"
                :highlight-current="true"
                @node-contextmenu="onRightClick_node"
            >
            </el-tree-v2>
        </div>
        <div class="gap_line" ref="gap_line"></div>
        <div   :style="{ height: height_resTree + 'px' }">
            <el-tree-v2
                style="max-width: 600px;"
                :data="props.resTree_datas"
                :props="{...treeProp_res,class: customClass_Asset}"
                :height="height_resTree"
                @node-click="onClick_asset"
                :highlight-current="true"
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
    border: 1px solid #ccc; /* 可选：为容器添加边框以明确可视区域 */
}

.border {
    border: 1px solid #ccc;
}

.gap_line {
    height: 2px; /* 分隔条宽度 */
    cursor: row-resize; /* 改变鼠标光标样式 */
    user-select: none; /* 禁止用户选择文本 */
    background-color: #ccc; /* 分隔条背景色 */
}

/* 自定义高亮背景和文字颜色 */
::v-deep .custom-current > .el-tree-node__content {
    background-color: #227F9B !important; /* 金黄色背景 */
    color: #000000 !important; /* 白色文字 */
}

/* 修改 hover 状态下的背景色 */
::v-deep .el-tree-node__content:hover {
    background-color: #525252 !important; /* 橙色背景 */
    color: #ffffff !important; /* 白色文字 */
}

/* 当前节点 hover 状态下应用高亮 */
::v-deep .custom-current:hover > .el-tree-node__content {
    background-color: #227F9B !important; /* 高亮背景色 */
    color: #ffffff !important; /* 文字颜色 */
}
</style>
