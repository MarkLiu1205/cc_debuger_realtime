<script setup lang="ts">
import { reactive } from 'vue';
import comp_component_selecter from '../components/comp_component_selecter.vue';
import comp_node_selecter from '../components/comp_node_selecter.vue';

enum SizeMode {
    Unified = 0,
    Free = 1
}

enum Direction {
    Horizontal = 0,
    Vertical = 1
}

const enumDesc_SizeMode = [
    "Unified",
    "Free",
];

const enumDesc_Direction = [
    "Horizontal",
    "Vertical",
];

// const _compData = reactive({
//     enabled: true,
//     inertia: true,
//     elastic: true,
//     bounceDuration: 0.5,
//     indicator: null,
//     pageTurningSpeed: 0.3,
//     autoPageTurningThreshold: 0.1,
//     scrollThreshold: 0.5,
//     pageTurningEventTiming: 0.5,
//     brake:0.5,

//     content:"",
//     sizeMode:SizeMode.Unified,
//     direction:Direction.Horizontal,
// });

const compModel = defineModel<CompInfo_PageView>()

function onToggle(event) {
    const id = event.target.id;
    const checked = event.target.checked;
    if (id === "enabled") {
        compModel.value.enabled = checked;
    }else if (id === "inertia") {
        compModel.value.inertia = checked;
    } else if (id === "elastic") {
        compModel.value.elastic = checked;
    } 
}

function onNumChange(event) {
    const id = event.target.id;
    const value = parseFloat(event.target.value);
    if (id === "bounceDuration") {
        compModel.value.bounceDuration = value;
    } else if (id === "pageTurningSpeed") {
        compModel.value.pageTurningSpeed = value;
    } else if (id === "scrollThreshold") {
        compModel.value.scrollThreshold = value;
    } else if (id === "id_autoPageTurningThreshold") {
        compModel.value.autoPageTurningThreshold = value;
    } else if (id === "brake") {
        compModel.value.brake = value;
    } else if (id === "id_pageTurningSpeed") {
        compModel.value.pageTurningSpeed = value;
    }
}

function onNodeChange(event) {
    const id = event.target.id;
    const uuid = event.target.value
    if(id==="id_content"){
        compModel.value.content = uuid
    }
}

function onComponentChange(event) {
    // const id = event.target.id;
    // const uuid = event.target.value
    // if(id==="id_indicator"){
    //     compModel.value.indicator = uuid
    // }
}

function onSelectChange(event) {
    const eleId = event.target.id;
    const value = parseInt(event.target.value, 10);
    if (eleId === "id_sizeMode") {
        compModel.value.sizeMode = value;
    }else if (eleId === "id_direction") {
        compModel.value.direction = value;
    }
}

function onSliderChange(event) {
    const eleId = event.target.id;
    const value = event.target.value
    if (eleId === "id_scrollThreshold") {
        compModel.value.scrollThreshold = value;
    }else if (eleId === "id_pageTurningEventTiming") {
        compModel.value.pageTurningEventTiming = value;
    }
}

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="enabled" :value="compModel.enabled" @change="onToggle"></ui-checkbox>
            <h3>PageView</h3>
        </div>

        <div class="property">
            <label>Inertia:</label>
            <ui-checkbox id="inertia" :value="compModel.inertia" @change="onToggle"></ui-checkbox>
        </div>

        <div class="property" v-if="compModel.inertia">
            <label>Brake:</label>
            <ui-num-input id="brake" :value="compModel.brake" @change="onNumChange" min="0" max="1"></ui-num-input>
        </div>

        <div class="property">
            <label>Elastic:</label>
            <ui-checkbox id="elastic" :value="compModel.elastic" @change="onToggle"></ui-checkbox>
        </div>

        <div class="property" v-if="compModel.elastic">
            <label>BounceDuration:</label>
            <ui-num-input id="bounceDuration" :value="compModel.bounceDuration" @change="onNumChange" min="0"></ui-num-input>
        </div>
        <div class="property">
            <label>Content:</label>
            <ui-node id="id_content" :value="compModel.content" @change="onNodeChange" droppable="cc.Node"></ui-node>
        </div>
        <div class="property">
            <label>Size Mode:</label>
            <ui-select id="id_sizeMode" :value="compModel.sizeMode" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_SizeMode" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Direction:</label>
            <ui-select id="id_direction" :value="compModel.direction" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_Direction" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>

        <div class="property">
            <label>Scroll Threshold:</label>
            <ui-slider id="id_scrollThreshold" min="0" max="1" step="0.01" :value="compModel.scrollThreshold" @change="onSliderChange"></ui-slider>
        </div>

        <div class="property">
            <label>Page Turning Event Timing:</label>
            <ui-slider id="id_pageTurningEventTiming" min="0" max="1" step="0.01" :value="compModel.pageTurningEventTiming" @change="onSliderChange"></ui-slider>
        </div>

        <div class="property">
            <label>Indicator:</label>
            <comp_component_selecter class="comp_component_selecter" id="id_indicator" compType="PageViewIndicator" v-model="compModel.indicator" @change="onComponentChange"/>
        </div>

        <div class="property">
            <label>Page Turning Speed:</label>
            <ui-num-input id="id_pageTurningSpeed" :value="compModel.pageTurningSpeed" @change="onNumChange"></ui-num-input>
        </div>

        <div class="property">
            <label>Auto Page Turning Threshold:</label>
            <ui-num-input id="id_autoPageTurningThreshold" :value="compModel.autoPageTurningThreshold" @change="onNumChange"></ui-num-input>
        </div>

    </div>
</template>

<style scoped>
@import "./inspector.css";

</style>
