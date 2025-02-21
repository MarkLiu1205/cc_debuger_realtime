<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from "vue";
import { ElInput, ElButton, ElCheckbox, ElScrollbar, ElTable, ElTableColumn } from "element-plus";
import { _funcs } from "../../tools/_funcs";

const gameEnvObj = ref<GameEnvParam>(null)

/**客户端是否在线 */
const isRuntimeOffline = ref(true)

async function checkOnlineInfo(bool?:boolean){
    let bIsOnline = bool ?? await Editor.Message.request(_funcs.getPluginName(),"doWaitForRuntimeIsInline")
    isRuntimeOffline.value = !bIsOnline

    if(bIsOnline){
        let obj = await Editor.Message.request(_funcs.getPluginName(),"callMainPanelFunc","_pluginSocket","getGameEnv")
        gameEnvObj.value = obj
    }
}

async function getDynamicAtlasCount() {
    if(isRuntimeOffline.value){
        let number = await Editor.Message.request(_funcs.getPluginName(),"callMainPanelFunc","_pluginSocket","getDynamicAtlasCount")
        console.log("number",number)
        return number
    }
}

async function getDynamicTextureAndSavePng(index:number) {
    if(isRuntimeOffline.value){
        let obj = await Editor.Message.request(_funcs.getPluginName(),"callMainPanelFunc","_pluginSocket","getDynamicTextureData",index)
        console.log("智星完毕",obj?.width)

        const unit8arr = _funcs.base64ToUint8Array(obj.base64Data)
    
        const savePath = _funcs.getCurPluginPath()+`/dynamic_texture_${index}.png`
        _funcs.saveUnit8ArrayPng(unit8arr,obj.width,obj.height,savePath)
    }
}

onMounted(async ()=>{
    checkOnlineInfo()
    
    updateLogHeight()

    // getDynamicAtlasCount()
    // getDynamicTextureAndSavePng(0)

})

// 计算日志区域的高度
function updateLogHeight() {
    
}

// 监听窗口大小变化
onMounted(() => {
    updateLogHeight();
    window.addEventListener("resize", updateLogHeight);
});

onUnmounted(() => {
    window.removeEventListener("resize", updateLogHeight);
});

</script>

<template>
    <div style="width: 100vw; height: 100vh;" ref="ref_container">
        <div class="center-align" style="flex-direction: column;" v-if="isRuntimeOffline">
            <h2>没有检测到可用运行时</h2>
        </div>
        
    </div>
</template>

<style scoped>

</style>
