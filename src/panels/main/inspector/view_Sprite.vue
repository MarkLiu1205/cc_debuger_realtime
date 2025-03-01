<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { _funcs } from '../../../tools/_funcs';
import comp_selecter_asset from '../components/comp_selecter_asset.vue';

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

// const _compData = reactive({
//     color: "#ffffff",
//     customMaterial: "d3c7820c-2a98-4429-8bc7-b8453bc9ac41",
//     grayscale: false,
//     sizeMode: _SizeMode.TRIMMED,
//     spriteAtlas: null,
//     spriteFrame: "adc844c5-3225-4d5c-88d5-caae62248f8b@f9941",
//     trim: true,
//     type: _SpriteType.SIMPLE,
//     enabled: true,
// });

const compModel = defineModel<CompInfo_Sprite>()

function onConfirmColor(event){
    const [r,g,b,a] = event.target.value
    
    compModel.value.color = _funcs.rgbaToHex(r,g,b,a)
    // console.log("r,g,b,a",r,g,b,a,compModel.value.color)
}

function onSelect(event){
    const eleId = event.target.id
    const sel = event.target.value
    if(eleId=="id_sizeMode"){
        compModel.value.sizeMode = sel
        // console.log("sizeMode changed to:", event.target.value,compModel.value.sizeMode)
    }else if(eleId=="id_type"){
        compModel.value.type = sel
        // console.log("Sprite type changed to:", event.target.value,compModel.value.type)
    }
    
}

function onSelect_SpriteType(event){
    // console.log("Sprite type changed to:", event.target.value,compModel.value.type)
}

function onToggle(event){
    const eleId = event.target.id 
    const bool = event.target.value
    if(eleId=="id_enable"){
        compModel.value.enabled = bool
    }else if(eleId=="id_grayscale"){
        compModel.value.grayscale = bool
    }else if(eleId=="id_trim"){
        compModel.value.trim = bool
    }
    
    // console.log("event.target.value",event.target.value,"id",event.target.id)
}

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enable" @change="onToggle" :value="compModel.enabled"></ui-checkbox>
            <h3>cc.Sprite</h3>
        </div>
        <div class="property">
            <label>CustomMaterial:</label>
            <comp_selecter_asset assetType="cc.Material"  v-model="compModel.customMaterial"/>
        </div>
        <div class="property">
            <label>Color:</label>
            <ui-color @confirm="onConfirmColor" :value="compModel.color"></ui-color>
        </div>
        <div class="property">
            <label>SpriteAtlas:</label>
            <comp_selecter_asset assetType="cc.SpriteAtlas"  v-model="compModel.spriteAtlas"/>
        </div>
        <div class="property">
            <label>SpriteFrame:</label>
            <comp_selecter_asset assetType="cc.SpriteFrame"  v-model="compModel.spriteFrame"/>
        </div>
        <div class="property">
            <label>Grayscale:</label>
            <ui-checkbox id="id_grayscale" @change="onToggle" :value="compModel.grayscale"></ui-checkbox>
        </div>
        <div class="property">
            <label>SizeMode:</label>
            <!-- <select v-model="compModel.sizeMode" @change="onSelect_SizeMode">
                <option v-for="(mode, index) in enumDesc_SizeMode" :key="index" :value="index">{{ mode }}</option>
            </select> -->
            <ui-select id="id_sizeMode" v-model="compModel.sizeMode" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_SizeMode" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        
        <div class="property">
            <label>Type:</label>
            <!-- <select v-model="compModel.type" @change="onSelect_SpriteType">
                <option v-for="(mode, index) in enumDesc_SpriteType" :key="index" :value="index">{{ mode }}</option>
            </select> -->
            <ui-select id="id_type" v-model="compModel.type" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_SpriteType" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Trim:</label>
            <ui-checkbox id="id_trim" @change="onToggle" :value="compModel.trim"></ui-checkbox>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";


</style>
