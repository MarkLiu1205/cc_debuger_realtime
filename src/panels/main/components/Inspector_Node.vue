<script setup lang=ts>
import { ref, reactive, onUnmounted, watch, nextTick, defineExpose,defineProps, onMounted } from 'vue';
import view_Node from '../inspector/view_Node.vue'


const model = defineModel<NodeInfo>()

onMounted(()=>{
    
})

</script>

<template>
    <label v-if="model==null">XXXX: {{ "没有" }}</label>
    <div class="inspector_container" v-if="model!=null">
        
        <view_Node v-model="model" />
    </div>
</template>

<style scoped>

.inspector_container {
    height: 100%;
    overflow-y: auto;
    border: 1px solid #ccc;
}

</style>