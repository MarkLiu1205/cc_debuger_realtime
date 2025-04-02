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
import comp_func_buttons from './components/comp_func_buttons.vue';
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

function _onlineInfoChanged(info:OnlineInfo){
    // console.log("1在线刷新----",info)
    isRuntimeOffline.value = !info.bIsOnline
    if(!info.bIsOnline){
        _curSelNodeInfo.value = null
        _curSelResItem.value = null
        
        _pluginSocket.clear()
        _dataCtx.clear()
    }
    Editor.Message.request(_funcs.getPluginName(),"onRuntimeOnlineState",info.bIsOnline)
}

function _onSceneLaunched(name){
    _funcs.log_1("场景切换",name)
    _curSelNodeInfo.value = null
    _curSelResItem.value = null
}

function _onRuntimeListChange(nameArr: string[]){
    _funcs.log_1("runtime 列表：",JSON.stringify(nameArr))
}

let _cancelFor_onlineInfoChanged:()=>void = null
let _cancelFor_onRuntimeListChange:()=>void = null
let _cancelFor_onSceneLaunched:()=>void = null

onMounted(()=>{
    _cancelFor_onlineInfoChanged = _pluginSocket.listenRuntimeOnlineInfo(_onlineInfoChanged)

    _cancelFor_onRuntimeListChange = _pluginSocket.listenRuntimeList(_onRuntimeListChange)

    _cancelFor_onSceneLaunched = _pluginSocket.listenSceneLaunched(_onSceneLaunched)
})

onUnmounted(()=>{
    if(_cancelFor_onlineInfoChanged){
        _cancelFor_onlineInfoChanged()
        _cancelFor_onlineInfoChanged = null
    }
    if(_cancelFor_onRuntimeListChange){
        _cancelFor_onRuntimeListChange()
        _cancelFor_onRuntimeListChange = null
    }
    if(_cancelFor_onSceneLaunched){
        _cancelFor_onSceneLaunched()
        _cancelFor_onSceneLaunched = null
    }
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

function _applyNodeInfoChange(oldObj: any, changes: Record<string, any> | null): void {
    if (!changes) {
        return;
    }
    for (const key in changes) {
        const changeVal = changes[key];
        // 过滤原型链上的属性
        if (!changes.hasOwnProperty(key)) {
            continue;
        }
        if (changeVal === null) {
            continue;
        }
        const oldVal = oldObj[key];
        if (Array.isArray(changeVal)) {
            // 处理数组类型的变更
            if (!Array.isArray(oldVal)) {
                // 旧值不是数组，直接替换为新数组
                const newArray: any[] = [];
                for (let i = 0; i < changeVal.length; i++) {
                    newArray[i] = changeVal[i] !== null ? changeVal[i] : null;
                }
                oldObj[key] = newArray;
            } else {
                // 调整旧数组长度以匹配变更数组长度
                if (oldVal.length < changeVal.length) {
                    oldVal.length = changeVal.length;
                }
                // 遍历处理每个索引的变更
                for (let i = 0; i < changeVal.length; i++) {
                    const elemChange = changeVal[i];
                    if (elemChange === null) {
                        // 无变更，但需确保新增索引设为 null（与原逻辑一致）
                        if (i >= oldVal.length) {
                            oldVal[i] = null;
                        }
                        continue;
                    }
                    // 处理当前索引的变更
                    if (typeof elemChange === 'object' && elemChange !== null) {
                        // 递归处理对象或数组
                        if (oldVal[i] !== null && typeof oldVal[i] === 'object') {
                            _applyNodeInfoChange(oldVal[i], elemChange);
                        } else {
                            oldVal[i] = elemChange;
                        }
                    } else {
                        // 基本类型直接赋值
                        oldVal[i] = elemChange;
                    }
                }
            }
        } else if (typeof changeVal === 'object' && changeVal !== null) {
            // 处理对象类型的变更
            if (oldVal === null || typeof oldVal !== 'object') {
                // 旧值非对象，直接替换
                oldObj[key] = changeVal;
            } else {
                // 递归处理子对象
                _applyNodeInfoChange(oldVal, changeVal);
            }
        } else {
            // 基本类型直接替换
            oldObj[key] = changeVal;
        }
    }
}

const ref_comp_left_tree_panel = ref(null)

let _cancelFor_onUpdateCurSelNodeInfo:()=>void = null
onMounted(()=>{
    _cancelFor_onUpdateCurSelNodeInfo = _pluginSocket.listenForUpdateCurSelNodeInfo((diff)=>{
        try{
            let newVal = JSON.parse(JSON.stringify(_curSelNodeInfo.value))
            _applyNodeInfoChange(newVal,diff) 
            ref_comp_left_tree_panel.value.resetCurSelNodeInfo(newVal)
        }catch(e){

        }
    })
})

onUnmounted(()=>{
    if(_cancelFor_onUpdateCurSelNodeInfo){
        _cancelFor_onUpdateCurSelNodeInfo()
        _cancelFor_onUpdateCurSelNodeInfo = null
    }
})

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

function _onSocketStateChanged(bIsConnected){
    isConnectingServer.value = !bIsConnected
    serverAddress_connected.value = _pluginSocket.getSocketUrl()
}

let _cancelForSocketState:()=>void = null
onMounted(()=>{
    isConnectingServer.value = !_pluginSocket.checkIsConnect()
    _pluginSocket.listenForSocketState(_onSocketStateChanged)
})

onUnmounted(()=>{
    _pluginSocket.cancelForSocketState(_onSocketStateChanged)
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
    statusCode:200,
    activationCode:"",
    msg:"",
    state:0,
    endTime:0,
    latestVersion:"",
    authorInfo:{
        githubUrl:     "https://github.com/hyz1992/cc_debuger_realtime_publish.git",
        cocosStoreUrl: "https://store.cocos.com/app/search?name=%E8%8A%B1%E5%A4%A9%E7%8B%82%E9%AA%A8",
        helpDocUrl:  "https://github.com/hyz1992/cc_debuger.git",
        feedbackUrl: "https://forum.cocos.org/t/topic/166094",
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
        // console.log("去验证",activationCode)
        const resp = await _pluginSocket.doVerify(activationCode)
        if(resp.state==null||resp.state<0){
            verifyInfo.state = 1
            return
        }
        // console.log("验证结果",resp)
        
        await Editor.Profile.setConfig(_funcs.getPluginName(),"activationCode",resp.activationCode)
        for(let k in resp){
            if(resp[k]!=null){
                const val = resp[k]
                if(k=="authorInfo"){
                    for(let key in val){
                        if(val[key]!=null){
                            verifyInfo.authorInfo[key] = val[key]
                        }
                    }
                    
                }else{
                    verifyInfo[k] = val
                }
            }
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
    // console.log("验证失败",data)
    verifyInfo.state = data.state
}

onMounted(async ()=>{
    eventBus.on("verify_fail",onVerifyFail)
    
    
    onDoVerify("")
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
                    <comp_left_tree_panel ref="ref_comp_left_tree_panel"
                        @onSel_asset="onSel_asset"
                        @onSel_node="onSel_node"
                    />
                </div>
                <div class="resizer-line-1" ref="resizer_ele_1"></div>
                
                <div class="right-panel" :style="{ width: width_right_panel + 'px' }">
                    
                    <Inspector_Node v-if="_curSelNodeInfo!=null" v-model="_curSelNodeInfo"/>
                    <view_asset_info v-else-if="_curSelResItem!=null" v-model="_curSelResItem"/>
                    <div v-else class="defaultInfo">
                        <comp_func_buttons/>
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
