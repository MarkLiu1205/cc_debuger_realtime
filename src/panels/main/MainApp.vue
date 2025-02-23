<script setup lang="ts">
import TestFlow from './components/TestFlow.vue';
import Inspector_Node from './components/Inspector_Node.vue';
import dlg_list_selecter from './components/dlg_list_selecter.vue';
import comp_node_selecter from './components/comp_node_selecter.vue';
import { computed, createVNode, h, inject, nextTick, onMounted, onUnmounted, provide, reactive, ref, render, watch } from 'vue';
import { ElButton, ElDialog, ElMessage } from 'element-plus';
import { _funcs } from '../../tools/_funcs';
import { _dataCtx } from '../../tools/_dataCtx';
import { _pluginSocket } from '../../tools/plugin_socket';
import comp_left_tree_panel from './components/comp_left_tree_panel.vue';
import { eventBus } from '../../tools/_enentBus';
import comp_profiler from './components/comp_profiler.vue';
import comp_md_info from './components/comp_md_info.vue';
import comp_deviceInfo from './components/comp_deviceInfo.vue';
import view_asset_info from './components/view_asset_info.vue';

const showToast = inject<ToastParam>("message")

/**客户端是否在线 */
const isRuntimeOffline = ref(true)
/**本地预览的地址 */
const runtimePreviewUrl = ref("http://localhost:7456")
/**当前已加载的bundle列表 */
const bundleNames = ref([])

const _curSelNodeInfo = ref<InspectorInfo_Node>()
const _curSelResItem = ref<ResTreeItem>()

_pluginSocket.listenRuntimeOnlineInfo((info)=>{
    // _funcs.log_1("runtime在线吗?",info)
    isRuntimeOffline.value = !info.bIsOnline
    if(!info.bIsOnline){
        _curSelNodeInfo.value = null
        _curSelResItem.value = null
        _pluginSocket.clear()
        _dataCtx.clear()
    }
    Editor.Message.request(_funcs.getPluginName(),"onRuntimeOnlineState",info.bIsOnline)
})

_pluginSocket.listenRuntimeList((nameArr)=>{
    _funcs.log_1("runtime 列表：",JSON.stringify(nameArr))
})


_pluginSocket.listenSceneLaunched((name)=>{
    _funcs.log_1("场景切换",name)
    _curSelNodeInfo.value = null
    _curSelResItem.value = null
})

const width_left_panel = ref(window.innerWidth * 0.5); 
const width_right_panel = ref(window.innerWidth * 0.5); 
const resizer_ele_1 = ref(null); //拉伸左右边界的线

const onMouseDown = (e:MouseEvent) => {
    const minWidth = 300
    
    const startX = e.clientX
    const startWidth = width_left_panel.value

    const onMouseMove = (moveEvent) => {
        const newWidth = startWidth + (moveEvent.clientX - startX)
        // 限制最小和最大宽度
        
        width_left_panel.value = _funcs.clamp(minWidth,window.innerWidth - 360,newWidth)
        width_right_panel.value = window.innerWidth - width_left_panel.value
    }

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
}

onMounted(() => {
    _pluginSocket.waitForRuntimeIsInline().then(()=>{
        _funcs.waitForElementMounted(resizer_ele_1).then(()=>{
            resizer_ele_1.value.addEventListener('mousedown', onMouseDown);
        })
    })

    _funcs.getRuntimePreviewUrl().then((url)=>{
        console.log("预览地址",url)
        runtimePreviewUrl.value = url
    })
    
})

onUnmounted(() => {
    if (resizer_ele_1.value) {
        resizer_ele_1.value.removeEventListener('mousedown', onMouseDown)
    }
})  

function onPanelResize(){
    width_left_panel.value = window.innerWidth * 0.5
    width_right_panel.value = window.innerWidth * 0.5
}

onMounted(() => {
    window.addEventListener("resize", onPanelResize);
});

onUnmounted(() => {
    window.removeEventListener("resize", onPanelResize);
});

async function onSel_node(info:InspectorInfo_Node){
    console.log('选中节点:', info);
    _curSelNodeInfo.value = info
    _curSelResItem.value = null
}

function onSel_asset(item:ResTreeItem) {
    // if(item&&!item.isDirectory){
    //     console.log('选中资源:', item);
    // }
    _curSelResItem.value = item
    _curSelNodeInfo.value = null
}

function doOpenRuntimePreview() {
    _funcs.openWebSiteUrl(runtimePreviewUrl.value)
}

