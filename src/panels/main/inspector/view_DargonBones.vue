<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { _funcs } from '../../../tools/_funcs';
import comp_selecter_asset from '../components/comp_selecter_asset.vue';

const enumDesc_AnimationCacheMode = ["REALTIME", "SHARED_CACHE", "PRIVATE_CACHE"];

const compModel = defineModel<any>()

function onConfirmColor(event){
    const [r,g,b,a] = event.target.value
    
    compModel.value.color = _funcs.rgbaToHex(r,g,b,a)
}

function onToggle(event){
    const eleId = event.target.id 
    const bool = event.target.value
    if(eleId=="id_enable"){
        compModel.value.enabled = bool
    }else if(eleId=="id_debugBones"){
        compModel.value.debugBones = bool
    }else if(eleId=="id_premultipliedAlpha"){
        compModel.value.premultipliedAlpha = bool
    }else if(eleId=="id_enableBatch"){
        compModel.value.enableBatch = bool
    }
    
}

function onNumChange(event){
    const num = event.target.value
    const eleId = event.target.id
    if(eleId=="id_timeScale"){
        compModel.value.timeScale = num
    }else if(eleId=="id_playTimes"){
        compModel.value.playTimes = num
    }
    // console.log("num",num,eleId)
}

function onSelect(event) {
    const eleId = event.target.id;
    const sel = event.target.value;
    if (eleId === "id_defaultCacheMode") {
        compModel.value.defaultCacheMode = parseInt(sel);
    }  else if (eleId === "id_animationIndex") {
        compModel.value._animationIndex = sel
    } 
    // console.log("eleId",eleId,"sel",sel)
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
            <label>Dragon Asset:</label>
            <comp_selecter_asset assetType="dragonBones.DragonBonesAsset"  v-model="compModel.dragonAsset"/>
        </div>

        <div class="property">
            <label>Dragon Atlas Asset:</label>
            <comp_selecter_asset assetType="dragonBones.DragonBonesAtlasAsset"  v-model="compModel.dragonAtlasAsset"/>
        </div>

        <div class="property">
            <label>Animation:</label>
            <ui-select id="id_animationIndex" v-model="compModel._animationIndex" @change="onSelect">
                <option v-for="(mode, index) in compModel.animationArr" :key="index" :value="index">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
        <!-- <div class="property">
            <label>Animation Cache Mode:</label>
            <ui-select id="id_defaultCacheMode" v-model="compModel.defaultCacheMode" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_AnimationCacheMode" :key="index" :value="index">
                    {{ mode }}
                </option>
            </ui-select>
        </div> -->

        <div class="property">
            <label>Time Scale:</label>
            <ui-num-input id="id_timeScale" @change="onNumChange" :value="compModel.timeScale"  step="0.1"></ui-num-input>
        </div>
        <div class="property">
            <label>Play Times:</label>
            <ui-num-input id="id_playTimes" @change="onNumChange" :value="compModel.playTimes"  step="0.1"></ui-num-input>
        </div>
        
        <div class="property">
            <label>Debug Bones:</label>
            <ui-checkbox id="id_debugBones" @change="onToggle" :value="compModel.debugBones"></ui-checkbox>
        </div>
        <div class="property">
            <label>Premultiplied Alpha:</label>
            <ui-checkbox id="id_premultipliedAlpha" @change="onToggle" :value="compModel.premultipliedAlpha"></ui-checkbox>
        </div>
        <div class="property">
            <label>Enable Batch:</label>
            <ui-checkbox id="id_enableBatch" @change="onToggle" :value="compModel.enableBatch"></ui-checkbox>
        </div>
        
    </div>
</template>

<style scoped>
@import "./inspector.css";


</style>
