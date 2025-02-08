<script setup lang="ts">
import { ref,reactive,watch,onUnmounted } from 'vue';
import { ElDialog, ElTree } from 'element-plus';

const menuPosition = reactive({ x: 0, y: 0 });

// 模拟节点树数据
let treeData = [
    {name: 'Canvas',path: 'Canvas'},
    {name: 'btn_jump_A',path: 'Canvas/btn_jump_A'},
    {name: 'Label',path: 'Canvas/btn_jump_A/Label'},
    {name: 'btn_jump_B',path: 'Canvas/btn_jump_A'},
    {name: 'Label',path: 'Canvas/btn_jump_B/Label'},
    {name: 'm_tip',path: 'Canvas/m_tip'},
    {name: 'EditBox',path: 'Canvas/EditBox'},
    {name: 'Canvas',path: 'Canvas'},
    {name: 'btn_jump_A',path: 'Canvas/btn_jump_A'},
    {name: 'Label',path: 'Canvas/btn_jump_A/Label'},
    {name: 'btn_jump_B',path: 'Canvas/btn_jump_A'},
    {name: 'Label',path: 'Canvas/btn_jump_B/Label'},
    {name: 'm_tip',path: 'Canvas/m_tip'},
    {name: 'EditBox',path: 'Canvas/EditBox'},
    {name: 'Canvas',path: 'Canvas'},
    {name: 'btn_jump_A',path: 'Canvas/btn_jump_A'},
    {name: 'Label',path: 'Canvas/btn_jump_A/Label'},
    {name: 'btn_jump_B',path: 'Canvas/btn_jump_A'},
    {name: 'Label',path: 'Canvas/btn_jump_B/Label'},
    {name: 'm_tip',path: 'Canvas/m_tip'},
    {name: 'EditBox',path: 'Canvas/EditBox'},
    
];

// 定义树形结构的属性
const treeProps = {
    label: 'name',
    value: 'path',
    children: 'children',
};

// 控制弹窗显示与隐藏
const dialogVisible = ref(false);
const selfPopupRef = ref(null);

let _onSelect:(obj)=>void = null
// 打开弹窗
function openDialog(event,datas:Array<NodeTreeItem>,onSelect) {
    treeData = datas
    _onSelect = onSelect
    console.log('打开弹窗');
    dialogVisible.value = true;
    // const { clientX, clientY } = event;
    // menuPosition.x = clientX;
    // menuPosition.y = clientY;
    const totalWidth = 300
    const totalHeight = 300

    // 获取鼠标点击位置
    const { clientX, clientY } = event;
    const distanceToBottom = window.innerHeight - clientY;
    const distanceToRight = window.innerWidth - clientX;

    // 判断菜单是否接近屏幕底部
    if (distanceToBottom < totalHeight) {
        menuPosition.y = clientY - (totalHeight - distanceToBottom); 
    } else {
        menuPosition.y = clientY; 
    }
    if (distanceToRight < totalWidth) {
        menuPosition.x = clientX - (totalWidth - distanceToRight); 
    } else {
        menuPosition.x = clientX; 
    }
};

defineExpose({
    openDialog,
});

// 处理节点点击
const handleNodeClick = (node) => {
    if (node.path) {
        
        _onSelect(node)
        hideContextMenu()
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


const filterMethod = (query, data,node) => {
    if (!query) return true;
    
    if (!data || !data.path) return false;
    const bMatch = data.path.toLowerCase().includes(query.toLowerCase());
    console.log("筛选条件:", query,bMatch,typeof bMatch);
    return bMatch;
};

const onQueryChanged = (event) => {
    if (treeRef.value) {
        console.log("开始筛选，输入值:", event.target.value);
        treeRef.value.filter(event.target.value);
    }
};

</script>

<template>
    <div
        v-if="dialogVisible"
        class="context-menu"
        :style="{ top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }"
        ref="selfPopupRef"
    >
        <ui-input @change="onQueryChanged" placeholder="筛选" type="text"/>
        <el-tree-v2
            ref="treeRef"
            :data="treeData"
            :props="treeProps"
            :highlight-current="true"
            @node-click="handleNodeClick"
            :filter-method="filterMethod"
            :height="260"
        >
            <template #default="{ node }">
                
                <div style="margin-left: -16px;">
                    <span>{{ node.data.path }}</span>
                </div>
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
  