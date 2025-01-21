<script setup lang=ts>
import { ref, reactive, onUnmounted, watch, nextTick, defineExpose,defineProps, onMounted } from 'vue';
import view_Node from '../inspector/view_Node.vue'

const props = defineProps({
    info: {
        type: Object,
        default:null
    },
})

const node_info = ref(null as NodeInfo)

onMounted(()=>{
    node_info.value = props.info as NodeInfo
})

</script>

<template>
    <div class="inspector_container">
        <view_Node :nodeData="props.info" v-if="info!=null" />
    </div>
</template>

<style scoped>

.inspector_container {
    height: 100%;
    overflow-y: auto;
    border: 1px solid #ccc;
}

</style>