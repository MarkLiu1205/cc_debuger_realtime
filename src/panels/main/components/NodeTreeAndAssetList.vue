<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, reactive, ref, defineProps} from 'vue';
import { ElMessage } from 'element-plus';
import { _funcs } from '../../../tools/_funcs';
import { _dataCtx } from '../../../tools/_dataCtx';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { TreeNodeData,TreeNode, TreeOptionProps } from 'element-plus/es/components/tree-v2/src/types';


const props = defineProps({
    resTree_datas: {
        type: Array,
        default:[]
    },
    bundleNames: {
        type: Array,
        default: () => [],
    },
    nodeTree_datas: {
        type: Array,
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

function onClick_node (data: TreeNodeData, node: TreeNode, e: MouseEvent){
    emit('onClick_node', data);
}
function onClick_asset (data: TreeNodeData, node: TreeNode, e: MouseEvent){
    emit('onClick_asset', data);
}

</script>

<template>
    <div ref="parentContainer" class="parent-container">
        <div :style="{ height: height_nodeTree + 'px' }">
            <el-tree-v2
                style="max-width: 600px;"
                :data="props.nodeTree_datas"
                :props="treeProp_node"
                :height="height_nodeTree"
                @node-click="onClick_node"
            >
            </el-tree-v2>
        </div>
        <div class="gap_line" ref="gap_line"></div>
        <div   :style="{ height: height_resTree + 'px' }">
            <el-tree-v2
                style="max-width: 600px;"
                :data="props.resTree_datas"
                :props="treeProp_res"
                :height="height_resTree"
                @node-click="onClick_asset"
            >
            <template #default="{ node }">
                <ui-icon color="red" :value="node.data.icon"></ui-icon>
                <span>{{ node.label }}</span>
            </template>
            </el-tree-v2>
        </div>
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
</style>
