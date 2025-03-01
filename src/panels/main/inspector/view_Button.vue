<script setup lang="ts">
import { reactive } from 'vue';
import { _funcs } from '../../../tools/_funcs';
import comp_node_selecter from '../components/comp_node_selecter.vue';
import comp_selecter_asset from '../components/comp_selecter_asset.vue';

enum Transition {
    NONE = 0,
    COLOR = 1,
    SPRITE = 2,
    SCALE = 3
}

const enumDesc_Transition = [
    "NONE",
    "COLOR",
    "SPRITE",
    "SCALE",
]

// const _compData = reactive({
//     enabled: true,
//     target: "23YkqLCLFOUKH0zc4HKSo/",
//     clickEvents: ["$EventHandler"],
//     transition: Transition.SCALE,
//     duration: 0.1,
//     interactable: true,
//     zoomScale: 1.2,

//     normalColor:"#ffffffff",
//     pressedColor:"#ffffffff",
//     hoverColor:"#ffffffff",
//     disabledColor:"#ffffffff",

//     normalSprite:"",
//     pressedSprite:"",
//     hoverSprite:"",
//     disabledSprite:"",
// });

const compModel = defineModel<CompInfo_Button>()

function onToggle(event){
    const eleId = event.target.id 
    const bool = event.target.value
    if(eleId=="id_enable"){
        compModel.value.enabled = bool
    }else if(eleId=="id_interactable"){
        compModel.value.interactable = bool
    }
    
    // console.log("event.target.value",event.target.value,"id",event.target.id)
}

function onSelect(event){
    const eleId = event.target.id
    const sel = event.target.value
    if(eleId=="id_transition"){
        compModel.value.transition = sel
        // console.log("transition changed to:", event.target.value,compModel.value.transition)
    }
    
}

function onNumChange(event){
    const num = event.target.value
    const eleId = event.target.id
    if(eleId=="id_zoomScale"){
        compModel.value.zoomScale = num
    }else if(eleId=="id_duration"){
        compModel.value.duration = num
    }
    // console.log("num",num,eleId)
}

function onConfirmColor(event){
    const [r,g,b,a] = event.target.value
    const hex = _funcs.rgbaToHex(r,g,b,a)
    const eleId = event.target.id
    if(eleId=="id_normalColor"){
        compModel.value.normalColor = hex
    }else if(eleId=="id_pressedColor"){
        compModel.value.pressedColor = hex
    }else if(eleId=="id_hoverColor"){
        compModel.value.hoverColor = hex
    }else if(eleId=="id_disabledColor"){
        compModel.value.disabledColor = hex
    }
    // console.log("hex",hex,eleId)
}

//已经自动绑定了，不需要赋值
function onNodeChange(event){
    // console.log("onNodeChange",event,compModel.value.target)
}

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enable" @change="onToggle" :value="compModel.enabled"></ui-checkbox>
            <h3>cc.Button</h3>
        </div>
        <div class="property">
            <label>target:</label>
            <comp_node_selecter class="comp_node_selecter" v-model="compModel.target" @change="onNodeChange"/>
        </div>
        <div class="property">
            <label >Interactable:</label>
            <ui-checkbox id="id_interactable" @change="onToggle" :value="compModel.interactable"></ui-checkbox>
        </div>
        <div class="property">
            <label>Transition:</label>
            <ui-select id="id_transition" v-model="compModel.transition" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_Transition" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property" v-if="compModel.transition==Transition.SCALE">
            <label>ZoomScale:</label>
            <ui-num-input id="id_zoomScale" @change="onNumChange" :value="compModel.zoomScale"  step="0.1"></ui-num-input>
        </div>
        <div class="property" v-if="compModel.transition==Transition.SCALE">
            <label>Duration:</label>
            <ui-num-input id="id_duration" @change="onNumChange" :value="compModel.duration"  min="0" step="0.1"></ui-num-input>
        </div>
        <div class="property" v-if="compModel.transition==Transition.COLOR">
            <label>NormalColor:</label>
            <ui-color @confirm="onConfirmColor" id="id_normalColor" :value="compModel.normalColor"></ui-color>
        </div>
        <div class="property" v-if="compModel.transition==Transition.COLOR">
            <label>PressedColor:</label>
            <ui-color @confirm="onConfirmColor" id="id_pressedColor" :value="compModel.pressedColor"></ui-color>
        </div>
        <div class="property" v-if="compModel.transition==Transition.COLOR">
            <label>HoverColor:</label>
            <ui-color @confirm="onConfirmColor" id="id_hoverColor" :value="compModel.hoverColor"></ui-color>
        </div>
        <div class="property" v-if="compModel.transition==Transition.COLOR">
            <label>DisabledColor:</label>
            <ui-color @confirm="onConfirmColor" id="id_disabledColor" :value="compModel.disabledColor"></ui-color>
        </div>

        <div class="property" v-if="compModel.transition==Transition.SPRITE">
            <label>NormalSprite:</label>
            <comp_selecter_asset assetType="cc.SpriteFrame"  v-model="compModel.normalSprite"/>
        </div>
        <div class="property" v-if="compModel.transition==Transition.SPRITE">
            <label>PressedSprite:</label>
            <comp_selecter_asset assetType="cc.SpriteFrame"  v-model="compModel.pressedSprite"/>
        </div>
        <div class="property" v-if="compModel.transition==Transition.SPRITE">
            <label>HoverSprite:</label>
            <comp_selecter_asset assetType="cc.SpriteFrame"  v-model="compModel.hoverSprite"/>
        </div>
        <div class="property" v-if="compModel.transition==Transition.SPRITE">
            <label>DisabledSprite:</label>
            <comp_selecter_asset assetType="cc.SpriteFrame"  v-model="compModel.disabledSprite"/>
        </div>
        
    </div>
</template>

<style scoped>
@import "./inspector.css";

</style>
