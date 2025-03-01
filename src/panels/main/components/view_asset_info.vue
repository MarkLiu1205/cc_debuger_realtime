
<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { _dataCtx } from '../../../tools/_dataCtx';
import { eventBus } from '../../../tools/_enentBus';
import { _funcs } from '../../../tools/_funcs';

const assetInfo = defineModel<ResTreeItem>() 
const isNotInCache = ref(false)

const curOnlineInfo = ref<OnlineInfo>(null)
//当前运行时是不是在本机运行
const bRuntimeIsLocalhost = ref(true)

//临时预览地址（即在asset-db中查询不到，必须实时下载的）
const tempPreviewPath = ref("")

onMounted(()=>{
    // console.log("assetInfo",assetInfo.value.assetType,assetInfo.value.refCount)
    if(assetInfo.value==null){
        return
    }
    if(!assetInfo.value.isDirectory&&assetInfo.value.refCount==null){
        isNotInCache.value = true
    }else{
        isNotInCache.value = false
    }

    const localIps = _funcs.getLocalIPs();
    _pluginSocket.listenRuntimeOnlineInfo(async (info:OnlineInfo)=>{
        // console.log("3在线刷新----",info)
        if(info.bIsOnline){
            const ip = info?.info?.IP;
            if(ip=="localhost"||ip=="::1"||ip=="127.0.0.1"||localIps.includes(ip)){
                const gameEnvObj = await _pluginSocket.getGameEnv()
                if(!gameEnvObj.isMobile){//表是不是模拟器
                    bRuntimeIsLocalhost.value = true
                }
            }else{
                bRuntimeIsLocalhost.value = false
            }
            // console.log("bRuntimeIsLocalhost",bRuntimeIsLocalhost.value)
        }
        
        curOnlineInfo.value = info
    })
})

watch(assetInfo,(newVal,oldVal)=>{
    if(assetInfo.value==null){
        return
    }
    if(!assetInfo.value.isDirectory&&assetInfo.value.refCount==null){
        isNotInCache.value = true
    }else{
        isNotInCache.value = false
    }
    tempPreviewPath.value = null;
})

const originalWidth = computed(()=>{
    if(assetInfo.value?.width){
        return assetInfo.value.width
    }
    
})

const originalHeight = computed(()=>{
    if(assetInfo.value?.height){
        return assetInfo.value.height
    }
})

const maxWidth = 350
const maxHeight = 300
const _width = computed(()=>{
    let scale = Math.min(maxWidth/originalWidth.value,maxHeight/originalHeight.value,1)
    return Math.floor(originalWidth.value*scale)+"px"
})
const _height = computed(()=>{
    let scale = Math.min(maxWidth/originalWidth.value,maxHeight/originalHeight.value,1)
    return Math.floor(originalHeight.value*scale)+"px"
})

const bIsImage = computed(()=>{
    return assetInfo.value.assetType=='cc.ImageAsset' || assetInfo.value.assetType=='cc.Texture2D' || assetInfo.value.assetType=='cc.SpriteFrame'
})

function getFileCount(item:ResTreeItem){
    if(!item.isDirectory){
        return {totalNum:0,totalTexMemory:0}
    }
    let totalNum = 0
    let totalTexMemory = 0;
    function traverse(node: ResTreeItem) {
        if(!node.isDirectory){
            totalNum += 1;
        }
        if(node.assetType=="cc.ImageAsset"){
            totalTexMemory += node.memory??0
        }
        if (node.children) {
            for(let child of node.children){
                traverse(child)
            }
        }
    }
    traverse(item)

    return {totalNum,totalTexMemory}
}

const floderStat = computed(()=>{
    return getFileCount(assetInfo.value)
})

const bundles = computed(()=>{
    return Object.keys(_dataCtx.m_bundles)
})

function onClickBundle(mode: string) {
    // console.log(`Label clicked: ${mode}`,_dataCtx.m_bundles[mode]);
    
    onClickUuid(_dataCtx.m_bundles[mode].uuid)
}

