
<script lang="ts" setup>
import { computed, inject, onMounted, ref } from 'vue';
import { _funcs } from '../../../tools/_funcs';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { ElButton, ElImage, ElMessage, ElInput } from "element-plus";

const showToast = inject<ToastParam>("message")

const _isLoading = ref(false)

async function test_1() {
    // let isLoggedIn = await Editor.User.isLoggedIn()
    // console.log("是否登录",isLoggedIn)
    let data:Editor.User.UserData = await Editor.User.getData()
    console.log("用户数据",data)

    // const lists = await _pluginSocket.getWitablePathFilesInfo()
    // console.log("可写目录",JSON.stringify(lists,null,2))
    const localIp = _funcs.getLocalIpv4IP()
    console.log("localIp",localIp)

    _pluginSocket.testPako()
}

async function openEvalPanel(event: MouseEvent){
    _isLoading.value = true
    await _funcs.openEvalPanel()
    _isLoading.value = false
}

async function openDynamicPanel(){
    _isLoading.value = true
    const panelId = _funcs.getPluginName()+".dynamicTexture_panel"
    
    if(await Editor.Panel.has(panelId)){
        Editor.Panel.focus(panelId);
    }else{
        await Editor.Panel.open(panelId);
    }
    _isLoading.value = false
}

async function openLogPanel(){
    _isLoading.value = true
    const panelId = _funcs.getPluginName()+".log_panel"
    
    if(await Editor.Panel.has(panelId)){
        Editor.Panel.focus(panelId);
    }else{
        await Editor.Panel.open(panelId);
    }
    _isLoading.value = false
}

async function openLocalCachePanel(){
    const gameEnvObj = await _pluginSocket.getGameEnv()
    if(!gameEnvObj.isNative){
        showToast(_funcs.getI18nText("text_12"))
        return
    }
    _isLoading.value = true
    const panelId = _funcs.getPluginName()+".localCache_panel"
    
    if(await Editor.Panel.has(panelId)){
        Editor.Panel.focus(panelId);
    }else{
        await Editor.Panel.open(panelId);
    }
    _isLoading.value = false
}

</script>

<template>
    <div v-if="_isLoading" class="loading-box">
        <h3>{{ "正在加载请稍后..." }}</h3>
        <ui-loading></ui-loading>
    </div>
    <div class="button-grid" v-else>
        <el-button  @click="openEvalPanel">{{ _funcs.getI18nText("text_8") }}</el-button>
        <el-button  @click="openDynamicPanel">{{ _funcs.getI18nText("text_9") }}</el-button>
        <el-button  @click="openLogPanel">{{ _funcs.getI18nText("text_10") }}</el-button>
        <el-button  @click="openLocalCachePanel">{{ _funcs.getI18nText("text_11") }}</el-button>
        <!-- <el-button  @click="test_1">测试</el-button> -->
    </div>
</template>

<style scoped>

.button-grid {
    display: flex;
    gap: 10px;
    align-items: center;
    border: 1px solid #ccc;
    padding: 10px;
}

.loading-box {
    display: flex; 
    gap: 10px;
    min-height:32px; 
    align-items: center;
    text-align: center;
    justify-content: center;
    border: 1px solid #ccc;
    padding: 10px;
}

</style>
