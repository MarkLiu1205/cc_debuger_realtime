<script setup lang="ts">
import { reactive } from 'vue';

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

const _compData = reactive({
    enabled: true,
    inertia: true,
    elastic: true,
    bounceDuration: 0.5,
    indicator: null,
    pageTurningSpeed: 0.3,
    autoPageTurningThreshold: 0.1,
    scrollThreshold: 0.5,
    pageTurningEventTiming: 0.5,
    brake:0.5,

    content:"",
    sizeMode:SizeMode.Unified,
    direction:Direction.Horizontal,
});

function onToggle(event) {
    const id = event.target.id;
    const checked = event.target.checked;
    if (id === "enabled") {
        _compData.enabled = checked;
    }else if (id === "inertia") {
        _compData.inertia = checked;
    } else if (id === "elastic") {
        _compData.elastic = checked;
    } 
}

function onNumChange(event) {
    const id = event.target.id;
    const value = parseFloat(event.target.value);
    if (id === "bounceDuration") {
        _compData.bounceDuration = value;
    } else if (id === "pageTurningSpeed") {
        _compData.pageTurningSpeed = value;
    } else if (id === "scrollThreshold") {
        _compData.scrollThreshold = value;
    } else if (id === "id_autoPageTurningThreshold") {
        _compData.autoPageTurningThreshold = value;
    } else if (id === "brake") {
        _compData.brake = value;
    }
}

function onNodeChange(event) {
    const id = event.target.id;
    const uuid = event.target.value
    if(id==="id_content"){
        _compData.content = uuid
    }
}

function onComponentChange(event) {
    const id = event.target.id;
    const uuid = event.target.value
    if(id==="id_indicator"){
        _compData.indicator = uuid
    }
}

function onSelectChange(event) {
    const eleId = event.target.id;
    const value = parseInt(event.target.value, 10);
    if (eleId === "id_sizeMode") {
        _compData.sizeMode = value;
    }else if (eleId === "id_direction") {
        _compData.direction = value;
    }
}

function onSliderChange(event) {
    const eleId = event.target.id;
    const value = event.target.value
    if (eleId === "id_scrollThreshold") {
        _compData.scrollThreshold = value;
    }else if (eleId === "id_id_pageTurningEventTiming") {
        _compData.pageTurningEventTiming = value;
    }
}

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="enabled" :value="_compData.enabled" @change="onToggle"></ui-checkbox>
            <h3>PageView</h3>
        </div>

        <div class="property">
            <label>Inertia:</label>
            <ui-checkbox id="inertia" :value="_compData.inertia" @change="onToggle"></ui-checkbox>
        </div>

        <div class="property" v-if="_compData.inertia">
            <label>Brake:</label>
            <ui-num-input id="brake" :value="_compData.brake" @change="onNumChange"></ui-num-input>
        </div>

        <div class="property">
            <label>Elastic:</label>
            <ui-checkbox id="elastic" :value="_compData.elastic" @change="onToggle"></ui-checkbox>
        </div>

        <div class="property" v-if="_compData.elastic">
            <label>BounceDuration:</label>
            <ui-num-input id="bounceDuration" :value="_compData.bounceDuration" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property">
            <label>Content:</label>
            <ui-node id="id_content" :value="_compData.content" @change="onNodeChange" droppable="cc.Node"></ui-node>
        </div>
        <div class="property">
            <label>Size Mode:</label>
            <ui-select id="id_sizeMode" :value="_compData.sizeMode" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_SizeMode" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Direction:</label>
            <ui-select id="id_direction" :value="_compData.direction" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_Direction" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>

        <div class="property">
            <label>Scroll Threshold:</label>
            <ui-slider id="id_scrollThreshold" min="0" max="1" step="0.01" :value="_compData.scrollThreshold" @change="onSliderChange"></ui-slider>
        </div>

        <div class="property">
            <label>Page Turning Event Timing:</label>
            <ui-slider id="id_pageTurningEventTiming" min="0" max="1" step="0.01" :value="_compData.pageTurningEventTiming" @change="onSliderChange"></ui-slider>
        </div>

        <div class="property">
            <label>Indicator:</label>
            <ui-component id="id_indicator" :value="_compData.indicator" @change="onComponentChange" droppable="cc.PageViewIndicator"></ui-component>
        </div>

        <div class="property">
            <label>Page Turning Speed:</label>
            <ui-num-input id="id_pageTurningSpeed" :value="_compData.pageTurningSpeed" @change="onNumChange"></ui-num-input>
        </div>

        <div class="property">
            <label>Auto Page Turning Threshold:</label>
            <ui-num-input id="id_autoPageTurningThreshold" :value="_compData.autoPageTurningThreshold" @change="onNumChange"></ui-num-input>
        </div>

    </div>
</template>

<style scoped>
@import "./inspector.css";

</style>
