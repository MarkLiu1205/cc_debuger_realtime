
<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { _pluginSocket } from '../../../tools/plugin_socket';

const curInfo = ref<OnlineInfo>(null)
const nameArr = ref<Array<string>>([])
const gameEnvObj = ref<GameEnvParam>(null)

const dynamicTextureEnabled = ref(false)

onMounted(()=>{
    _pluginSocket.listenRuntimeOnlineInfo((info:OnlineInfo)=>{
        // console.log("在线刷新----",info.bIsOnline)
        curInfo.value = info
        if(nameArr.value==null){
            nameArr.value = [info.name]
        }
        _pluginSocket.getGameEnv().then((obj)=>{
            // console.log("游戏env",obj)
            gameEnvObj.value = obj
        })
    })

    _pluginSocket.listenRuntimeList((arr:Array<string>)=>{
        nameArr.value = arr
    })

    _pluginSocket.getGameEnv().then((obj)=>{
        gameEnvObj.value = obj
    })

    _pluginSocket.requestDynamicAtlasEnable("").then((enabled:boolean)=>{
        dynamicTextureEnabled.value = enabled
    })
})

function onSelect(event){
    const sel = event.target.value
    console.log(sel)
    _pluginSocket.selectActiveRuntime(sel)
}

</script>

<template>
    <div class="device-info" v-if="curInfo?.bIsOnline">
        <div class="row">
            <label>当前runtime:</label>
            <!-- <label class="blue">{{ curInfo.name }}</label> -->
            <ui-select id="id_cacheMode" :value="curInfo.name" @change="onSelect">
                <option v-for="(mode, index) in nameArr" :key="index" :value="mode">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="row">
            <label>{{ curInfo.info.family }}:</label>
            <label>Ip</label>
            <label class="blue">{{ curInfo.info.ip }}</label>
            <label>Port</label>
            <label class="blue">{{ curInfo.info.port }}</label>
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
</style>
