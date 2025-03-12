<script setup lang="ts">
import { reactive } from 'vue';
import { _pluginSocket } from '../../../tools/plugin_socket';

const compModel = defineModel<any>()

function onToggle(event) {
    const eleId = event.target.id;
    const value = event.target.checked;
    if (eleId === "id_enabled") {
        compModel.value.enabled = value;
    }
}

function onSelect(event) {
    const eleId = event.target.id;
    const sel = event.target.value;
    if (eleId === "id_animation") {
        compModel.value.animation = sel
    } 
    // console.log("eleId",eleId,"sel",sel)
}

function playCurAni(){
    _pluginSocket.callFuncOfComp(compModel.value.uuid,"play",[compModel.value.animation])
}

function stopCurAni(){
    _pluginSocket.callFuncOfComp(compModel.value.uuid,"stop",[])
}

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enabled" @change="onToggle" :value="compModel.enabled"></ui-checkbox>
            <h3>Animation</h3>
        </div>
        <div class="property">
            <label>Animation:</label>
            <ui-select id="id_animation" v-model="compModel.animation" @confirm="onSelect">
                <option v-for="(mode, index) in compModel.animationArr" :key="mode" :value="mode">
                    {{ mode }}
                </option>
            </ui-select>
            <ui-button style="margin-left: 10px;padding-top: 5px;padding-bottom: 5px;"  @click="playCurAni">play</ui-button>
            <ui-button style="margin-left: 10px;padding-top: 5px;padding-bottom: 5px;"  @click="stopCurAni">stop</ui-button>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";

ui-select {
    width: calc((100% - 105px - 126px));
}

</style>
