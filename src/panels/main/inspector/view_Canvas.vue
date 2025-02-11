<script setup lang="ts">
import { reactive } from 'vue';
import comp_component_selecter from '../components/comp_component_selecter.vue';

const compModel = defineModel<CompInfo_Canvas>()

function onToggle(event) {
    const eleId = event.target.id;
    const value = event.target.checked;
    if (eleId === "id_enabled") {
        compModel.value.enabled = value;
    }else if (eleId === "id_alignCanvasWithScreen") {
        compModel.value.alignCanvasWithScreen = value;
    }
}

function onNodeChange(event){
    
}

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enabled" @change="onToggle" :value="compModel.enabled"></ui-checkbox>
            <h3>Canvas</h3>
        </div>
        <div class="property">
            <label>Camera Component:</label>
            <comp_component_selecter class="comp_component_selecter" compType="cc.Camera" v-model="compModel.cameraComponent"/>
        </div>
        <div class="property">
            <label>Align Canvas With Screen:</label>
            <ui-checkbox id="id_alignCanvasWithScreen" @change="onToggle" :value="compModel.alignCanvasWithScreen"></ui-checkbox>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";

</style>
