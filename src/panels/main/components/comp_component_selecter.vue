<script setup lang="ts">
import { ref, computed, inject, Ref, watch, defineModel, onMounted } from 'vue';
import dlg_list_selecter from './dlg_list_selecter.vue';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { _dataCtx } from '../../../tools/_dataCtx';
import { eventBus } from '../../../tools/_enentBus';

const props = defineProps<{compType:CompType}>()

// 使用 defineModel 绑定 v-model 的属性
const elementUuid = defineModel<string>();
const emit = defineEmits(['change']);

/**当前选中的组件的uuid */
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

async function _updateCurSelectName(){
    if(!curSelectUuid.value){
        return
    }
    
    const nodeObj = await _pluginSocket.getNodeOfComp(curSelectUuid.value)
    // console.log("获取节点名", curSelectUuid.value,nodeObj?.name??"没有");
    curSelectName.value = nodeObj?.name??""
}

const curSelectName = ref("");
watch(curSelectUuid, _updateCurSelectName);

onMounted(_updateCurSelectName);

const isHover = ref(false);

const clearSelection = () => {
    // console.log("清除选择");
    curSelectUuid.value = ""; // 通过 v-model 自动更新
};

const dlg_list_selecterRef = ref(null);

async function openSelecterDlg(event: MouseEvent) {
    if (dlg_list_selecterRef.value != null) {
        // console.log("获取组件列表", props.compType);
        const arr = await _pluginSocket.fiterCompsWithType(props.compType);
        // console.log("组件列表", arr);
        const nodeArr = arr.map((item) => {
            const node = _dataCtx.getTreeNodeInfoWithUuid(item.nodeUuid);
            return {
                name: node.name,
                path: node.path,
                uuid: node.uuid,
                compUuid: item.uuid,
            }
        });
        dlg_list_selecterRef.value.openDialog(event, nodeArr, (obj) => {
            // console.log("选中的节点", obj);
            curSelectUuid.value = obj.compUuid; // 自动更新
        });
    }
}

function handleClick() {
    if(!curSelectUuid.value){
        return
    }
    eventBus.emit("click-component-in-inspector", curSelectUuid.value);
}

</script>

<template>
    <div 
        class="node-selector" 
        @mouseover="isHover = true" 
        @mouseleave="isHover = false"
    >
        <div class="header">cc.{{ props.compType }}</div>

        <div class="content">
            <div class="name-box" :class="{empty: !curSelectUuid}">
                <span class="name" :class="{empty:true}" v-if="!curSelectUuid">cc.{{ props.compType }}</span>
                <span class="name" @click="handleClick" v-else>@{{ curSelectName }}</span>
                <ui-icon 
                    v-if="isHover && curSelectUuid" 
                    class="delete-btn" 
                    value="close" 
                    @click="clearSelection"
                ></ui-icon>
            </div>
            <ui-icon 
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
