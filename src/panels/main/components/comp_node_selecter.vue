<script setup lang="ts">
import { ref, defineProps, defineEmits, computed, inject, Ref, watch } from 'vue';
import dlg_list_selecter from './dlg_list_selecter.vue';

// 使用 v-model:uuid 绑定
const props = defineProps({
    modelValue: {
        type: String,
        default: ""
    }
});

const emit = defineEmits(["update:modelValue"]);

const nodeTreeDatas = inject('nodeTreeDatas') as Ref<Array<NodeTreeItem>>;

const nodeLists = computed(() => {
    const arr = flattenTree(nodeTreeDatas.value);
    return arr;
});

// 计算属性：当前选中 UUID
const curSelectUuid = computed({
    get: () => {
        // console.log("获取 curSelectUuid:", props.modelValue);
        return props.modelValue;
    },
    set: (val) => {
        // console.log("设置 curSelectUuid:", val);
        emit("update:modelValue", val);
    }
});

// 根据 UUID 获取名称
const curSelectName = computed(() => {
    const item = nodeLists.value.find(obj => obj.uuid === curSelectUuid.value);
    return item ? item.name : "";
});

// 递归展开树形结构
function flattenTree(arr: Array<NodeTreeItem>) {
    const result = [];

    function traverse(node: NodeTreeItem) {
        if (!node.isSceneNode) {
            result.push({
                name: node.name,
                path: node.path,
                uuid: node.uuid,
            });
        }
        if (node.children) {
            node.children.forEach(child => traverse(child));
        }
    }

    arr.forEach(node => traverse(node));
    return result;
}

const isHover = ref(false);

// 清除选择
const clearSelection = () => {
    // console.log("清除选择");
    curSelectUuid.value = "";  // 触发自动更新
};

// 打开选择对话框
const dlg_list_selecterRef = ref(null);
async function openSelecterDlg(event: MouseEvent) {
    if (dlg_list_selecterRef.value != null) {
        dlg_list_selecterRef.value.openDialog(event, nodeLists.value, (obj) => {
            // console.log("选中的节点", obj);
            curSelectUuid.value = obj.uuid;  // 触发自动更新
        });
    }
}
</script>

<template>
    <div class="node-selector" @mouseover="isHover = true" @mouseleave="isHover = false">
        <!-- 左上角标签 -->
        <div class="header">cc.Node</div>

        <!-- 主要内容 -->
        <div class="content">
            <div class="name-box" :class="{ empty: !curSelectUuid }">
                <span class="name empty" v-if="!curSelectUuid">cc.Node</span>
                <span class="name" v-else>@{{ curSelectName }}</span>

                <ui-icon 
                    v-if="isHover && curSelectUuid" 
                    class="delete-btn" 
                    value="close" 
                    @click="clearSelection"
                ></ui-icon>
            </div>

            <!-- 选择按钮 -->
            <ui-icon class="select-btn" value="select" @click="openSelecterDlg"></ui-icon>
        </div>

        <!-- 选择对话框 -->
        <dlg_list_selecter ref="dlg_list_selecterRef"/>
    </div>
</template>

<style scoped>
/* 外层容器 */
.node-selector {
    display: flex;
    flex-direction: column;
    background: #222;
    border: 1px solid #333;
    transition: border-color 0.2s;
}

/* hover 时高亮边框 */
.node-selector:hover {
    border-color: #60c3ff;
}

/* 左上角标签 */
.header {
    background: #111;
    color: #ffffff;
    font-size: 10px;
    padding: 0px 4px;
    display: inline-flex;
}

/* 主要内容 */
.content {
    display: flex;
    align-items: center;
    background: #1e1e1e;
}

/* 选中项（蓝色区域） */
.name-box {
    flex: 1;
    display: flex;
    align-items: center;
    background: #206080;
    padding-left: 4px;
    position: relative;
}

.name-box.empty {
    background: #141414;
}

/* 选中项名称 */
.name {
    flex: 1;
    font-size: 14px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.name.empty {
    color: #404040;
}

/* 删除按钮 */
.delete-btn {
    color: red;
    cursor: pointer;
    margin-left: auto;
}

/* 选择按钮 */
.select-btn {
    margin-left: 6px;
    cursor: pointer;
}
</style>
