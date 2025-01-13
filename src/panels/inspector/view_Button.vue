<script setup lang="ts">
import { reactive } from 'vue';
import { _funcs } from '../../tools/_funcs';

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

const _compData = reactive({
    enabled: true,
    target: "23YkqLCLFOUKH0zc4HKSo/",
    clickEvents: ["$EventHandler"],
    transition: Transition.SCALE,
    duration: 0.1,
    interactable: true,
    zoomScale: 1.2,

    normalColor:"#ffffffff",
    pressedColor:"#ffffffff",
    hoverColor:"#ffffffff",
    disabledColor:"#ffffffff",

    normalSprite:"",
    pressedSprite:"",
    hoverSprite:"",
    disabledSprite:"",
});

function onToggle(event){
    const eleId = event.target.id 
    const bool = event.target.value
    if(eleId=="id_enable"){
        _compData.enabled = bool
    }else if(eleId=="id_interactable"){
        _compData.interactable = bool
    }
    
    console.log("event.target.value",event.target.value,"id",event.target.id)
}

function onSelect(event){
    const eleId = event.target.id
    const sel = event.target.value
    if(eleId=="id_transition"){
        _compData.transition = sel
        console.log("transition changed to:", event.target.value,_compData.transition)
    }
    
}

function onNumChange(event){
    const num = event.target.value
    const eleId = event.target.id
    if(eleId=="id_zoomScale"){
        _compData.zoomScale = num
    }else if(eleId=="id_duration"){
        _compData.duration = num
    }
    console.log("num",num,eleId)
}

function onConfirmColor(event){
    const [r,g,b,a] = event.target.value
    const hex = _funcs.rgbaToHex(r,g,b,a)
    const eleId = event.target.id
    if(eleId=="id_normalColor"){
        _compData.normalColor = hex
    }else if(eleId=="id_pressedColor"){
        _compData.pressedColor = hex
    }else if(eleId=="id_hoverColor"){
        _compData.hoverColor = hex
    }else if(eleId=="id_disabledColor"){
        _compData.disabledColor = hex
    }
    console.log("hex",hex,eleId)
}

function onAssetChange(event){
    const eleId = event.target.id
    const uuid = event.target.value
    if(eleId=="id_normalSprite"){
        _compData.normalSprite = uuid
        console.log("normalSprite changed to:", event.target.value,_compData.normalSprite)
    }else if(eleId=="id_pressedSprite"){
        _compData.pressedSprite = uuid
        console.log("pressedSprite changed to:", event.target.value,_compData.pressedSprite)
    }else if(eleId=="id_hoverSprite"){
        _compData.hoverSprite = uuid
        console.log("hoverSprite changed to:", event.target.value,_compData.hoverSprite)
    }else if(eleId=="id_disabledSprite"){
        _compData.disabledSprite = uuid
        console.log("disabledSprite changed to:", event.target.value,_compData.disabledSprite)
    }
}

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enable" @change="onToggle" :value="_compData.enabled"></ui-checkbox>
            <h3>cc.Button</h3>
        </div>
        <div class="property">
            <label>target:</label>
            <ui-node disabled="true" droppable="cc.Node"  :value="_compData.target"></ui-node>
        </div>
        <div class="property">
            <label >Interactable:</label>
            <ui-checkbox id="id_interactable" @change="onToggle" :value="_compData.interactable"></ui-checkbox>
        </div>
        <div class="property">
            <label>Transition:</label>
            <ui-select id="id_transition" v-model="_compData.transition" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_Transition" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property" v-if="_compData.transition==Transition.SCALE">
            <label>ZoomScale:</label>
            <div class="vector-input">
                <ui-num-input id="id_zoomScale" @change="onNumChange" :value="_compData.zoomScale"  step="0.1"></ui-num-input>
            </div>
        </div>
        <div class="property" v-if="_compData.transition==Transition.SCALE">
            <label>Duration:</label>
            <div class="vector-input">
                <ui-num-input id="id_duration" @change="onNumChange" :value="_compData.duration"  step="0.1"></ui-num-input>
            </div>
        </div>
        <div class="property" v-if="_compData.transition==Transition.COLOR">
            <label>NormalColor:</label>
            <ui-color @confirm="onConfirmColor" id="id_normalColor" :value="_compData.normalColor"></ui-color>
        </div>
        <div class="property" v-if="_compData.transition==Transition.COLOR">
            <label>PressedColor:</label>
            <ui-color @confirm="onConfirmColor" id="id_pressedColor" :value="_compData.pressedColor"></ui-color>
        </div>
        <div class="property" v-if="_compData.transition==Transition.COLOR">
            <label>HoverColor:</label>
            <ui-color @confirm="onConfirmColor" id="id_hoverColor" :value="_compData.hoverColor"></ui-color>
        </div>
        <div class="property" v-if="_compData.transition==Transition.COLOR">
            <label>DisabledColor:</label>
            <ui-color @confirm="onConfirmColor" id="id_disabledColor" :value="_compData.disabledColor"></ui-color>
        </div>

        <div class="property" v-if="_compData.transition==Transition.SPRITE">
            <label>NormalSprite:</label>
            <ui-asset @change="onAssetChange" droppable="cc.SpriteFrame" id="id_normalSprite" :value="_compData.normalSprite"></ui-asset>
        </div>
        <div class="property" v-if="_compData.transition==Transition.SPRITE">
            <label>PressedSprite:</label>
            <ui-asset @change="onAssetChange" droppable="cc.SpriteFrame" id="id_pressedSprite" :value="_compData.pressedSprite"></ui-asset>
        </div>
        <div class="property" v-if="_compData.transition==Transition.SPRITE">
            <label>HoverSprite:</label>
            <ui-asset @change="onAssetChange" droppable="cc.SpriteFrame" id="id_hoverSprite" :value="_compData.hoverSprite"></ui-asset>
        </div>
        <div class="property" v-if="_compData.transition==Transition.SPRITE">
            <label>DisabledSprite:</label>
            <ui-asset @change="onAssetChange" droppable="cc.SpriteFrame" id="id_disabledSprite" :value="_compData.disabledSprite"></ui-asset>
        </div>
        
    </div>
</template>

<style scoped>
@import "./inspector.css";
label {
    width: 105px;
    display: inline-block;
}

</style>
