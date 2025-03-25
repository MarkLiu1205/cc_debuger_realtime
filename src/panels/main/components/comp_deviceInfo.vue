
<script lang="ts" setup>
import { inject, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { _funcs } from '../../../tools/_funcs';

const showToast = inject<ToastParam>("message")

const curInfo = ref<OnlineInfo>(null)
const nameArr = ref<Array<string>>([])
const gameEnvObj = ref<GameEnvParam>(null)

const dynamicTextureEnabled = ref(false)

let _cancelFor_onlineInfoChanged:()=>void = null
let _cancelFor_onRuntimeListChange:()=>void = null
onMounted(()=>{
    _cancelFor_onlineInfoChanged = _pluginSocket.listenRuntimeOnlineInfo((info:OnlineInfo)=>{
        // console.log("2在线刷新----",info)
        curInfo.value = info
        if(nameArr.value==null){
            nameArr.value = [info.name]
        }
        _pluginSocket.getGameEnv(true).then((obj)=>{
            // console.log("游戏env",obj)
            gameEnvObj.value = obj
        })
    })

    _cancelFor_onRuntimeListChange = _pluginSocket.listenRuntimeList((arr:Array<string>)=>{
        nameArr.value = arr
    })

    _pluginSocket.getGameEnv().then((obj)=>{
        gameEnvObj.value = obj
    })

    _pluginSocket.requestDynamicAtlasEnable("").then((enabled:boolean)=>{
        dynamicTextureEnabled.value = enabled
    })
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
})

function onSelect(event){
    const sel = event.target.value
    console.log(sel)
    _pluginSocket.selectActiveRuntime(sel)
}

const serverAddress_connected = ref("")
const bAddressEditFocus = ref(false);
const addressInputRef = ref<HTMLInputElement | null>(null);

onMounted(()=>{
    serverAddress_connected.value = _pluginSocket.getSocketUrl()
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

async function onPrintSearchPaths(){
    let paths = await _pluginSocket.getSearchPaths()
    _funcs.log_1("SearchPaths",paths)
    showToast("已获取到搜索路径，请查看控制台日志")
}

</script>

<template>
    <div class="device-info" v-if="curInfo?.bIsOnline">
        <div style="display: flex; flex-direction: row; margin-bottom: 5px;align-items: center;height: 30px;">
            <ui-label :tooltip='_funcs.getI18nText("text_1")'>{{ _funcs.getI18nText("text_1") }}</ui-label>
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
            <ui-button v-if="!bAddressEditFocus" style="padding-top: 2px;padding-bottom: 2px;margin-left: 10px;" @click="onFocusEditAddress">{{ _funcs.getI18nText("text_2") }}</ui-button>
        </div>
        <div class="row">
            <label>{{ _funcs.getI18nText("text_20") }}</label>
            <!-- <label class="blue">{{ curInfo.name }}</label> -->
            <ui-select id="id_cacheMode" :value="curInfo.name" @change="onSelect">
                <option v-for="(mode, index) in nameArr" :key="index" :value="mode">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="row">
            <label>{{ curInfo.info.Family }}:</label>
            <label>Ip</label>
            <label class="blue">{{ curInfo.info.IP }}</label>
            <label>Port</label>
            <label class="blue">{{ curInfo.info.Port }}</label>
        </div>
        <div v-if="gameEnvObj!=null">
            <div class="row" v-if="gameEnvObj.CC_PREVIEW">
                <label>CC_PREVIEW:</label>
                <label class="blue">{{ gameEnvObj.CC_PREVIEW }}</label>
            </div>
            <div class="row" v-if="!gameEnvObj.CC_PREVIEW">
                <label>CC_DEBUG:</label>
                <label class="blue">{{ gameEnvObj.CC_DEBUG }}</label>
                <label>CC_JSB:</label>
                <label class="blue">{{ gameEnvObj.CC_JSB }}</label>
            </div>
            <div class="row" v-if="!gameEnvObj.CC_PREVIEW">
                <label>isMobile:</label>
                <label class="blue">{{ gameEnvObj.isMobile }}</label>
                <label>isBrowser:</label>
                <label class="blue">{{ gameEnvObj.isBrowser }}</label>
            </div>
            <div class="row">
                <label>dynamicTextureEnabled:</label>
                <label class="blue">{{ dynamicTextureEnabled }}</label>
            </div>
            <div class="row" v-if="gameEnvObj.CC_JSB">
                <label>writablePath:</label>
                <label class="blue scrollable">{{ gameEnvObj.writablePath }}</label>
            </div>
            <div class="row" v-if="gameEnvObj.CC_JSB">
                <ui-button @click="onPrintSearchPaths">SearchPaths</ui-button>
            </div>
        </div>
    </div>
</template>

<style scoped>

.device-info{
    display: flex;
    flex-direction: column; 
    font-size: 15px; 
    padding-top: 15px;
    padding-bottom: 15px;
    padding-left: 10px;
    border: 1px solid rgb(165, 165, 165);
    gap: 5px;
}

.row{
    display: flex;
    flex-direction: row;
    gap: 10px;
}

.blue{
    color: rgb(39, 215, 192);
}

.scrollable {
    display: block;
    max-width: 100%;
    overflow-x: auto;
    white-space: nowrap;
    user-select: text;
}

/* Hide scrollbar for Chrome, Safari and Opera */
.scrollable::-webkit-scrollbar {
    display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.scrollable {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
}
</style>
