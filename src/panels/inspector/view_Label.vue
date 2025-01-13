<script setup lang="ts">
import { reactive } from 'vue';
import { _funcs } from '../../tools/_funcs';

enum Overflow {
    NONE = 0,
    CLAMP = 1,
    SHRINK = 2,
    RESIZE_HEIGHT = 3
}
enum CacheMode {
    NONE = 0,
    BITMAP = 1,
    CHAR = 2
}

const enumDesc_Overflow = [
    "NONE",
    "CLAMP",
    "SHRINK",
    "RESIZE_HEIGHT",
]

const enumDesc_CacheMode = [
    "NONE",
    "BITMAP",
    "CHAR",
]

const _compData = reactive({
    customMaterial: "d3c7820c-2a98-4429-8bc7-b8453bc9ac41",
    string:"hello label",
    fontFamily: "Arial",
    spacingX: 0,
    overflow: Overflow.NONE,
    cacheMode: CacheMode.NONE,

    enableWrapText: false,
    useSystemFont: true,
    font: null,
    lineHeight: 40,
    color: "#00000000",
    horizontalAlign: "CENTER",
    verticalAlign: "CENTER",
    fontSize: 40,
    underlineHeight:2,
    isUnderline: false,
    isBold: false,
    isItalic: false,

    enabled: true,
});

function onToggle(event){
    const eleId = event.target.id 
    const bool = event.target.value
    if(eleId=="id_enable"){
        _compData.enabled = bool
    }else if(eleId=="id_enableWrapText"){
        _compData.enableWrapText = bool
    }else if(eleId=="id_useSystemFont"){
        _compData.useSystemFont = bool
    }
    
    console.log("event.target.value",event.target.value,"id",event.target.id)
}

function onConfirmColor(arr){
    const [r,g,b,a] = arr
    
    _compData.color = _funcs.rgbaToHex(r,g,b,a)
    console.log("r,g,b,a",r,g,b,a,_compData.color)
}

function onTextChange(event){
    const eleId = event.target.id 
    const val = event.target.value
    if(eleId=="id_string"){
        _compData.string = val
    }else if(eleId=="id_fontFamily"){
        _compData.fontFamily = val
    }else if(eleId=="id_spacingX"){
        _compData.spacingX = val
    }else if(eleId=="id_underlineHeight"){
        _compData.underlineHeight = val
    }
    console.log("event",val,eleId)
}


function onTab(event){
    const eleId = event.target.id 
    const idx = event.target.value
    if(eleId=="id_h-align"){
        _compData.horizontalAlign = idx
    }else if(eleId=="id_v-align"){
        _compData.verticalAlign = idx
    }
    console.log("idx",idx)
}

function onNumChange(event){
    const num = event.target.value
    const eleId = event.target.id
    if(eleId=="id_fontSize"){
        _compData.fontSize = num
    }else if(eleId=="id_lineHeight"){
        _compData.lineHeight = num
    }
    console.log("num",num,eleId)
}

function onSelect(event){
    const eleId = event.target.id
    const sel = event.target.value
    if(eleId=="id_overFlow"){
        _compData.overflow = sel
        console.log("overflow changed to:", event.target.value,_compData.overflow)
    }else if(eleId=="id_cacheMode"){
        _compData.cacheMode = sel
        console.log("Sprite cacheMode changed to:", event.target.value,_compData.cacheMode)
    }
    
}

function onAssetChange(event){
    const eleId = event.target.id
    const sel = event.target.value
    if(eleId=="id_font"){
        _compData.font = sel
        console.log("font changed to:", event.target.value,_compData.font)
    }else if(eleId=="id_customMaterial"){
        _compData.customMaterial = sel
        console.log("customMaterial changed to:", event.target.value,_compData.customMaterial)
    }
}

