<script setup lang="ts">
import { reactive } from 'vue';
import { _funcs } from '../../../tools/_funcs';

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

// const _compData = reactive({
//     enabled: true,
//     lineWidth: 1,
//     strokeColor: '#FFFFFF',
//     fillColor: '#FFFFFF',
//     miterLimit: 10,
//     lineJoin: LineJoin.BEVEL,
//     lineCap: LineCap.BUTT,
// });

const compModel = defineModel<CompInfo_Graphics>()

function onToggle(event) {
    const id = event.target.id;
    const checked = event.target.checked;
    if (id === 'enabled') {
        compModel.value.enabled = checked;
    }
}

function onNumChange(event) {
    const id = event.target.id;
    const value = parseFloat(event.target.value);
    if (id === 'lineWidth') {
        compModel.value.lineWidth = value;
    } else if (id === 'miterLimit') {
        compModel.value.miterLimit = value;
    }
}

function onColorChange(event) {
    const id = event.target.id;
    const [r,g,b,a] = event.target.value
    
    const value = _funcs.rgbaToHex(r,g,b,a)
    if (id === 'strokeColor') {
        compModel.value.strokeColor = value;
    } else if (id === 'fillColor') {
        compModel.value.fillColor = value;
    }
}

function onSelectChange(event) {
    const id = event.target.id;
    const value = event.target.value;
    if (id === 'lineJoin') {
        compModel.value.lineJoin = value;
    } else if (id === 'lineCap') {
        compModel.value.lineCap = value;
    }
}
</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="enabled" :value="compModel.enabled" @change="onToggle"></ui-checkbox>
            <h3>Graphics</h3>
        </div>

        <div class="property">
            <label>Line Width:</label>
            <ui-num-input
                id="lineWidth"
                :value="compModel.lineWidth"
                @change="onNumChange"
                step="0.1"
                min="0"
            ></ui-num-input>
        </div>

        <div class="property">
            <label>Stroke Color:</label>
            <ui-color @confirm="onColorChange" id="strokeColor" :value="compModel.strokeColor"></ui-color>
        </div>

        <div class="property">
            <label>Fill Color:</label>
            <ui-color @confirm="onColorChange" id="fillColor" :value="compModel.fillColor"></ui-color>
        </div>

        <div class="property">
            <label>Miter Limit:</label>
            <ui-num-input
                id="miterLimit"
                :value="compModel.miterLimit"
                @change="onNumChange"
                step="0.1"
                min="0"
            ></ui-num-input>
        </div>

        <div class="property">
            <label>Line Join:</label>
            <ui-select id="lineJoin" v-model="compModel.lineJoin" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_LineJoin" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>

        <div class="property">
            <label>Line Cap:</label>
            <ui-select id="lineCap" v-model="compModel.lineCap" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_LineCap" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";

</style>
