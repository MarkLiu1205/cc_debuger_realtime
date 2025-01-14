<script setup lang="ts">
import { reactive } from 'vue';

enum AnimationCacheMode {
    REALTIME = 0,
    SHARED_CACHE = 1,
    PRIVATE_CACHE = 2
}

const enumDesc_AnimationCacheMode = ["REALTIME", "SHARED_CACHE", "PRIVATE_CACHE"];

const _compData = reactive({
    enabled: true,
    skeletonData: "",
    defaultSkin: "default",
    skinArr:["default"],
    
    animationArr: ["animation"],
    animation: "animation",

    loop: true,
    timeScale: 1.0,
    premultipliedAlpha: false,
    useTint: false,
    debugSlots: false,
    debugBones: false,
    debugMesh: false,
    enableBatch: false,

    animationCacheMode:AnimationCacheMode.REALTIME,

});

function onToggle(event) {
    const eleId = event.target.id;
    const bool = event.target.value;
    if (eleId === "id_loop") {
        _compData.loop = bool;
    } else if (eleId === "id_premultipliedAlpha") {
        _compData.premultipliedAlpha = bool;
    } else if (eleId === "id_useTint") {
        _compData.useTint = bool;
    } else if (eleId === "id_debugSlots") {
        _compData.debugSlots = bool;
    } else if (eleId === "id_debugBones") {
        _compData.debugBones = bool;
    } else if (eleId === "id_debugMesh") {
        _compData.debugMesh = bool;
    } else if (eleId === "id_enableBatch") {
        _compData.enableBatch = bool;
    }
}

function onInput(event) {
    const eleId = event.target.id;
    const value = event.target.value;
    if (eleId === "id_skeletonData") {
        _compData.skeletonData = value;
    } else if (eleId === "id_defaultSkin") {
        _compData.defaultSkin = value;
    } else if (eleId === "id_animation") {
        _compData.animation = value;
    }
}

function onNumChange(event) {
    const eleId = event.target.id;
    const num = parseFloat(event.target.value);
    if (eleId === "id_timeScale") {
        _compData.timeScale = num;
    }
}

function onSelect(event) {
    const eleId = event.target.id;
    const sel = event.target.value;
    if (eleId === "id_animationCacheMode") {
        _compData.animationCacheMode = sel;
    } else if (eleId === "id_defaultSkin") {
        _compData.defaultSkin = sel;
    }  else if (eleId === "id_animation") {
        _compData.animation = sel;
    } 
    console.log("eleId",eleId,"sel",sel)
}

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enabled" @change="onToggle" :value="_compData.enabled"></ui-checkbox>
            <h3>sp.Skeleton</h3>
        </div>
        <div class="property">
            <label>Skeleton Data:</label>
            <ui-asset id="id_skeletonData" type="sp.SkeletonData" :value="_compData.skeletonData" @change="onInput"></ui-asset>
        </div>
        <div class="property">
            <label>Animation:</label>
            <ui-select id="id_defaultSkin" v-model="_compData.defaultSkin" @change="onSelect">
                <option v-for="(mode, index) in _compData.skinArr" :key="mode" :value="mode">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
        <div class="property">
            <label>Animation:</label>
            <ui-select id="id_animation" v-model="_compData.animation" @change="onSelect">
                <option v-for="(mode, index) in _compData.animationArr" :key="mode" :value="mode">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
        <div class="property">
            <label>Animation Cache Mode:</label>
            <ui-select id="id_animationCacheMode" v-model="_compData.animationCacheMode" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_AnimationCacheMode" :key="index" :value="index">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
        <div class="property">
            <label>Loop:</label>
            <ui-checkbox id="id_loop" @change="onToggle" :value="_compData.loop"></ui-checkbox>
        </div>
        <div class="property">
            <label :class="{long:true}">Premultiplied Alpha:</label>
            <ui-checkbox id="id_premultipliedAlpha" @change="onToggle" :value="_compData.premultipliedAlpha"></ui-checkbox>
        </div>
        <div class="property">
            <label>Time Scale:</label>
            <ui-num-input id="id_timeScale" :value="_compData.timeScale" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property">
            <label>Debug Slots:</label>
            <ui-checkbox id="id_debugSlots" @change="onToggle" :value="_compData.debugSlots"></ui-checkbox>
        </div>
        <div class="property">
            <label>Debug Bones:</label>
            <ui-checkbox id="id_debugBones" @change="onToggle" :value="_compData.debugBones"></ui-checkbox>
        </div>
        <div class="property">
            <label>Debug Mesh:</label>
            <ui-checkbox id="id_debugMesh" @change="onToggle" :value="_compData.debugMesh"></ui-checkbox>
        </div>
        <div class="property">
            <label>Use Tint:</label>
            <ui-checkbox id="id_useTint" @change="onToggle" :value="_compData.useTint"></ui-checkbox>
        </div>
        <div class="property">
            <label>Enable Batch:</label>
            <ui-checkbox id="id_enableBatch" @change="onToggle" :value="_compData.enableBatch"></ui-checkbox>
        </div>
        
    </div>
</template>

<style scoped>
@import "./inspector.css";

label {
    width: 105px;
}

label.long {
    width: 120px;
}

ui-num-input,
ui-select {
    width: 190px;
}

</style>
