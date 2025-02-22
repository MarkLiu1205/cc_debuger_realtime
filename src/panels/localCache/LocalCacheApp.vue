<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElButton, ElImage, ElMessage, ElInput } from "element-plus";
import { _funcs } from "../../tools/_funcs";

const isRuntimeOffline = ref(true);

async function checkOnlineInfo() {
    let bIsOnline = await Editor.Message.request(_funcs.getPluginName(), "doWaitForRuntimeIsInline");
    if(bIsOnline){
        
    }else {
        ElMessage.error("未检测到可用运行时");
    }
    isRuntimeOffline.value = !bIsOnline;
}
onMounted(async () => {
    await checkOnlineInfo();
});
</script>

<template>
    <div class="container">
        <div v-if="isRuntimeOffline">
            <h2>没有检测到可用运行时</h2>
        </div>
        
    </div>
</template>

<style scoped>
.container {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #222;
    color: white;
}

</style>
