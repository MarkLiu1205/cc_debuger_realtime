<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, reactive, ref, defineProps, nextTick, watch} from 'vue';
import { ElMessage } from 'element-plus';
import { _funcs } from '../../../tools/_funcs';
import { _dataCtx } from '../../../tools/_dataCtx';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { TreeNodeData,TreeNode, TreeOptionProps,Tree } from 'element-plus/es/components/tree-v2/src/types';
import ContextMenu from './ContextMenu.vue';
import { eventBus } from '../../../tools/_enentBus';

const props = defineProps({
    resTree_datas: {
        type: Array<ResTreeItem>,
        default:[]
    },
    height_resTree: {
        type: Number
    }
})

watch(props,(newVal,oldVal)=>{
    // console.log("资源树 发生改变",JSON.stringify(newVal))
},{ deep: true })

const emit = defineEmits([
    'onClick_asset',
    'onClick_node',
    'change2ListView',
])

const treeProp_res:TreeOptionProps = {
  value: 'path',
  label: 'name',
  children: 'children',
}


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
            emit('onClick_asset', null);
        }
    }
}

onMounted(() => {

    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {

    document.removeEventListener('click', handleClickOutside)
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
            emit('onClick_asset', null);
        }
    }else{
        selectedAssetId = data.path
        emit('onClick_asset', data);
    }
}

const contextMenuRef = ref(null);

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

const shakingNodeKey = ref<string | null>(null);

function shakeTreeItem(nodeKey: string) {
    shakingNodeKey.value = nodeKey;

    // 动画持续 1.2s，之后清除高亮状态
    setTimeout(() => {
        shakingNodeKey.value = null;
    }, 0.8*1000);
}


</script>

<template>
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
                <span style="margin-left: 5px;color: aquamarine;" v-if="node.data.assetType=='cc.ImageAsset'">  ({{ node.data.width }}x{{ node.data.height }})</span>
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


</style>
