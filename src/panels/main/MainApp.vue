<script setup lang="ts">
import TestFlow from './components/TestFlow.vue';
import Inspector_Node from './components/Inspector_Node.vue';

import comp_verify_code from './components/comp_verify_code.vue';
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
    // console.log("1在线刷新----",info)
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
    // console.log('选中节点:', info);
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
    // let isLoggedIn = await Editor.User.isLoggedIn()
    // console.log("是否登录",isLoggedIn)
    let data:Editor.User.UserData = await Editor.User.getData()
    console.log("用户数据",data)

    // const lists = await _pluginSocket.getWitablePathFilesInfo()
    // console.log("可写目录",JSON.stringify(lists,null,2))
    const localIp = _funcs.getLocalIpv4IP()
    console.log("localIp",localIp)

    _pluginSocket.doVerify("kkkkkkk")
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
        showToast(_funcs.getI18nText("text_12"))
        return
    }
    const panelId = _funcs.getPluginName()+".localCache_panel"
    
    if(await Editor.Panel.has(panelId)){
        Editor.Panel.focus(panelId);
    }else{
        await Editor.Panel.open(panelId);
    }
}
const serverAddress_connected = ref("")
const serverAddress_connecting = ref("")

/**是否正在连接插件服务器 */
const isConnectingServer = ref(false)

const bAddressEditFocus = ref(false);
const addressInputRef = ref<HTMLInputElement | null>(null);

function setSocketAddress(url){
    serverAddress_connecting.value = url
}

defineExpose({
    setSocketAddress,
});

onMounted(()=>{
    isConnectingServer.value = !_pluginSocket.checkIsConnect()
    // _pluginSocket.waitSocketOpen().then(()=>{
    //     serverAddress_connected.value = _pluginSocket.getSocketUrl()
    //     isConnectingServer.value = false
    // })
    _pluginSocket.listenForSocketState((bIsConnected)=>{
        isConnectingServer.value = !bIsConnected
        serverAddress_connected.value = _pluginSocket.getSocketUrl()
    })
})

const onFocusEditAddress = () => {
  bAddressEditFocus.value = !bAddressEditFocus.value;
  if (bAddressEditFocus.value) {
    nextTick(() => {
      addressInputRef.value?.focus();
    });
  }
};

const handleNameBlur = () => {
    bAddressEditFocus.value = false;
};

async function onEditConfirmAddress(event){
    const url = event.target.value as string
    
    if(url==serverAddress_connected.value){
        bAddressEditFocus.value = false;
        return
    }
    if(url.length==0){
        showToast(_funcs.getI18nText("text_13"))
        return
    }else if(!url.startsWith("ws://")&&!url.startsWith("wss://")){
        showToast(_funcs.getI18nText("text_14"))
        return
    }
    serverAddress_connecting.value = url
    isConnectingServer.value = false

    const config: any = {
        // title: 'buttons',
        detail: `${_funcs.getI18nText("text_15")}${url}`,
        buttons: [_funcs.getI18nText("text_16"), _funcs.getI18nText("text_17")],
    };
    const result = await Editor.Dialog.info(_funcs.getI18nText("text_18"), config);
    if(result.response==0){
        _funcs.saveCustomServerAddress(url)
        Editor.Message.send(_funcs.getPluginName(),"restart-self")
    }else{
        bAddressEditFocus.value = false;
    }
}

const verifyInfo = reactive<VerifyRespParam>({
    activationCode:"",
    state:0,
    endTime:0,
    latestVersion:"",
    authorInfo:{
        helpDocUrl:"https://www.cocos.com/products?a=1",
        feedbackUrl:"https://www.cocos.com/products?a=2",
        qq:["1451784145"],
        qqgroups:["581563429"],
        wechat:["busky192"],
    }
})
provide("verifyInfo",verifyInfo)

//正在验证购买
const isVerifying = computed(()=>{
    return verifyInfo.state==0
})

//试用期
const isInTrialing = computed(()=>{
    return verifyInfo.state==2
})

//试用期结束，未激活
const isVerifyFailed = computed(()=>{
    return verifyInfo.state==1
})

//激活码已过期
const isExpired = computed(()=>{
    return verifyInfo.state==4
})

async function onDoVerify(activationCode:string){
    verifyInfo.state = 0
    nextTick(async ()=>{
        console.log("去验证",activationCode)
        const resp = await _pluginSocket.doVerify(activationCode)
        console.log("验证结果",resp)
        
        await Editor.Profile.setConfig(_funcs.getPluginName(),"activationCode",resp.activationCode)
        for(let k in resp){
            verifyInfo[k] = resp[k]
        }
        if(resp.state==1){//未激活

        }else if(resp.state==2){//试用期中

        }else if(resp.state==3){//已激活

        }else if(resp.state==4){//激活码已过期

        }
    })
}

provide("do_verify_activation_code",onDoVerify)

function onVerifyFail(data){
    console.log("验证失败",data)
    verifyInfo.state = data.state
}

