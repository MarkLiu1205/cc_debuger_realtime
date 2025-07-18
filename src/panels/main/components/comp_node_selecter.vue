<script setup lang="ts">
import { ref, computed, inject, Ref, watch, defineModel } from 'vue';
import dlg_list_selecter from './dlg_list_selecter.vue';
import { eventBus } from '../../../tools/_enentBus';
import { _dataCtx } from '../../../tools/_dataCtx';

const props = defineProps<{
    disabled?:boolean
}>()

// 使用 defineModel 绑定 v-model 的属性
const elementUuid = defineModel<string>();
const emit = defineEmits(['change']);

const curSelectUuid = computed({
    get: () => {
        // console.log("获取 curSelectUuid:", elementUuid.value);
        return elementUuid.value;
    },
    set: (val) => {
        // console.log("设置 curSelectUuid:", val);
        elementUuid.value = val;
        emit('change', val);
    }
});

const curSelectName = computed(() => {
    for(let obj of nodeLists.value){
        if(obj.uuid == curSelectUuid.value){
            return obj.name;
        }
    }
    return "";
});

const nodeLists = computed(() => {
    const arr = flattenTree(_dataCtx.curNodeTreeInfo);
    return arr;
});

function flattenTree(items: Array<NodeTreeItem>) {
    const result = [];

    function traverse(node: NodeTreeItem) {
        if (!node.isSceneNode) {
            result.push({
                name: node.name,
                path: node.path,
                uuid: node.uuid,
            });
        }
        if (node._children) {
            node._children.forEach(child => traverse(child));
        }
    }

    for(let item of items){
        traverse(item);
    }
    return result;
}

const isHover = ref(false);

const clearSelection = () => {
    // console.log("清除选择");
    curSelectUuid.value = ""; // 通过 v-model 自动更新
};

const dlg_list_selecterRef = ref(null);

async function openSelecterDlg(event: MouseEvent) {
    if (dlg_list_selecterRef.value != null) {
        dlg_list_selecterRef.value.openDialog(event, nodeLists.value, (obj) => {
            // console.log("选中的节点", obj);
            curSelectUuid.value = obj.uuid; // 自动更新
        });
    }
}

function handleClick() {
    if(!curSelectUuid.value){
        return
    }
    eventBus.emit("click-node-in-inspector", curSelectUuid.value);
}

</script>

<template>
    <div 
        class="node-selector" 
        @mouseover="isHover = true" 
        @mouseleave="isHover = false"
    >
        <div class="header">cc.Node</div>

        <div class="content">
            <div class="name-box" :class="{empty: !curSelectUuid}">
                <span class="name" :class="{empty:true}" v-if="!curSelectUuid">cc.Node</span>
                <span class="name" v-else @click="handleClick" >@{{ curSelectName }}</span>
                <ui-icon 
                    v-if="isHover && curSelectUuid && !disabled" 
                    class="delete-btn" 
                    value="close" 
                    @click="clearSelection"
                ></ui-icon>
            </div>
            <ui-icon v-if="!disabled"
                class="select-btn" 
                value="select" 
                @click="openSelecterDlg"
            ></ui-icon>
        </div>
        <dlg_list_selecter ref="dlg_list_selecterRef"/>
    </div>
</template>

<style scoped>
.node-selector {
    display: flex;
    flex-direction: column;
    background: #222;
    border: 1px solid #333;
    transition: border-color 0.2s;
}

.node-selector:hover {
    border-color: #60c3ff;
}

.header {
    background: #111;
    color: #ffffff;
    font-size: 10px;
    padding: 0px 4px;
    display: inline-flex;
}

.content {
    display: flex;
    align-items: center;
    background: #1e1e1e;
}

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

.name {
    flex: 1;
    font-size: 12px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    cursor: pointer;
}

.name.empty {
    color: #404040;
    cursor: default;
}

.delete-btn {
    color: red;
    cursor: pointer;
    margin-left: auto;
}

.select-btn {
    margin-left: 6px;
    cursor: pointer;
}
</style>
