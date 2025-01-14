<script setup lang="ts">
import { reactive } from 'vue';

enum CacheMode {
    NONE = 0,
    BITMAP = 1,
    CHAR = 2
}

const enumDesc_CacheMode = [
    "NONE",
    "BITMAP",
    "CHAR",
]

const _compData = reactive({
    enabled: true,
    customMaterial: "",
    string: "",
    horizontalAlign: "CENTER",
    verticalAlign: "CENTER",
    fontSize: 40,
    font: null,
    lineHeight: 40,
    maxWidth: 0,
    imageAtlas: "",
    handleTouchEvent: false,
    color: "#000000FF",
    useSystemFont: true,
    fontFamily: "Arial",
    cacheMode: CacheMode.NONE,
});

function onToggle(event) {
    const eleId = event.target.id;
    const value = event.target.value;
    if (eleId === "id_handleTouchEvent") {
        _compData.handleTouchEvent = value;
    } else if (eleId === "id_useSystemFont") {
        _compData.useSystemFont = value;
    }
}

function onInputChange(event) {
    const eleId = event.target.id;
    const value = event.target.value;
    if (eleId === "id_string") {
        _compData.string = value;
    }else if (eleId === "id_fontFamily") {
        _compData.fontFamily = value;
    }
}

function onAssetChange(event){
    const eleId = event.target.id
    const sel = event.target.value
    if(eleId=="id_font"){
        _compData.font = sel
        console.log("font changed to:", event.target.value,_compData.font)
    }else if (eleId === "id_imageAtlas") {
        _compData.imageAtlas = sel;
    } 
}

function onAlignChange(event) {
    const eleId = event.target.id;
    const value = event.target.value;
    if (eleId === "id_h-align") {
        _compData.horizontalAlign = value;
    } else if (eleId === "id_v-align") {
        _compData.verticalAlign = value;
    }
}

function onNumChange(event) {
    const eleId = event.target.id;
    const value = parseFloat(event.target.value);
    if (eleId === "id_fontSize") {
        _compData.fontSize = value;
    } else if (eleId === "id_lineHeight") {
        _compData.lineHeight = value;
    } else if (eleId === "id_maxWidth") {
        _compData.maxWidth = value;
    }
}

function onSelect(event){
    const eleId = event.target.id
    const sel = event.target.value
    if(eleId=="id_cacheMode"){
        _compData.cacheMode = sel
        console.log("Sprite cacheMode changed to:", event.target.value,_compData.cacheMode)
    }
    
}
</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enabled" @change="onToggle" :value="_compData.enabled"></ui-checkbox>
            <h3>cc.RichText</h3>
        </div>
        <div class="property">
            <label>Custom Material:</label>
            <ui-asset id="id_customMaterial" droppable="cc.Material" :value="_compData.customMaterial" @change="onAssetChange"></ui-asset>
        </div>
        <div class="property">
            <label>String:</label>
            <ui-textarea id="id_string" :value="_compData.string" @change="onInputChange"></ui-textarea>
        </div>
        <div class="property">
            <label>Horizontal Align:</label>
            <ui-tab id="id_h-align" :value="_compData.horizontalAlign" @change="onAlignChange">
                <ui-button value="LEFT"><ui-icon value="align-left"></ui-icon></ui-button>
                <ui-button value="CENTER"><ui-icon value="align-h-center"></ui-icon></ui-button>
                <ui-button value="RIGHT"><ui-icon value="align-right"></ui-icon></ui-button>
            </ui-tab>
        </div>
        <div class="property">
            <label>Vertical Align:</label>
            <ui-tab id="id_v-align" :value="_compData.verticalAlign" @change="onAlignChange">
                <ui-button value="TOP"><ui-icon value="align-top"></ui-icon></ui-button>
                <ui-button value="CENTER"><ui-icon value="align-v-center"></ui-icon></ui-button>
                <ui-button value="BOTTOM"><ui-icon value="align-bottom"></ui-icon></ui-button>
            </ui-tab>
        </div>
        <div class="property">
            <label>Font Size:</label>
            <ui-num-input id="id_fontSize" :value="_compData.fontSize" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property">
            <label>Use System Font:</label>
            <ui-checkbox id="id_useSystemFont" @change="onToggle" :value="_compData.useSystemFont"></ui-checkbox>
        </div>
        <div class="property" v-if="!_compData.useSystemFont">
            <label>Font:</label>
            <ui-asset @change="onAssetChange" droppable="cc.Font" ref="id_font" :value="_compData.font"></ui-asset>
        </div>
        <div class="property" v-if="_compData.useSystemFont">
            <label>Font Family:</label>
            <ui-input id="id_fontFamily" @change="onInputChange" :value="_compData.fontFamily"></ui-input>
        </div>
        <div class="property">
            <label>Cache Mode:</label>
            <ui-select id="id_cacheMode" v-model="_compData.cacheMode" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_CacheMode" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Line Height:</label>
            <ui-num-input id="id_lineHeight" :value="_compData.lineHeight" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property">
            <label>Max Width:</label>
            <ui-num-input id="id_maxWidth" :value="_compData.maxWidth" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property">
            <label>Image Atlas:</label>
            <ui-asset id="id_imageAtlas" droppable="cc.SpriteAtlas" :value="_compData.imageAtlas" @change="onAssetChange"></ui-asset>
        </div>
        <div class="property">
            <label>Handle Touch Event:</label>
            <ui-checkbox id="id_handleTouchEvent" @change="onToggle" :value="_compData.handleTouchEvent"></ui-checkbox>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";

label {
    width: 105px;
}

ui-textarea {
    width: 190px;
}

ui-num-input {
    width: 190px;
}


</style>
