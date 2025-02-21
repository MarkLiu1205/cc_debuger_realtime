<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElButton, ElImage, ElMessage, ElInput } from "element-plus";
import { _funcs } from "../../tools/_funcs";

const isRuntimeOffline = ref(true);
const dynamicTextureEnabled = ref(false)
const atlasCount = ref(0);
const currentIndex = ref(0);
const imagePath = ref("");
const imageWidth = ref(0);
const imageHeight = ref(0);
const isLoading = ref(true);

async function checkOnlineInfo() {
    let bIsOnline = await Editor.Message.request(_funcs.getPluginName(), "doWaitForRuntimeIsInline");
    if(bIsOnline){
        await getDynamicAtlasEnable()
    }else {
        ElMessage.error("未检测到可用运行时");
    }
    isRuntimeOffline.value = !bIsOnline;
}

async function getDynamicAtlasEnable() {
    let bool = await Editor.Message.request(_funcs.getPluginName(),"callMainPanelFunc","_pluginSocket","requestDynamicAtlasEnable","")
    console.log("结果",bool)
    dynamicTextureEnabled.value = bool
    return bool
}

async function getDynamicAtlasCount() {
    if (isRuntimeOffline.value) return;
    isLoading.value = true;
    atlasCount.value = await Editor.Message.request(_funcs.getPluginName(), "callMainPanelFunc", "_pluginSocket", "getDynamicAtlasCount");
    isLoading.value = false;
}

async function getDynamicTextureAndSavePng(index: number) {
    if (isRuntimeOffline.value || atlasCount.value === 0) return;
    isLoading.value = true;
    const obj = await Editor.Message.request(_funcs.getPluginName(), "callMainPanelFunc", "_pluginSocket", "getDynamicTextureData", index);
    if (!obj) {
        ElMessage.error("获取图片失败");
        isLoading.value = false;
        return;
    }

    const unit8arr = _funcs.base64ToUint8Array(obj.base64Data);
    const floderPath = `${_funcs.getCurPluginPath()}/dynamic_texture`;
    await _funcs.ensureFloderExist(floderPath);
    const savePath = `${floderPath}/${index}_${Date.now()}.png`;
    _funcs.saveUnit8ArrayPng(unit8arr, obj.width, obj.height, savePath);

    imagePath.value = savePath.replace(/\\/g, "/");
    imageWidth.value = obj.width;
    imageHeight.value = obj.height;
    isLoading.value = false;
}

async function refresh() {
    await getDynamicAtlasEnable();
    await getDynamicAtlasCount();
    if (atlasCount.value > 0) {
        currentIndex.value = 0;
        await getDynamicTextureAndSavePng(0);
    } else {
        imagePath.value = "";
    }
}

async function prevImage() {
    if (currentIndex.value > 0) {
        currentIndex.value--;
        await getDynamicTextureAndSavePng(currentIndex.value);
    }
}

async function nextImage() {
    if (currentIndex.value < atlasCount.value - 1) {
        currentIndex.value++;
        await getDynamicTextureAndSavePng(currentIndex.value);
    }
}

onMounted(async () => {
    await checkOnlineInfo();
    await refresh();
});
</script>

<template>
    <div class="container">
        <div v-if="isRuntimeOffline">
            <h2>没有检测到可用运行时</h2>
        </div>
        <div v-else-if="!dynamicTextureEnabled">
            <div v-if="atlasCount === 0" class="button-group">
                <h2>未开启动态图集</h2>
                <ElButton @click="refresh">刷新</ElButton>
            </div>
        </div>
        <div v-else>
            <div v-if="isLoading" class="loading-container">
                <ui-loading></ui-loading>
            </div>
            <div v-else>
                <div v-if="atlasCount === 0" class="button-group">
                    <h2>没有可用的图片</h2>
                    <ElButton @click="refresh">刷新</ElButton>
                </div>
                <div v-else>
                    <div class="image-container">
                        <ElImage :src="imagePath" class="image-preview" fit="contain" />
                    </div>
                    
                    <ElInput v-model="imagePath" class="image-path" readonly :select-on-focus="true" />
                    
                    <div class="button-group">
                        <ElButton @click="refresh">刷新</ElButton>
                        <ElButton @click="prevImage" :disabled="currentIndex === 0">上一张</ElButton>
                        <p class="image-info">当前：{{ currentIndex + 1 }} / {{ atlasCount }}</p>
                        <ElButton @click="nextImage" :disabled="currentIndex >= atlasCount - 1">下一张</ElButton>
                        <p class="image-info">尺寸：{{ imageWidth }} x {{ imageHeight }}</p>
                    </div>
                </div>
            </div>
            
            
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

.title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
    text-align: center;
}

.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px;
}

.image-container {
    text-align: center;
    padding: 10px;
}

.image-preview {
    width: 512px;
    height: 512px;
    border: 1px solid #ccc;
    padding: 5px;
}

.image-path {
    width: 90%;
    margin: 10px auto;
    text-align: center;
    background-color: #444;
    color: #fff;
    border: none;
}

.image-info {
    font-size: 14px;
    color: #ddd;
    margin: 5px 0;
}

.button-group {
    display: flex;
    justify-content: center;
    gap: 15px;
}
</style>