function onClickUuid(uuid){
    eventBus.emit("click-asset-in-inspector", uuid);
}

function onClick_checkUsege_node(){
    eventBus.emit("check-asset-usege-node", assetInfo.value.uuid);
}

function onClick_checkUsege_asset(){
    eventBus.emit("check-asset-usege-asset", assetInfo.value.uuid);
}

function onClick_checkDepend(){
    eventBus.emit("check-asset-depend", assetInfo.value.uuid);
}

function onClick_checkDepend_traverse(){
    eventBus.emit("check-asset-depend-traverse", assetInfo.value.uuid);
}

function onPreviewImgSrc(){
    //TODO
    tempPreviewPath.value = assetInfo.value.imgSrc
    // console.log("tempPreviewPath.value",tempPreviewPath.value)
}

</script>

<template>
    <div class="asset-info">
        <div v-if="assetInfo.path=='assets'">
            <div class="row">
                <label class="orange">{{ _funcs.getI18nText("text_49") }}</label>
                <label class="break-word">{{ floderStat.totalNum }}</label>
            </div>
            <div class="row">
                <ui-label class="orange" :tooltip='_funcs.getI18nText("text_50")'>{{ _funcs.getI18nText("text_51") }}</ui-label>
                <label class="break-word">{{ (floderStat.totalTexMemory/1024/1024).toFixed(2) }}M</label>
            </div>
            <div >
                <label class="orange">{{ _funcs.getI18nText("text_52") }}</label>
                <div v-for="(mode, index) in bundles" :key="mode" :value="mode">
                    <label class="clickable" @click="onClickBundle(mode)">@{{ mode }}</label>
                </div>
            </div>
        </div>
        <div v-else-if="assetInfo.isDirectory">
            <div class="row" v-if="assetInfo.isBundleFloder">
                <label class="orange">{{ _funcs.getI18nText("text_53") }}</label>
                <label>YES</label>
            </div>
            <div class="row" v-if="!assetInfo.isBundleFloder">
                <label class="orange">{{ _funcs.getI18nText("text_54") }}</label>
                <label>{{assetInfo.bundleName??"无"}}</label>
            </div>
            <div class="row">
                <label class="orange">path:</label>
                <label class="break-word">{{ assetInfo.path }}</label>
            </div>
            <div class="row">
                <label class="orange">{{ _funcs.getI18nText("text_49") }}</label>
                <label class="break-word">{{ floderStat.totalNum }}</label>
            </div>
            <div class="row">
                <ui-label class="orange" :tooltip='_funcs.getI18nText("text_50")'>{{ _funcs.getI18nText("text_51") }}</ui-label>
                <label class="break-word">{{ (floderStat.totalTexMemory/1024/1024).toFixed(2) }}M</label>
            </div>
        </div>
        <div v-else>
            <div class="row">
                <label class="orange">{{ _funcs.getI18nText("text_54") }}</label>
                <label>{{assetInfo.bundleName??"无"}}</label>
            </div>
            
            <div class="row">
                <label class="orange">url:</label>
                <ui-link v-if="assetInfo.imgSrc!=null">{{ assetInfo.imgSrc }}</ui-link>
                <label class="break-word" v-else>{{ assetInfo.url }}</label>
            </div>
            <div class="row">
                <label class="orange">uuid:</label>
                <label class="break-word">{{ assetInfo.uuid }}</label>
            </div>
            <div class="row">
                <label class="orange">{{ _funcs.getI18nText("text_55") }}</label>
                <label class="break-word">{{ assetInfo.assetType }}</label>
            </div>
            <div class="row" v-if="!isNotInCache">
                <label class="orange">{{ _funcs.getI18nText("text_56") }}:</label>
                <label>{{ assetInfo.refCount??_funcs.getI18nText("text_57")}}</label>
            </div>
            <div class="row" v-if="isNotInCache">
                <label class="yellow">{{ _funcs.getI18nText("text_58") }}</label>

            </div>
            <div style="margin-top: 10px;">
                <div class="row" v-if="assetInfo.textureUuid">
                    <label class="orange">{{ _funcs.getI18nText("text_59") }}</label>
                    <label class="clickable" @click="onClickUuid(assetInfo.textureUuid)">{{ assetInfo.textureUuid }}</label>
                </div>
                <div class="row" v-if="assetInfo.imageUuid">
                    <label class="orange">{{ _funcs.getI18nText("text_60") }}</label>
                    <label class="clickable" @click="onClickUuid(assetInfo.imageUuid)">{{ assetInfo.imageUuid }}</label>
                </div>
            </div>
            <div style="margin-top: 10px;">
                <label class="orange">{{ _funcs.getI18nText("text_61") }}</label>
                <div class="dependusege">
                    <div class="row">
                        <ui-button style="padding-top:5px;padding-bottom:5px" @confirm="onClick_checkUsege_node">{{ _funcs.getI18nText("text_26") }}</ui-button>
                        <ui-button style="padding-top:5px;padding-bottom:5px" @confirm="onClick_checkUsege_asset">{{ _funcs.getI18nText("text_27") }}</ui-button>
                    </div>
                    <div class="row">
                        <ui-button style="padding-top:5px;padding-bottom:5px" @confirm="onClick_checkDepend">{{ _funcs.getI18nText("text_28") }}</ui-button>
                        <ui-button style="padding-top:5px;padding-bottom:5px" @confirm="onClick_checkDepend_traverse">{{ _funcs.getI18nText("text_29") }}</ui-button>
                    </div>
                </div>
                
            </div>
            <div style="margin-top: 10px;" v-if="bIsImage">
                
                <div class="row" v-if="assetInfo.assetType=='cc.ImageAsset' && !isNotInCache">
                    <ui-label class="orange" :tooltip='_funcs.getI18nText("text_50")'>{{ _funcs.getI18nText("text_62") }}</ui-label>
                    <label class="break-word" >{{ (assetInfo.memory/1024/1024).toFixed(2) }}M</label>
                </div>
                <div class="row" style="gap: 5px;" v-if="!isNotInCache">
                    <label class="orange">size:</label>
                    <label>{{ originalWidth }}</label>
                    <label>x</label>
                    <label>{{ originalHeight }}</label>
                </div>
                <div class="image" :style="{width:_width,height:_height}" >
                    <div v-if="bRuntimeIsLocalhost">
                        <ui-image :value="assetInfo.imgSrc??assetInfo.uuid" :style="{width:_width,height:_height}" />
                    </div>
                    <div v-else>
                        <div v-if="assetInfo.imgSrc">
                            <ui-button @click="onPreviewImgSrc">{{ _funcs.getI18nText("text_63") }}</ui-button>
                            <ui-image v-if="tempPreviewPath" :value="tempPreviewPath" :style="{width:_width,height:_height}" />
                        </div>
                        <div v-else>
                            <ui-image :value="assetInfo.uuid" :style="{width:_width,height:_height}" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        

    </div>
</template>

<style scoped>

.asset-info{
    display: flex;
    flex-direction: column; 
    font-size: 12px; 
    padding-top: 15px;
    padding-bottom: 15px;
    padding-left: 10px;
    border: 1px solid rgb(165, 165, 165);
    gap: 5px;

    word-wrap: break-word;
    word-break: break-all;
    user-select: text;
}

.bundles{
    display: flex;
    flex-direction: column; 
}

.row{
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
}

.image{
    border: 1px solid rgb(165, 165, 165);
    margin-bottom: 5px;
}

.orange{
    color: orange;
    font-size: 15px;
}

.yellow{
    color: rgb(238, 255, 0);
    font-size: 15px;
}

.clickable {
    cursor: pointer;
    transition: color 0.3s;
    user-select: none;
    margin-left: 5px;
    color: rgb(195, 214, 111);;
}

.clickable:hover {
    color: rgb(247, 232, 29); /* 设置 hover 颜色 */
}

.dependusege{
    display: flex;
    flex-direction: column; 
    border: 1px solid rgb(165, 165, 165);
    gap: 10px;
    padding: 10px;
}

</style>
