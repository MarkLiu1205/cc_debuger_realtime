<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, reactive, ref, defineProps, nextTick, watch} from 'vue';
import { ElMessage } from 'element-plus';
import { _funcs } from '../../../tools/_funcs';
import { _dataCtx } from '../../../tools/_dataCtx';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { TreeNodeData,TreeNode, TreeOptionProps,Tree } from 'element-plus/es/components/tree-v2/src/types';
import ContextMenu from './ContextMenu.vue';
import { eventBus } from '../../../tools/_enentBus';
import Comp_NodesTree from './comp_NodesTree.vue';
import Comp_AssetsTree from './comp_AssetsTree.vue';

const props = defineProps({
    resTree_datas: {
        type: Array<ResTreeItem>,
        default:[]
    },
    nodeTree_datas: {
        type: Array<NodeTreeItem>,
        default:[]
    },
})

const emit = defineEmits([
    'onClick_asset',
    'onClick_node',
])

const height_nodeTree = ref(200);
const height_resTree = ref(200);

const ref_parentContainer = ref(null);

const ref_container_nodeTree = ref(null);

const ref_container_resTree = ref(null);

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

function onClick_asset (data: ResTreeItem, node: TreeNode, e: MouseEvent){
    emit('onClick_asset', data);
}

function onClick_node (data: ResTreeItem, node: TreeNode, e: MouseEvent){
    emit('onClick_node', data);
}

</script>

<template>
    <div ref="ref_parentContainer" class="parent-container">
        <Comp_NodesTree ref="ref_container_nodeTree"
            :nodeTree_datas="props.nodeTree_datas" 
            :height_nodeTree="height_nodeTree"
            @onClick_node="onClick_node"
        />
        <div class="gap_line" ref="gap_line"></div>
        <Comp_AssetsTree  ref="ref_container_resTree"
            :resTree_datas="props.resTree_datas"
            :height_resTree="height_resTree"
            @onClick_asset="onClick_asset"
        />
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


.gap_line {
    height: 2px; /* 分隔条宽度 */
    cursor: row-resize; /* 改变鼠标光标样式 */
    user-select: none; /* 禁止用户选择文本 */
    background-color: #ccc; /* 分隔条背景色 */
    padding-top: 1px;
    /* padding-bottom: 2px; */
}


</style>
