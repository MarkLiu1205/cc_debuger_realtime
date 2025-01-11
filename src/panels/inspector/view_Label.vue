<script setup lang="ts">
import { reactive } from 'vue';

const label = reactive({
    fontFamily: "Arial",
    spacingX: 0,
    overflow: "NONE",
    enableWrapText: false,
    useSystemFont: true,
    font: null,
    lineHeight: 40,
    color: "#000000",
    horizontalAlign: "CENTER",
    verticalAlign: "CENTER",
    fontSize: 40,
    isUnderline: false,
    isBold: false,
    isItalic: false,

    enabled: true,
});
</script>

<template>
    <div class="component-properties">
        <div class="title">
            <input type="checkbox" v-model="label.enabled" />
            <h3>cc.Label</h3>
        </div>
        <div class="property">
            <label>fontFamily:</label>
            <input v-model="label.fontFamily" type="text" />
        </div>
        <div class="property">
            <label>spacingX:</label>
            <input v-model.number="label.spacingX" type="number" />
        </div>
        <div class="property">
            <label>overflow:</label>
            <select v-model="label.overflow">
                <option value="NONE">NONE</option>
                <option value="CLAMP">CLAMP</option>
                <option value="SHRINK">SHRINK</option>
            </select>
        </div>
        <div class="property">
            <label>enableWrapText:</label>
            <input v-model="label.enableWrapText" type="checkbox" />
        </div>
        <div class="property">
            <label>lineHeight:</label>
            <input v-model.number="label.lineHeight" type="number" />
        </div>
        <div class="property">
            <label>color:</label>
            <input v-model="label.color" type="color" />
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";
label {
    width: 80px;
    display: inline-block;
}

</style>
