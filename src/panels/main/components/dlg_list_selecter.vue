<script setup lang="ts">
import { ref,reactive,watch,onUnmounted } from 'vue';
import { ElDialog, ElTree } from 'element-plus';

const menuPosition = reactive({ x: 0, y: 0 });
const fitlerStr = ref("")

// 模拟节点树数据
const treeData = [
    {label: 'Canvas',path: 'Canvas'},
    {label: 'btn_jump_A',path: 'Canvas/btn_jump_A'},
    {label: 'Label',path: 'Canvas/btn_jump_A/Label'},
    {label: 'btn_jump_B',path: 'Canvas/btn_jump_A'},
    {label: 'Label',path: 'Canvas/btn_jump_B/Label'},
    {label: 'm_tip',path: 'Canvas/m_tip'},
    {label: 'EditBox',path: 'Canvas/EditBox'},
    {label: 'Canvas',path: 'Canvas'},
    {label: 'btn_jump_A',path: 'Canvas/btn_jump_A'},
    {label: 'Label',path: 'Canvas/btn_jump_A/Label'},
    {label: 'btn_jump_B',path: 'Canvas/btn_jump_A'},
    {label: 'Label',path: 'Canvas/btn_jump_B/Label'},
    {label: 'm_tip',path: 'Canvas/m_tip'},
    {label: 'EditBox',path: 'Canvas/EditBox'},
    {label: 'Canvas',path: 'Canvas'},
    {label: 'btn_jump_A',path: 'Canvas/btn_jump_A'},
    {label: 'Label',path: 'Canvas/btn_jump_A/Label'},
    {label: 'btn_jump_B',path: 'Canvas/btn_jump_A'},
    {label: 'Label',path: 'Canvas/btn_jump_B/Label'},
    {label: 'm_tip',path: 'Canvas/m_tip'},
    {label: 'EditBox',path: 'Canvas/EditBox'},
    
];

// 定义树形结构的属性
const treeProps = {
    label: 'label',
    children: 'children',
};

// 控制弹窗显示与隐藏
const dialogVisible = ref(false);
const selfPopupRef = ref(null);

// 选中的节点路径
const selectedNodePath = ref('');

// 打开弹窗
function openDialog(event) {
    console.log('打开弹窗');
    dialogVisible.value = true;
    const { clientX, clientY } = event;
    menuPosition.x = clientX;
    menuPosition.y = clientY;
};

defineExpose({
    openDialog,
});

// 处理节点点击
const handleNodeClick = (node) => {
    if (node.path) {
    selectedNodePath.value = node.path;
    console.log('选中的节点路径:', selectedNodePath.value);
    }
};

function hideContextMenu() {
    dialogVisible.value = false;
}

const handlerClickGlobal = (e: MouseEvent) => {
    if (selfPopupRef.value == null) {
        return;
    }
    const rect = selfPopupRef.value.getBoundingClientRect();
    const isContain = e.clientX > rect.x && e.clientX < (rect.x + rect.width) && e.clientY > rect.y && e.clientY < (rect.y + rect.height);
    if (!isContain) {
        hideContextMenu();
        e.stopPropagation();
    }
};

// 监听菜单显示状态
watch(dialogVisible, (val) => {
    if (val) {
        document.addEventListener('click', handlerClickGlobal, { capture: true });
    } else {
        document.removeEventListener('click', handlerClickGlobal, { capture: true });
    }
});

// 组件卸载时清理事件
onUnmounted(() => {
    document.removeEventListener('click', handlerClickGlobal, { capture: true });
});

const treeRef = ref(null)

function filterMethod(query: string, data,node){
    console.log("filterMethod",fitlerStr.value,data.path)
    return data.path.indexOf(fitlerStr.value)>=0
}
// const filterMethod = (query: string, node) =>
//   node.label!.includes(query)

const onQueryChanged = (query: string) => {
  treeRef.value!.filter(query)
}

</script>

<template>
    <div
        v-if="dialogVisible"
        class="context-menu"
        :style="{ top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }"
        ref="selfPopupRef"
    >
        <ui-input v-model="fitlerStr" @change="onQueryChanged" placeholder="筛选" type="text"/>
        <el-tree-v2
            ref="treeRef"
            :data="treeData"
            :props="treeProps"
            :highlight-current="true"
            @node-click="handleNodeClick"
            :filter-method="filterMethod"
            :height="240"
        >
            <template #default="{ node }">
                
                <span>{{ node.data.path }}</span>
            </template>
        </el-tree-v2>
    </div>
</template>
  
<style scoped>

.context-menu {
    position: absolute;
    background: #333;
    border: 1px solid #fff;
    z-index: 1000;
    width: 300px; 
    height: 300px;
    color: #fff;
}

ui-input {
    margin: 6px;
    width:calc(100%-12px);
    height: 20px;
}

/* 自定义高亮背景和文字颜色 */
:deep(.custom-current) > .el-tree-node__content {
    background-color: #227F9B !important;
    color: #ffffff !important;
}

/* 修改 hover 状态下的背景色 */
:deep(.el-tree-node__content:hover) {
    background-color: #525252 !important;
    color: #ffffff !important;
}

/* 当前节点 hover 状态下应用高亮 */
:deep(.custom-current:hover) > .el-tree-node__content {
    background-color: #227F9B !important;
    color: #ffffff !important;
}

</style>
  