<script setup lang=ts>
import { ref, reactive, onUnmounted, watch, nextTick, defineExpose,defineProps, onMounted, computed } from 'vue';
import view_Node from '../inspector/view_Node.vue'
import CompWrapper from './CompWrapper.vue'


const nodeInfo = defineModel<InspectorInfo_Node>()

function updateInfo(index, newInfo) {
    // nodeInfo.value.components[index] = newInfo;
    // console.log("sssss",index)
    // console.log("旧的",JSON.stringify(nodeInfo.value.components[index]))
    // console.log("新的",JSON.stringify(newInfo))
}

</script>

<template>
    <div v-if="nodeInfo?.isLoading" style="display: flex;flex-direction: column;align-items: center;justify-content: center; height: 100%; overflow-y: auto;">
        <div style="display: flex; flex-direction: row; margin-bottom: 5px;align-items: center;justify-content: center;">
            <h3>{{ "正在请求节点数据" }}</h3>
            <ui-loading style="margin-left: 10px;"></ui-loading>
        </div>
    </div>
    <div class="inspector_container" v-else>
        
        <view_Node v-model="nodeInfo" />
        <CompWrapper v-for="(info, index) in nodeInfo.components"
            :key="index"
            :compInfo="info"
            @update:info="updateInfo(index, $event)"
        />
    </div>
</template>

<style scoped>

.inspector_container {
    height: 100%;
    overflow-y: auto;
    border-top: 1px solid #ccc;
    border-bottom: 1px solid #ccc;
    border-right: 1px solid #ccc;
    
    padding: 5px;
    user-select: text;
}

</style>