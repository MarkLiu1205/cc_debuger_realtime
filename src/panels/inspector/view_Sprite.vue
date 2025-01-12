<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { _funcs } from '../../tools/_funcs';

enum _SizeMode {
    CUSTOM = 0,
    TRIMMED = 1,
    RAW = 2
}

const enumDesc_SizeMode = [
    "CUSTOM",
    "TRIMMED",
    "RAW",
]

enum _SpriteType {
    SIMPLE = 0,
    SLICED = 1,
    TILED = 2,
    FILLED = 3
}

const enumDesc_SpriteType = [
    "SIMPLE",
    "SLICED",
    "TILED",
    "FILLED",
]

const _compData = reactive({
    color: "#ffffff",
    customMaterial: "d3c7820c-2a98-4429-8bc7-b8453bc9ac41",
    grayscale: false,
    sizeMode: _SizeMode.TRIMMED,
    spriteAtlas: null,
    spriteFrame: "adc844c5-3225-4d5c-88d5-caae62248f8b@f9941",
    trim: true,
    type: _SpriteType.SIMPLE,
    enabled: true,
});

const ref_customMaterial = ref(null)
const ref_spriteAtlas = ref(null)
const ref_spriteFrame = ref(null)

function onAssetConfirm(event:CustomEvent ){
    const element = event.target as HTMLElement
    //@ts-ignore
    const assetUuid = element.value;
    if(element==ref_customMaterial.value){
        console.log("选中材质",assetUuid)
    }else if(element==ref_spriteAtlas.value){
        console.log("选中图集",assetUuid)
    }else if(element==ref_spriteFrame.value){
        console.log("选中精灵帧",assetUuid)
    }
}

function onConfirmColor(arr){
    const [r,g,b,a] = arr
    
    _compData.color = _funcs.rgbaToHex(r,g,b,a)
    console.log("r,g,b,a",r,g,b,a,_compData.color)
}

onMounted(()=>{
    ref_customMaterial.value.addEventListener('confirm', onAssetConfirm);
    ref_spriteAtlas.value.addEventListener('confirm', onAssetConfirm);
    ref_spriteFrame.value.addEventListener('confirm', onAssetConfirm);
})

onUnmounted(()=>{
    ref_customMaterial.value?.removeEventListener('confirm', onAssetConfirm);
    ref_spriteAtlas.value?.removeEventListener('confirm', onAssetConfirm);
    ref_spriteFrame.value?.removeEventListener('confirm', onAssetConfirm);
})

function onSelect(event){
    const eleId = event.target.id
    const sel = event.target.value
    if(eleId=="id_sizeMode"){
        _compData.sizeMode = sel
        console.log("sizeMode changed to:", event.target.value,_compData.sizeMode)
    }else if(eleId=="id_type"){
        _compData.type = sel
        console.log("Sprite type changed to:", event.target.value,_compData.type)
    }
    
}

function onSelect_SpriteType(event){
    console.log("Sprite type changed to:", event.target.value,_compData.type)
}

function onToggle(event){
    const eleId = event.target.id 
    const bool = event.target.value
    if(eleId=="id_enable"){
        _compData.enabled = bool
    }else if(eleId=="id_grayscale"){
        _compData.grayscale = bool
    }else if(eleId=="id_trim"){
        _compData.trim = bool
    }
    
    console.log("event.target.value",event.target.value,"id",event.target.id)
}

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enable" @change="onToggle" :value="_compData.enabled"></ui-checkbox>
            <h3>cc.Sprite</h3>
        </div>
        <div class="property">
            <label>CustomMaterial:</label>
            <ui-asset droppable="cc.Material" ref="ref_customMaterial" :value="_compData.customMaterial"></ui-asset>
        </div>
        <div class="property">
            <label>Color:</label>
            <ui-color @confirm="onConfirmColor($event.target.value)" :value="_compData.color"></ui-color>
        </div>
        <div class="property">
            <label>SpriteAtlas:</label>
            <ui-asset droppable="cc.SpriteAtlas" ref="ref_spriteAtlas" :value="_compData.spriteAtlas"></ui-asset>
        </div>
        <div class="property">
            <label>SpriteFrame:</label>
            <ui-asset droppable="cc.SpriteFrame" ref="ref_spriteFrame" :value="_compData.spriteFrame"></ui-asset>
        </div>
        <div class="property">
            <label>Grayscale:</label>
            <ui-checkbox id="id_grayscale" @change="onToggle" :value="_compData.grayscale"></ui-checkbox>
        </div>
        <div class="property">
            <label>SizeMode:</label>
            <!-- <select v-model="_compData.sizeMode" @change="onSelect_SizeMode">
                <option v-for="(mode, index) in enumDesc_SizeMode" :key="index" :value="index">{{ mode }}</option>
            </select> -->
            <ui-select id="id_sizeMode" v-model="_compData.sizeMode" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_SizeMode" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        
        <div class="property">
            <label>Type:</label>
            <!-- <select v-model="_compData.type" @change="onSelect_SpriteType">
                <option v-for="(mode, index) in enumDesc_SpriteType" :key="index" :value="index">{{ mode }}</option>
            </select> -->
            <ui-select id="id_type" v-model="_compData.type" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_SpriteType" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Trim:</label>
            <ui-checkbox id="id_trim" @change="onToggle" :value="_compData.trim"></ui-checkbox>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";
label {
    width: 105px;
    display: inline-block;
}

ui-select {
    width: 190px;
}
</style>
