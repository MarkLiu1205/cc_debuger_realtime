<script setup lang="ts">
import { reactive } from 'vue';
import { _funcs } from '../../../tools/_funcs';
import comp_selecter_asset from '../components/comp_selecter_asset.vue';

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

// const _compData = reactive({
//     customMaterial: "d3c7820c-2a98-4429-8bc7-b8453bc9ac41",
//     string:"hello label",
//     fontFamily: "Arial",
//     spacingX: 0,
//     overflow: Overflow.NONE,
//     cacheMode: CacheMode.NONE,

//     enableWrapText: false,
//     useSystemFont: true,
//     font: null,
//     lineHeight: 40,
//     color: "#00000000",
//     horizontalAlign: "CENTER",
//     verticalAlign: "CENTER",
//     fontSize: 40,
//     underlineHeight:2,
//     isUnderline: false,
//     isBold: false,
//     isItalic: false,

//     enabled: true,
// });

const compModel = defineModel<CompInfo_Label>()

function onToggle(event){
    const eleId = event.target.id 
    const bool = event.target.value
    if(eleId=="id_enable"){
        compModel.value.enabled = bool
    }else if(eleId=="id_enableWrapText"){
        compModel.value.enableWrapText = bool
    }else if(eleId=="id_useSystemFont"){
        compModel.value.useSystemFont = bool
    }
    
    // console.log("event.target.value",event.target.value,"id",event.target.id)
}

function onConfirmColor(arr){
    const [r,g,b,a] = arr
    
    compModel.value.color = _funcs.rgbaToHex(r,g,b,a)
    // console.log("r,g,b,a",r,g,b,a,compModel.value.color)
}

function onTextChange(event){
    const eleId = event.target.id 
    const val = event.target.value
    if(eleId=="id_string"){
        compModel.value.string = val
    }else if(eleId=="id_fontFamily"){
        compModel.value.fontFamily = val
    }else if(eleId=="id_spacingX"){
        compModel.value.spacingX = val
    }else if(eleId=="id_underlineHeight"){
        compModel.value.underlineHeight = val
    }
    // console.log("event",val,eleId)
}


function onTab(event){
    const eleId = event.target.id 
    const idx = event.target.value
    if(eleId=="id_h-align"){
        compModel.value.horizontalAlign = idx
    }else if(eleId=="id_v-align"){
        compModel.value.verticalAlign = idx
    }
    // console.log("idx",idx)
}

function onNumChange(event){
    const num = event.target.value
    const eleId = event.target.id
    if(eleId=="id_fontSize"){
        compModel.value.fontSize = num
    }else if(eleId=="id_lineHeight"){
        compModel.value.lineHeight = num
    }
    // console.log("num",num,eleId)
}

function onSelect(event){
    const eleId = event.target.id
    const sel = event.target.value
    if(eleId=="id_overFlow"){
        compModel.value.overflow = sel
        // console.log("overflow changed to:", event.target.value,compModel.value.overflow)
    }else if(eleId=="id_cacheMode"){
        compModel.value.cacheMode = sel
        // console.log("Sprite cacheMode changed to:", event.target.value,compModel.value.cacheMode)
    }
    
}

function toggleBold() {
    compModel.value.isBold = !compModel.value.isBold
}
function toggleItalic() {
    compModel.value.isItalic = !compModel.value.isItalic
}
function toggleUnderline() {
    compModel.value.isUnderline = !compModel.value.isUnderline
}

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enable" @change="onToggle" :value="compModel.enabled"></ui-checkbox>
            <h3>cc.Label</h3>
        </div>
        <div class="property">
            <label>CustomMaterial:</label>
            <comp_selecter_asset assetType="cc.Material"  v-model="compModel.customMaterial"/>
        </div>
        <div class="property">
            <label>Color:</label>
            <ui-color @confirm="onConfirmColor($event.target.value)" :value="compModel.color"></ui-color>
        </div>
        <div class="property">
            <label>String:</label>
            <ui-textarea @change="onTextChange" id="id_string" :value="compModel.string"></ui-textarea>
        </div>
        <div class="property">
            <label>H-Align:</label>
            <ui-tab @change="onTab" id="id_h-align" :value="compModel.horizontalAlign">
                <ui-button><ui-icon value="align-left"></ui-icon></ui-button>
                <ui-button><ui-icon value="align-h-center"></ui-icon></ui-button>
                <ui-button><ui-icon value="align-right"></ui-icon></ui-button>
            </ui-tab>
        </div>
        <div class="property">
            <label>V-Align:</label>
            <ui-tab @change="onTab" id="id_v-align" :value="compModel.verticalAlign">
                <ui-button><ui-icon value="align-top"></ui-icon></ui-button>
                <ui-button><ui-icon value="align-v-center"></ui-icon></ui-button>
                <ui-button><ui-icon value="align-top"></ui-icon></ui-button>
            </ui-tab>
        </div>
        <div class="property">
            <label>FontSize:</label>
            <ui-num-input id="id_fontSize" @change="onNumChange" :value="compModel.fontSize"  step="0.1"></ui-num-input>
        </div>
        <div class="property">
            <label>LineHeight:</label>
            <ui-num-input id="id_lineHeight" @change="onNumChange" :value="compModel.lineHeight"  step="0.1"></ui-num-input>
        </div>
        <div class="property">
            <label>OverFlow:</label>
            <ui-select id="id_overFlow" v-model="compModel.overflow" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_Overflow" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        
        <div class="property">
            <label>EnableWrapText:</label>
            <ui-checkbox id="id_enableWrapText" @change="onToggle" :value="compModel.enableWrapText"></ui-checkbox>
        </div>
        <div class="property">
            <label>UseSystemFont:</label>
            <ui-checkbox id="id_useSystemFont" @change="onToggle" :value="compModel.useSystemFont"></ui-checkbox>
        </div>
        <div class="property" v-if="!compModel.useSystemFont">
            <label>Font:</label>
            <comp_selecter_asset assetType="cc.Font"  v-model="compModel.font"/>
        </div>
        <div class="property" v-if="!compModel.useSystemFont">
            <label>SpacingX:</label>
            <ui-num-input id="id_spacingX" @change="onTextChange" :value="compModel.spacingX"></ui-num-input>
        </div>
        <div class="property" v-if="compModel.useSystemFont">
            <label>FontFamily:</label>
            <ui-input id="id_fontFamily" @change="onTextChange" :value="compModel.fontFamily"></ui-input>
        </div>
        <div class="property">
            <label>CacheMode:</label>
            <ui-select id="id_cacheMode" v-model="compModel.cacheMode" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_CacheMode" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>FontStyle:</label>
            <div class="font-style">
                <ui-button :class="{ bold: true, fontStyle_selected: compModel.isBold }" @click="toggleBold">B</ui-button>
                <ui-button :class="{ italic: true, fontStyle_selected: compModel.isItalic }" @click="toggleItalic">I</ui-button>
                <ui-button :class="{ underline: true, fontStyle_selected: compModel.isUnderline }" @click="toggleUnderline">U</ui-button>
            </div>
        </div>
        <div class="property" v-if="compModel.isUnderline">
            <label>UnderlineHeight:</label>
            <ui-num-input id="id_underlineHeight" @change="onTextChange" :value="compModel.underlineHeight"></ui-num-input>
        </div>
        
    </div>
</template>

<style scoped>
@import "./inspector.css";

label.long {
    width: 120px;
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
