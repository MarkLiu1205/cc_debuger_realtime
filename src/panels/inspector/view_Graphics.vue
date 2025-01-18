<script setup lang="ts">
import { reactive } from 'vue';

enum LineJoin {
    BEVEL = 0,
    ROUND = 1,
    MITER = 2
}

enum LineCap {
    BUTT = 0,
    ROUND = 1,
    SQUARE = 2
}

const enumDesc_LineJoin = [
    "BEVEL",
    "ROUND",
    "MITER",
]

const enumDesc_LineCap = [
    "BUTT",
    "ROUND",
    "SQUARE",
]

const _compData = reactive({
    enabled: true,
    lineWidth: 1,
    strokeColor: '#FFFFFF',
    fillColor: '#FFFFFF',
    miterLimit: 10,
    lineJoin: LineJoin.BEVEL,
    lineCap: LineCap.BUTT,
});

function onToggle(event) {
    const id = event.target.id;
    const checked = event.target.checked;
    if (id === 'enabled') {
        _compData.enabled = checked;
    }
}

function onNumChange(event) {
    const id = event.target.id;
    const value = parseFloat(event.target.value);
    if (id === 'lineWidth') {
        _compData.lineWidth = value;
    } else if (id === 'miterLimit') {
        _compData.miterLimit = value;
    }
}

function onColorChange(event) {
    const id = event.target.id;
    const value = event.target.value;
    if (id === 'strokeColor') {
        _compData.strokeColor = value;
    } else if (id === 'fillColor') {
        _compData.fillColor = value;
    }
}

function onSelectChange(event) {
    const id = event.target.id;
    const value = event.target.value;
    if (id === 'lineJoin') {
        _compData.lineJoin = value;
    } else if (id === 'lineCap') {
        _compData.lineCap = value;
    }
}
</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="enabled" :value="_compData.enabled" @change="onToggle"></ui-checkbox>
            <h3>Graphics</h3>
        </div>

        <div class="property">
            <label>Line Width:</label>
            <ui-num-input
                id="lineWidth"
                :value="_compData.lineWidth"
                @change="onNumChange"
                step="0.1"
                min="0"
            ></ui-num-input>
        </div>

        <div class="property">
            <label>Stroke Color:</label>
            <ui-color @confirm="onColorChange" id="strokeColor" :value="_compData.strokeColor"></ui-color>
        </div>

        <div class="property">
            <label>Fill Color:</label>
            <ui-color @confirm="onColorChange" id="fillColor" :value="_compData.fillColor"></ui-color>
        </div>

        <div class="property">
            <label>Miter Limit:</label>
            <ui-num-input
                id="miterLimit"
                :value="_compData.miterLimit"
                @change="onNumChange"
                step="0.1"
                min="0"
            ></ui-num-input>
        </div>

        <div class="property">
            <label>Line Join:</label>
            <ui-select id="lineJoin" v-model="_compData.lineJoin" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_LineJoin" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>

        <div class="property">
            <label>Line Cap:</label>
            <ui-select id="lineCap" v-model="_compData.lineCap" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_LineCap" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";

</style>