onMounted(async ()=>{
    eventBus.on("verify_fail",onVerifyFail)
    
    const code = await Editor.Profile.getConfig(_funcs.getPluginName(),"activationCode")
    console.log("========code",code)
    onDoVerify(code)
})

onUnmounted(()=>{
    eventBus.off("verify_fail",onVerifyFail)
})

const hasJumpedTrial = ref(false)
function onJumpTrial(){
    hasJumpedTrial.value = true
}

</script>

<template>
    <!-- <div style="width: 600px;height: 600px;">
        <TestFlow/>
    </div> -->
    <div style="width: 100vw; height: 100vh; ">  
        <div style=" width: calc(100% - 10px);height: calc(100% - 35px);">
            <div class="center-align" v-if="isConnectingServer">
                <div  style="display: flex;flex-direction: column;">
                    <div style="display: flex; flex-direction: row; margin-bottom: 5px;align-items: center;justify-content: center;">
                        <h2>{{ _funcs.getI18nText("text_4") }}</h2>
                        <ui-loading style="margin-left: 10px;"></ui-loading>
                    </div>
                    <div style="display: flex; flex-direction: row; margin-bottom: 20px;align-items: center;justify-content: center;height: 30px;">
                        <h3>{{ _funcs.getI18nText("text_5") }}</h3>
                        <div v-if="!bAddressEditFocus" style="min-width: 60px;height: 22px;">
                            <label style="font-size: 15px;">{{ serverAddress_connecting }}</label>
                        </div>
                        <div v-else style="min-width: 60px;height: 22px;">
                            <ui-input ref="addressInputRef"
                                style="font-size: 15px;"
                                :value="serverAddress_connecting" 
                                type="text" 
                                @blur="handleNameBlur" 
                                @keydown.enter="onEditConfirmAddress" 
                            />
                        </div>
                        
                        <ui-button v-if="!bAddressEditFocus" style="padding-top: 5px;padding-bottom: 5px;margin-left: 10px;" @click="onFocusEditAddress">{{ _funcs.getI18nText("text_2") }}</ui-button>
                    </div>
                </div>
                <comp_md_info/>
            </div>
            <div class="center-align" v-else-if="isVerifying||isVerifyFailed||isExpired||(isInTrialing&&!hasJumpedTrial)">
                <comp_verify_code @onJumpTrial="onJumpTrial"/>
                <comp_md_info/>
            </div>
            <div class="center-align" v-else-if="isRuntimeOffline">
                
                <div v-if="serverAddress_connected" style="display: flex;flex-direction: column;">
                    <div style="display: flex; flex-direction: row; margin-bottom: 20px;align-items: center;justify-content: center;height: 30px;">
                        <h3>{{ _funcs.getI18nText("text_1") }}</h3>
                        <div v-if="!bAddressEditFocus"  style="min-width: 60px;">
                            <label style="font-size: 15px;">{{ serverAddress_connected }}</label>
                        </div>
                        <ui-input ref="addressInputRef" style="font-size: 15px;"
                            v-else 
                            :value="serverAddress_connected"
                            type="text" 
                            @blur="handleNameBlur" 
                            @keydown.enter="onEditConfirmAddress" 
                        />
                        <ui-button v-if="!bAddressEditFocus" style="padding-top: 5px;padding-bottom: 5px;margin-left: 10px;" @click="onFocusEditAddress">{{ _funcs.getI18nText("text_2") }}</ui-button>
                    </div>
                    <div style="display: flex; flex-direction: row;align-items: center;justify-content: center;">
                        <h2>{{ _funcs.getI18nText("text_3") }}</h2>
                    </div>
                    <div style="display: flex; flex-direction: row;align-items: center;justify-content: center;">
                        <ui-button type="default" style="margin-top: 5px; padding-top: 5px;padding-bottom: 5px;" @confirm="doOpenRuntimePreview">{{ _funcs.getI18nText("text_6") }} {{runtimePreviewUrl}}</ui-button>
                    </div>
                    
                </div>
                <div v-else>
                    <h2>{{ _funcs.getI18nText("text_7") }}</h2>
                </div>
                <comp_md_info style="margin-top: 20px;"/>
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
                    <div v-else class="defaultInfo">
                        <div class="button-grid" >
                            <el-button  @click="openEvalPanel">{{ _funcs.getI18nText("text_8") }}</el-button>
                            <el-button  @click="openDynamicPanel">{{ _funcs.getI18nText("text_9") }}</el-button>
                            <el-button  @click="openLogPanel">{{ _funcs.getI18nText("text_10") }}</el-button>
                            <el-button  @click="openLocalCachePanel">{{ _funcs.getI18nText("text_11") }}</el-button>
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
    flex-direction: column;
    gap: 20px;
}

.defaultInfo{
    display: flex;
    flex-direction: column; 
    gap: 10px;
    margin: 10px;
    /* overflow-y: auto; */
}

</style>
