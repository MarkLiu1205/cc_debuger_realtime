<script setup lang="ts">
import { reactive } from 'vue';

const _compData = reactive({
    enabled: true,
    opacity: 255,
});

function onToggle(event) {
    const eleId = event.target.id;
    const value = event.target.checked;
    if (eleId === "id_enabled") {
        _compData.enabled = value;
    }
}

function onNumChange(event) {
    const eleId = event.target.id;
    const value = parseInt(event.target.value, 10);
    if (eleId === "id_opacity") {
        _compData.opacity = Math.min(Math.max(value, 0), 255); // Clamp value between 0 and 255
    }
}

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enabled" @change="onToggle" :value="_compData.enabled"></ui-checkbox>
            <h3>Opacity</h3>
        </div>
        <div class="property">
            <label>Opacity:</label>
            <ui-num-input
                id="id_opacity"
                :min="0"
                :max="255"
                :value="_compData.opacity"
                @change="onNumChange"
            ></ui-num-input>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";

</style>
