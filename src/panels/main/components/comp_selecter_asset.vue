<script setup lang="ts">
import { ref, computed, inject, Ref, watch, defineModel, onMounted } from 'vue';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { _dataCtx } from '../../../tools/_dataCtx';
import { eventBus } from '../../../tools/_enentBus';

const props = defineProps<{assetType:AssetType}>()

// 使用 defineModel 绑定 v-model 的属性
const elementUuid = defineModel<string>();
const emit = defineEmits(['change']);

/**当前选中的组件的uuid */
const curSelectUuid = computed({
    get: () => {
        return elementUuid.value;
    },
    set: (val) => {
        elementUuid.value = val;
        emit('change', val);
    }
});

function handleClick() {
    if(!curSelectUuid.value){
        return
    }
    // console.log("点击率资源",curSelectUuid.value)
    eventBus.emit("click-asset-in-inspector", curSelectUuid.value);
}

function onChange(event){
    const assetUuid = event.target.value;
    curSelectUuid.value = assetUuid
}

const isReadonly = computed(()=>{
    return props.assetType=="cc.Script"
})

</script>

<template>
    <ui-asset :droppable="props.assetType" :readonly="isReadonly" @click="handleClick" @change="onChange" :value="curSelectUuid"></ui-asset>
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
