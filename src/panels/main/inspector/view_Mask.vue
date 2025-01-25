<script setup lang="ts">
import { reactive } from 'vue';

enum MaskType {
    GRAPHICS_RECT = 0,
    GRAPHICS_ELLIPSE = 1,
    GRAPHICS_STENCIL = 2,
    SPRITE_STENCIL = 3
}

// const _compData = reactive({
//     enabled: true,
//     type: MaskType.GRAPHICS_RECT,
//     inverted: false,
//     segments: 64,
//     alphaThreshold: 0.5,
//     stencilStage: null,
// });

const compModel = defineModel<CompInfo_Mask>()

const maskTypeOptions = [
    { label: "GRAPHICS_RECT", value: MaskType.GRAPHICS_RECT },
    { label: "GRAPHICS_ELLIPSE", value: MaskType.GRAPHICS_ELLIPSE },
    { label: "GRAPHICS_STENCIL", value: MaskType.GRAPHICS_STENCIL },
    { label: "SPRITE_STENCIL", value: MaskType.SPRITE_STENCIL },
];

function onToggle(event) {
    const id = event.target.id;
    const checked = event.target.checked;
    if (id === "id_enabled") {
        compModel.value.enabled = checked;
    } else if (id === "id_inverted") {
        compModel.value.inverted = checked;
    }
}

function onNumChange(event) {
    const id = event.target.id;
    const value = parseFloat(event.target.value);
    if (id === "id_segments") {
        compModel.value.segments = value;
    }
}

function onSelect(event) {
    const id = event.target.id;
    const value = parseInt(event.target.value, 10);
    if (id === "id_type") {
        compModel.value.type = value;
    }
}

function onSliderChange(event) {
    const eleId = event.target.id;
    const value = event.target.value
    if (eleId === "id_alphaThreshold") {
        compModel.value.alphaThreshold = value;
    }
    console.log(eleId,value)
}
</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enabled" :value="compModel.enabled" @change="onToggle"></ui-checkbox>
            <h3>Mask</h3>
        </div>

        <div class="property">
            <label>Type:</label>
            <ui-select id="id_type" :value="compModel.type" @change="onSelect">
                <option v-for="option in maskTypeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </ui-select>
        </div>

        <div class="property" v-if="compModel.type === MaskType.GRAPHICS_ELLIPSE">
            <label>Segments:</label>
            <ui-num-input id="id_segments" :value="compModel.segments" @change="onNumChange" step="1"></ui-num-input>
        </div>

        <div class="property" v-if="compModel.type === MaskType.SPRITE_STENCIL">
            <label>AlphaThreshold:</label>
            <ui-slider id="id_alphaThreshold" :value="compModel.alphaThreshold" @change="onSliderChange" step="0.01" min="0" max="1"></ui-slider>
        </div>

        <div class="property">
            <label>Inverted:</label>
            <ui-checkbox id="id_inverted" :value="compModel.inverted" @change="onToggle"></ui-checkbox>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";

</style>
