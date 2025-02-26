<script setup lang="ts">
import { ref, onMounted, computed, inject } from "vue";
import { ElButton, ElImage, ElMessage, ElInput } from "element-plus";
import { _utils } from "../../tools/_utils";
import { _funcs } from "../../tools/_funcs";
const fs = require('fs-extra');
import { _pluginSocket } from "../../tools/plugin_socket";
const path =  require('path');

const showToast = inject<ToastParam>("message")

const isRuntimeOffline = ref(true);
const gameEnvObj = ref<GameEnvParam>(null)
const treeHeight = ref(300);
const treeData = ref<Array<WritableFileInfo>>([]);
const curSelItem = ref<WritableFileInfo>(null);
const bIsSyncing = ref(false);

const syncFloderPath = `${_funcs.getCurPluginPath()}/cache/writablePathSync`;

async function checkOnlineInfo(bool?:boolean) {
    let bIsOnline = bool ?? await Editor.Message.request(_funcs.getPluginName(), "callMainPanelFunc", "_pluginSocket", "waitForRuntimeIsInline");
    if(bIsOnline){
        let obj = await Editor.Message.request(_funcs.getPluginName(),"callMainPanelFunc","_pluginSocket","getGameEnv")
        gameEnvObj.value = obj
    }
    isRuntimeOffline.value = !bIsOnline;
}
defineExpose({
    checkOnlineInfo,
});
onMounted(async () => {
    await checkOnlineInfo();
    
    const lists = await Editor.Message.request(_funcs.getPluginName(),"callMainPanelFunc","_pluginSocket","getWitablePathFilesInfo")
    treeData.value = lists

    treeHeight.value = window.innerHeight - 200
});


const customClass = (nodeData): string => {
  return nodeData.path === curSelItem.value?.path ? 'custom-current' : ''
}

function onClickItem (data:WritableFileInfo, node, e: MouseEvent){
    curSelItem.value = data
    if(data.isFloder){
        console.log("点击文件夹",data.path)
    }else{
        console.log("点击文件",data.path)
    }
}

async function syncSelectFile(){
    bIsSyncing.value = true
    // console.log("同步选中文件到本地",curSelItem.value.path)
    if(curSelItem.value.isFloder){
        showToast("不能同步文件夹")
        bIsSyncing.value = false
        return
    }
    
    const u8a = await getWritableFileData(curSelItem.value.path)
    if(u8a==null){
        showToast("获取文件数据失败")
        bIsSyncing.value = false
        return
    }
    const savePath = `${syncFloderPath}/${curSelItem.value.path}`
    await _funcs.ensureFloderExist(path.dirname(savePath))
    try{
        fs.writeFileSync(savePath,u8a)
        // console.log("保存文件",savePath,result,u8a.length)
        showToast("保存文件成功")
    }catch(e){
        // console.error("保存文件失败",e)
        showToast("保存文件失败")
    }
    bIsSyncing.value = false
}

async function getWritableFileData(filePath:string){
    filePath = gameEnvObj.value.writablePath+"/"+filePath
    const base64Str = await Editor.Message.request(_funcs.getPluginName(),"callMainPanelFunc","_pluginSocket","getWritableFileData",filePath)
    if(base64Str==null){
        return null
    }
    const u8a = _utils.base64ToUint8Array(base64Str)
    return u8a
}

</script>

<template>
    <div class="container">
        <div v-if="isRuntimeOffline">
            <h2>没有检测到可用运行时</h2>
        </div>
        <div v-else class="column">
            <div class="row">
                <label class="text">运行时可写路径: {{ gameEnvObj.writablePath }}</label>
            </div>
            <div class="row">
                <label class="text">本地同步路径: {{ syncFloderPath }}</label>
            </div>
            <div style="height: 40px;justify-content: center;align-items: center;" >
                <el-button type="success" @click="syncSelectFile" :disabled="(!curSelItem||curSelItem.isFloder)||bIsSyncing">同步选中文件到本地</el-button>
            </div>
            <div class="tree-container">
                <el-tree-v2 
                    :data="treeData" 
                    :props="{ label: 'name', value: 'path', children: 'children' ,class: customClass}" 
                    :height="treeHeight"
                    :highlight-current="true"
                    @node-click="onClickItem"
                />
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
    
    color: white;
    font-size: 14px;

    padding: 20px;
}

.row{
    display: flex;
    flex-direction: row;
    gap: 10px;
}

.column{
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.text{
    user-select: text;
}

.tree-container {
    width: calc(100% - 40px);
    height: 100%;
    overflow: auto;
    border: 1px solid #ddd;
}

:deep(.el-tree-node__content) {
    cursor: default !important;
}

/* 自定义高亮背景和文字颜色 */
:deep(.custom-current) > .el-tree-node__content {
    background-color: #227F9B !important; /* 金黄色背景 */
    color: #ffffff !important; /* 白色文字 */
}

/* 修改 hover 状态下的背景色 */
:deep(.el-tree-node__content:hover) {
    background-color: #525252 !important; /* 橙色背景 */
    color: #ffffff !important; /* 白色文字 */
}

/* 当前节点 hover 状态下应用高亮 */
:deep(.custom-current:hover) > .el-tree-node__content {
    background-color: #227F9B !important; /* 高亮背景色 */
    color: #ffffff !important; /* 文字颜色 */
}

</style>
