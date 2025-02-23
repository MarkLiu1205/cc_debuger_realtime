<script setup lang="ts">
import { reactive } from 'vue';
import comp_selecter_asset from '../components/comp_selecter_asset.vue';

enum AnimationCacheMode {
    REALTIME = 0,
    SHARED_CACHE = 1,
    PRIVATE_CACHE = 2
}

const enumDesc_AnimationCacheMode = ["REALTIME", "SHARED_CACHE", "PRIVATE_CACHE"];

// const _compData = reactive({
//     enabled: true,
//     skeletonData: "",
//     _defaultSkinIndex: 0,
//     skinArr:["default"],
    
//     animationArr: ["animation"],
//     animation: 0,

//     loop: true,
//     timeScale: 1.0,
//     premultipliedAlpha: false,
//     useTint: false,
//     debugSlots: false,
//     debugBones: false,
//     debugMesh: false,
//     enableBatch: false,

//     defaultCacheMode:AnimationCacheMode.REALTIME,

// });

const compModel = defineModel<CompInfo_Skeleton>()

function onToggle(event) {
    const eleId = event.target.id;
    const bool = event.target.value;
    if (eleId === "id_loop") {
        compModel.value.loop = bool;
    } else if (eleId === "id_premultipliedAlpha") {
        compModel.value.premultipliedAlpha = bool;
    } else if (eleId === "id_useTint") {
        compModel.value.useTint = bool;
    } else if (eleId === "id_debugSlots") {
        compModel.value.debugSlots = bool;
    } else if (eleId === "id_debugBones") {
        compModel.value.debugBones = bool;
    } else if (eleId === "id_debugMesh") {
        compModel.value.debugMesh = bool;
    } else if (eleId === "id_enableBatch") {
        compModel.value.enableBatch = bool;
    }
}

function onNumChange(event) {
    const eleId = event.target.id;
    const num = parseFloat(event.target.value);
    if (eleId === "id_timeScale") {
        compModel.value.timeScale = num;
    }
}

function onSelect(event) {
    const eleId = event.target.id;
    const sel = event.target.value;
    if (eleId === "id_defaultCacheMode") {
        compModel.value.defaultCacheMode = parseInt(sel);
    } else if (eleId === "id_defaultSkin") {
        compModel.value._defaultSkinIndex = parseInt(sel);
    }  else if (eleId === "id_animation") {
        compModel.value.animation = sel
    } 
    console.log("eleId",eleId,"sel",sel)
}

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enabled" @change="onToggle" :value="compModel.enabled"></ui-checkbox>
            <h3>sp.Skeleton</h3>
        </div>
        <div class="property">
            <label>Skeleton Data:</label>
            <comp_selecter_asset assetType="cc.sp.SkeletonData"  v-model="compModel.skeletonData"/>
        </div>
        <div class="property">
            <label>Default Skin:</label>
            <ui-select id="id_defaultSkin" v-model="compModel._defaultSkinIndex" @change="onSelect">
                <option v-for="(mode, index) in compModel.skinArr" :key="mode" :value="index">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
        <div class="property">
            <label>Animation:</label>
            <ui-select id="id_animation" v-model="compModel.animation" @change="onSelect">
                <option v-for="(mode, index) in compModel.animationArr" :key="mode" :value="mode">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
        <div class="property">
            <label>Animation Cache Mode:</label>
            <ui-select id="id_defaultCacheMode" v-model="compModel.defaultCacheMode" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_AnimationCacheMode" :key="index" :value="index">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
        <div class="property">
            <label>Loop:</label>
            <ui-checkbox id="id_loop" @change="onToggle" :value="compModel.loop"></ui-checkbox>
        </div>
        <div class="property">
            <label :class="{long:true}">Premultiplied Alpha:</label>
            <ui-checkbox id="id_premultipliedAlpha" @change="onToggle" :value="compModel.premultipliedAlpha"></ui-checkbox>
        </div>
        <div class="property">
            <label>Time Scale:</label>
            <ui-num-input id="id_timeScale" :value="compModel.timeScale" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property">
            <label>Debug Slots:</label>
            <ui-checkbox id="id_debugSlots" @change="onToggle" :value="compModel.debugSlots"></ui-checkbox>
        </div>
        <div class="property">
            <label>Debug Bones:</label>
            <ui-checkbox id="id_debugBones" @change="onToggle" :value="compModel.debugBones"></ui-checkbox>
        </div>
        <div class="property">
            <label>Debug Mesh:</label>
            <ui-checkbox id="id_debugMesh" @change="onToggle" :value="compModel.debugMesh"></ui-checkbox>
        </div>
        <div class="property">
            <label>Use Tint:</label>
            <ui-checkbox id="id_useTint" @change="onToggle" :value="compModel.useTint"></ui-checkbox>
        </div>
        <div class="property">
            <label>Enable Batch:</label>
            <ui-checkbox id="id_enableBatch" @change="onToggle" :value="compModel.enableBatch"></ui-checkbox>
        </div>
        
    </div>
</template>

<style scoped>
@import "./inspector.css";


label.long {
    width: 120px;
}

</style>
