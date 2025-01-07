<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, reactive, ref, defineProps} from 'vue';
import { ElMessage } from 'element-plus';
import { _funcs } from '../../tools/_funcs';
import { _dataCtx } from '../../tools/_dataCtx';
import { _pluginSocket } from '../../tools/plugin_socket';
import { TreeNodeData,TreeNode, TreeOptionProps } from 'element-plus/es/components/tree-v2/src/types';


const props = defineProps({
    treeData_assets: Object,
    treeData_internal: Object,
    bundleNames: {
        type: Array,
        default: () => [],
    },
})

const emit = defineEmits([
    'update:selectedItem',
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

const xx_props:TreeOptionProps = {
  value: 'path',
  label: 'name',
  children: 'children',
}

const treeHeight = ref(0);
const treeContainer = ref(null);

const treeDatas = ref([])

const updateTreeHeight = () => {
    if (treeContainer.value) {
        treeHeight.value = treeContainer.value.clientHeight;
    }
};

onMounted(() => {
    window.addEventListener("resize", updateTreeHeight);
    updateTreeHeight(); // 初始化高度

    console.log("treeData_internal",props.treeData_internal)
    treeDatas.value = [props.treeData_assets,props.treeData_internal]
});

onUnmounted(() => {
    window.removeEventListener("resize", updateTreeHeight);
});

function onNodeClick (data: TreeNodeData, node: TreeNode, e: MouseEvent){
    emit('update:selectedItem', data);
}

function doReOpenSelfPopup(){
    Editor.Message.send(_funcs.getPluginName(),"restart-self")
}

</script>

<template>
    <div class="res-info">
        <ui-button type="icon" style="flex-shrink: 0; " @click="doReOpenSelfPopup">
            <ui-icon value="refresh" style="font-size: 16px;" />
        </ui-button>
    </div>
    <div  ref="treeContainer" class="tree-view-container">
        <el-tree-v2
            style="max-width: 600px;"
            :data="treeDatas"
            :props="xx_props"
            :height="treeHeight"
            @node-click="onNodeClick"
        >
        <template #default="{ node }">
            <ui-icon color="red" :value="node.data.icon"></ui-icon>
            <span>{{ node.label }}</span>
        </template>
        </el-tree-v2>
    </div>
</template>

<style scoped>
.res-info {
    height: 20%;
    border: 1px solid #ccc;
    padding-right: 10px;
    display: flex;
    flex-direction: column;
}

.tree-view-container { 
    height: 80%;
    display: flex;
    flex-direction: column;
    /* overflow-y: auto;  */
    border: 1px solid #ccc; /* 可选：为容器添加边框以明确可视区域 */
    padding-right: 10px; /* 可选：添加右侧内边距以避免滚动条遮挡内容 */
}

.prefix {
  color: var(--el-color-primary);
  margin-right: 10px;
}
.prefix.is-leaf {
  color: var(--el-color-success);
}
</style>