async function test_1() {
    let isLoggedIn = await Editor.User.isLoggedIn()
    console.log("是否登录",isLoggedIn)
    let data:Editor.User.UserData = await Editor.User.getData()
    console.log("用户数据",data)

    const lists = await _pluginSocket.getWitablePathFilesInfo()
    console.log("可写目录",JSON.stringify(lists,null,2))
}

async function openEvalPanel(event: MouseEvent){
    const panelId = _funcs.getPluginName()+".eval_panel"
    
    if(await Editor.Panel.has(panelId)){
        Editor.Panel.focus(panelId);
    }else{
        await Editor.Panel.open(panelId);
    }
}

async function openDynamicPanel(){
    const panelId = _funcs.getPluginName()+".dynamicTexture_panel"
    
    if(await Editor.Panel.has(panelId)){
        Editor.Panel.focus(panelId);
    }else{
        await Editor.Panel.open(panelId);
    }
}

async function openLogPanel(){
    const panelId = _funcs.getPluginName()+".log_panel"
    
    if(await Editor.Panel.has(panelId)){
        Editor.Panel.focus(panelId);
    }else{
        await Editor.Panel.open(panelId);
    }
}

async function openLocalCachePanel(){
    const gameEnvObj = await _pluginSocket.getGameEnv()
    if(!gameEnvObj.isNative){
        showToast("非原生环境不支持此功能")
        return
    }
    const panelId = _funcs.getPluginName()+".localCache_panel"
    
    if(await Editor.Panel.has(panelId)){
        Editor.Panel.focus(panelId);
    }else{
        await Editor.Panel.open(panelId);
    }
}

</script>

<template>
    <!-- <div style="width: 600px;height: 600px;">
        <TestFlow/>
    </div> -->
    <div style="width: 100vw; height: 100vh; ">  
        <div style=" width: calc(100% - 10px);height: calc(100% - 35px);">
            <div class="center-align" style="flex-direction: column;" v-if="isRuntimeOffline">
                <h2>没有检测到可用运行时</h2>
                <p>推荐打开预览：{{runtimePreviewUrl}}</p>
                <ui-button type="default"  @confirm="doOpenRuntimePreview">点击打开预览 {{runtimePreviewUrl}}</ui-button>
            </div>
            <div id="eid_view_main" class="cls_view_main" v-else>
                <div id="eid_view_asset_list" class="left-panel" :style="{ width: width_left_panel + 'px' }">
                    <comp_left_tree_panel 
                        @onSel_asset="onSel_asset"
                        @onSel_node="onSel_node"
                    />
                </div>
                <div class="resizer-line-1" ref="resizer_ele_1"></div>
                
                <div class="right-panel" :style="{ width: width_right_panel + 'px' }">
                    
                    <Inspector_Node v-if="_curSelNodeInfo!=null" v-model="_curSelNodeInfo"/>
                    <view_asset_info v-else-if="_curSelResItem!=null" v-model="_curSelResItem"/>
                    <div v-else style="display: flex;flex-direction: column; gap: 10px;margin: 10px;">
                        <div class="button-grid" >
                            <el-button  @click="openEvalPanel">执行JS</el-button>
                            <el-button  @click="openDynamicPanel">动态图集</el-button>
                            <el-button  @click="openLogPanel">日志</el-button>
                            <el-button  @click="openLocalCachePanel">可写目录</el-button>
                            <!-- <el-button  @click="test_1">测试</el-button> -->
                        </div>
                        <comp_deviceInfo/>
                        <comp_profiler/>
                        <comp_md_info/>
                    </div>
                </div>
            </div>
        </div>
        
    </div>
</template>

<style scoped>
.cls_view_main {
    display: flex;
    flex-direction: row;
    height: 100%;
    
}

.left-panel {
    display: flex;
    flex-direction: column; 
    border-top: 1px solid #ccc;
    border-bottom: 1px solid #ccc;
    border-left: 1px solid #ccc;
  
}

.resizer-line-1 {
    width: 2px; /* 分隔条宽度 */
    cursor: col-resize; /* 改变鼠标光标样式 */
    user-select: none; /* 禁止用户选择文本 */
    background-color: #ccc; /* 分隔条背景色 */
}
  
.right-panel {
    flex-grow: 1; /* 使右面板占据剩余空间 */
    display: flex; 
    flex-direction: column;
    border-left: 1px solid #ccc; /* 添加左边框以分隔面板 */
    box-sizing: border-box; /* 包含内边距和边框在宽度内 */
    min-width: 360px;
}

.button-grid {
    display: flex;
    gap: 10px;
    align-items: center;
    border: 1px solid #ccc;
    padding: 10px;
}

.center-align {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

</style>