function toggleBold() {
    _compData.isBold = !_compData.isBold
}
function toggleItalic() {
    _compData.isItalic = !_compData.isItalic
}
function toggleUnderline() {
    _compData.isUnderline = !_compData.isUnderline
}

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enable" @change="onToggle" :value="_compData.enabled"></ui-checkbox>
            <h3>cc.Label</h3>
        </div>
        <div class="property">
            <label>CustomMaterial:</label>
            <ui-asset @change="onAssetChange" droppable="cc.Material" id="id_customMaterial" :value="_compData.customMaterial"></ui-asset>
        </div>
        <div class="property">
            <label>Color:</label>
            <ui-color @confirm="onConfirmColor($event.target.value)" :value="_compData.color"></ui-color>
        </div>
        <div class="property">
            <label>String:</label>
            <ui-textarea @change="onTextChange" id="id_string" :value="_compData.string"></ui-textarea>
        </div>
        <div class="property">
            <label>H-Align:</label>
            <ui-tab @change="onTab" id="id_h-align" :value="_compData.horizontalAlign">
                <ui-button><ui-icon value="align-left"></ui-icon></ui-button>
                <ui-button><ui-icon value="align-h-center"></ui-icon></ui-button>
                <ui-button><ui-icon value="align-right"></ui-icon></ui-button>
            </ui-tab>
        </div>
        <div class="property">
            <label>V-Align:</label>
            <ui-tab @change="onTab" id="id_v-align" :value="_compData.verticalAlign">
                <ui-button><ui-icon value="align-top"></ui-icon></ui-button>
                <ui-button><ui-icon value="align-v-center"></ui-icon></ui-button>
                <ui-button><ui-icon value="align-top"></ui-icon></ui-button>
            </ui-tab>
        </div>
        <div class="property">
            <label>FontSize:</label>
            <div class="vector-input">
                <ui-num-input id="id_fontSize" @change="onNumChange" :value="_compData.fontSize"  step="0.1"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label>LineHeight:</label>
            <div class="vector-input">
                <ui-num-input id="id_lineHeight" @change="onNumChange" :value="_compData.lineHeight"  step="0.1"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label>OverFlow:</label>
            <ui-select id="id_overFlow" v-model="_compData.overflow" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_Overflow" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        
        <div class="property">
            <label>EnableWrapText:</label>
            <ui-checkbox id="id_enableWrapText" @change="onToggle" :value="_compData.enableWrapText"></ui-checkbox>
        </div>
        <div class="property">
            <label>UseSystemFont:</label>
            <ui-checkbox id="id_useSystemFont" @change="onToggle" :value="_compData.useSystemFont"></ui-checkbox>
        </div>
        <div class="property" v-if="!_compData.useSystemFont">
            <label>Font:</label>
            <ui-asset @change="onAssetChange" droppable="cc.Font" ref="id_font" :value="_compData.font"></ui-asset>
        </div>
        <div class="property" v-if="!_compData.useSystemFont">
            <label>SpacingX:</label>
            <ui-num-input id="id_spacingX" @change="onTextChange" :value="_compData.spacingX"></ui-num-input>
        </div>
        <div class="property" v-if="_compData.useSystemFont">
            <label>FontFamily:</label>
            <ui-input id="id_fontFamily" @change="onTextChange" :value="_compData.fontFamily"></ui-input>
        </div>
        <div class="property">
            <label>CacheMode:</label>
            <ui-select id="id_cacheMode" v-model="_compData.cacheMode" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_CacheMode" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>FontStyle:</label>
            <div class="font-style">
                <ui-button :class="{ bold: true, fontStyle_selected: _compData.isBold }" @click="toggleBold">B</ui-button>
                <ui-button :class="{ italic: true, fontStyle_selected: _compData.isItalic }" @click="toggleItalic">I</ui-button>
                <ui-button :class="{ underline: true, fontStyle_selected: _compData.isUnderline }" @click="toggleUnderline">U</ui-button>
            </div>
        </div>
        <div class="property" v-if="_compData.isUnderline">
            <label>UnderlineHeight:</label>
            <ui-num-input id="id_underlineHeight" @change="onTextChange" :value="_compData.underlineHeight"></ui-num-input>
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

ui-textarea {
    width: 190px;
}

ui-num-input {
    width: 190px;
}

.font-style {
    display: flex;
    flex-direction: row;
    gap: 10px;
}

.bold {
    font-weight: bold;
}

.italic {
    font-style: italic;
}

.underline {
    text-decoration: underline;
}

.fontStyle_selected {
    border: 1px dashed #ffffff;
    background-color: #2B2B2B; /* 选中状态的背景色 */
}
</style>
