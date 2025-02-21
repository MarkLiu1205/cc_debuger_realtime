
<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { _pluginSocket } from '../../../tools/plugin_socket';
import { _dataCtx } from '../../../tools/_dataCtx';
import { eventBus } from '../../../tools/_enentBus';

const assetInfo = defineModel<ResTreeItem>() 
const isNotInCache = ref(false)

onMounted(()=>{
    console.log("assetInfo",assetInfo.value.assetType,assetInfo.value.refCount)
    if(assetInfo.value==null){
        return
    }
    if(!assetInfo.value.isDirectory&&assetInfo.value.refCount==null){
        isNotInCache.value = true
    }else{
        isNotInCache.value = false
    }
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
    console.log(`Label clicked: ${mode}`,_dataCtx.m_bundles[mode]);
    
    onClickUuid(_dataCtx.m_bundles[mode].uuid)
}

function onClickUuid(uuid){
    eventBus.emit("click-asset-in-inspector", uuid);
}

</script>

<template>
    <div class="asset-info">
        <div v-if="assetInfo.path=='assets'">
            <div class="row">
                <label class="orange">asset数量:</label>
                <label class="break-word">{{ floderStat.totalNum }}</label>
            </div>
            <div class="row">
                <ui-label class="orange" tooltip="根据纹理图片的宽高计算的，仅是预估值，不完全准确">预估texture内存:</ui-label>
                <label class="break-word">{{ (floderStat.totalTexMemory/1024/1024).toFixed(2) }}M</label>
            </div>
            <div >
                <label class="orange">bundle列表:</label>
                <div v-for="(mode, index) in bundles" :key="mode" :value="mode">
                    <label class="clickable" @click="onClickBundle(mode)">@{{ mode }}</label>
                </div>
            </div>
        </div>
        <div v-else-if="assetInfo.isDirectory">
            <div class="row" v-if="assetInfo.isBundleFloder">
                <label class="orange">是否bundle文件夹:</label>
                <label>YES</label>
            </div>
            <div class="row" v-if="!assetInfo.isBundleFloder">
                <label class="orange">所属bundle:</label>
                <label>{{assetInfo.bundleName??"无"}}</label>
            </div>
            <div class="row">
                <label class="orange">path:</label>
                <label class="break-word">{{ assetInfo.path }}</label>
            </div>
            <div class="row">
                <label class="orange">asset数量:</label>
                <label class="break-word">{{ floderStat.totalNum }}</label>
            </div>
            <div class="row">
                <ui-label class="orange" tooltip="根据纹理图片的宽高计算的，仅是预估值，不完全准确">预估texture内存:</ui-label>
                <label class="break-word">{{ (floderStat.totalTexMemory/1024/1024).toFixed(2) }}M</label>
            </div>
        </div>
        <div v-else>
            <div class="row">
                <label class="orange">所属bundle:</label>
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
                <label class="orange">asset类型:</label>
                <label class="break-word">{{ assetInfo.assetType }}</label>
            </div>
            <div class="row" v-if="!isNotInCache">
                <label class="orange">引用计数:</label>
                <label>{{ assetInfo.refCount??"没有调用过addRef，疑似没有做内存管理" }}</label>
            </div>
            <div class="row" v-if="isNotInCache">
                <label class="yellow">⚠️此资源不在assetManager.assets缓存中</label>

            </div>
            <div class="row" v-if="assetInfo.textureUuid">
                <label class="orange">依赖的Texture2D:</label>
                <label class="clickable" @click="onClickUuid(assetInfo.textureUuid)">{{ assetInfo.textureUuid }}</label>
            </div>
            <div class="row" v-if="assetInfo.imageUuid">
                <label class="orange">依赖的ImageAsset:</label>
                <label class="clickable" @click="onClickUuid(assetInfo.imageUuid)">{{ assetInfo.imageUuid }}</label>
            </div>
            <div v-if="bIsImage">
                <div class="image" :style="{width:_width,height:_height}" >
                    <ui-image :value="assetInfo.imgSrc??assetInfo.uuid" :style="{width:_width,height:_height}" />
                </div>
                <div class="row" style="gap: 5px; margin-top: 10px;" v-if="!isNotInCache">
                    <label class="orange">size:</label>
                    <label>{{ originalWidth }}</label>
                    <label>x</label>
                    <label>{{ originalHeight }}</label>
                </div>
                <div class="row" v-if="assetInfo.assetType=='cc.ImageAsset' && !isNotInCache">
                    <ui-label class="orange" tooltip="根据纹理图片的宽高计算的，仅是预估值，不完全准确">预估内存:</ui-label>
                    <label class="break-word" >{{ (assetInfo.memory/1024/1024).toFixed(2) }}M</label>
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

</style>
