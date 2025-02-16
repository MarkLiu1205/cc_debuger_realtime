<script setup lang="ts">
import { reactive } from 'vue';
import comp_selecter_asset from '../components/comp_selecter_asset.vue';

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

// const _compData = reactive({
//     enabled: true,
//     customMaterial: "",
//     string: "",
//     horizontalAlign: "CENTER",
//     verticalAlign: "CENTER",
//     fontSize: 40,
//     font: null,
//     lineHeight: 40,
//     maxWidth: 0,
//     imageAtlas: "",
//     handleTouchEvent: false,
//     color: "#000000FF",
//     useSystemFont: true,
//     fontFamily: "Arial",
//     cacheMode: CacheMode.NONE,
// });

const compModel = defineModel<CompInfo_RichText>()

function onToggle(event) {
    const eleId = event.target.id;
    const value = event.target.value;
    if (eleId === "id_handleTouchEvent") {
        compModel.value.handleTouchEvent = value;
    } else if (eleId === "id_useSystemFont") {
        compModel.value.useSystemFont = value;
    }
}

function onInputChange(event) {
    const eleId = event.target.id;
    const value = event.target.value;
    if (eleId === "id_string") {
        compModel.value.string = value;
    }else if (eleId === "id_fontFamily") {
        compModel.value.fontFamily = value;
    }
}

function onAlignChange(event) {
    const eleId = event.target.id;
    const value = event.target.value;
    if (eleId === "id_h-align") {
        compModel.value.horizontalAlign = value;
    } else if (eleId === "id_v-align") {
        compModel.value.verticalAlign = value;
    }
}

function onNumChange(event) {
    const eleId = event.target.id;
    const value = parseFloat(event.target.value);
    if (eleId === "id_fontSize") {
        compModel.value.fontSize = value;
    } else if (eleId === "id_lineHeight") {
        compModel.value.lineHeight = value;
    } else if (eleId === "id_maxWidth") {
        compModel.value.maxWidth = value;
    }
}

function onSelect(event){
    const eleId = event.target.id
    const sel = event.target.value
    if(eleId=="id_cacheMode"){
        compModel.value.cacheMode = sel
        console.log("Sprite cacheMode changed to:", event.target.value,compModel.value.cacheMode)
    }
    
}
</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enabled" @change="onToggle" :value="compModel.enabled"></ui-checkbox>
            <h3>cc.RichText</h3>
        </div>
        <div class="property">
            <label>String:</label>
            <ui-textarea id="id_string" :value="compModel.string" @change="onInputChange"></ui-textarea>
        </div>
        <div class="property">
            <label>Horizontal Align:</label>
            <ui-tab id="id_h-align" :value="compModel.horizontalAlign" @change="onAlignChange">
                <ui-button value="LEFT"><ui-icon value="align-left"></ui-icon></ui-button>
                <ui-button value="CENTER"><ui-icon value="align-h-center"></ui-icon></ui-button>
                <ui-button value="RIGHT"><ui-icon value="align-right"></ui-icon></ui-button>
            </ui-tab>
        </div>
        <div class="property">
            <label>Vertical Align:</label>
            <ui-tab id="id_v-align" :value="compModel.verticalAlign" @change="onAlignChange">
                <ui-button value="TOP"><ui-icon value="align-top"></ui-icon></ui-button>
                <ui-button value="CENTER"><ui-icon value="align-v-center"></ui-icon></ui-button>
                <ui-button value="BOTTOM"><ui-icon value="align-bottom"></ui-icon></ui-button>
            </ui-tab>
        </div>
        <div class="property">
            <label>Font Size:</label>
            <ui-num-input id="id_fontSize" :value="compModel.fontSize" @change="onNumChange" min="1"></ui-num-input>
        </div>
        <div class="property">
            <label>Use System Font:</label>
            <ui-checkbox id="id_useSystemFont" @change="onToggle" :value="compModel.useSystemFont"></ui-checkbox>
        </div>
        <div class="property" v-if="!compModel.useSystemFont">
            <label>Font:</label>
            <comp_selecter_asset assetType="cc.Font"  v-model="compModel.font"/>
        </div>
        <div class="property" v-if="compModel.useSystemFont">
            <label>Font Family:</label>
            <ui-input id="id_fontFamily" @change="onInputChange" :value="compModel.fontFamily"></ui-input>
        </div>
        <div class="property">
            <label>Cache Mode:</label>
            <ui-select id="id_cacheMode" v-model="compModel.cacheMode" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_CacheMode" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Line Height:</label>
            <ui-num-input id="id_lineHeight" :value="compModel.lineHeight" @change="onNumChange"  min="1"></ui-num-input>
        </div>
        <div class="property">
            <label>Max Width:</label>
            <ui-num-input id="id_maxWidth" :value="compModel.maxWidth" @change="onNumChange"  min="1"></ui-num-input>
        </div>
        <div class="property">
            <label>Image Atlas:</label>
            <comp_selecter_asset assetType="cc.SpriteAtlas"  v-model="compModel.imageAtlas"/>
        </div>
        <div class="property">
            <label>Handle Touch Event:</label>
            <ui-checkbox id="id_handleTouchEvent" @change="onToggle" :value="compModel.handleTouchEvent"></ui-checkbox>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";

</style>
