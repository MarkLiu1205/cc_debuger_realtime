<script setup lang="ts">
import { reactive } from 'vue';

const button = reactive({
    enabled: true,
    target: "Node:@[self]",
    clickEvents: ["$EventHandler"],
    transition: "SCALE",
    duration: 0.1,
    interactable: true,
    zoomScale: 1.2,
});
</script>

<template>
    <div class="component-properties">
        <div class="title">
            <input type="checkbox" v-model="button.enabled" />
            <h3>cc.Button</h3>
        </div>
        <div class="property">
            <label>target:</label>
            <input v-model="button.target" type="text" />
        </div>
        <div class="property">
            <label>clickEvents:</label>
            <input v-model="button.clickEvents[0]" type="text" />
        </div>
        <div class="property">
            <label>transition:</label>
            <select v-model="button.transition">
                <option value="NONE">NONE</option>
                <option value="SCALE">SCALE</option>
                <option value="COLOR">COLOR</option>
            </select>
        </div>
        <div class="property">
            <label>duration:</label>
            <input v-model.number="button.duration" type="number" />
        </div>
        <div class="property">
            <label>interactable:</label>
            <input v-model="button.interactable" type="checkbox" />
        </div>
        <div class="property">
            <label>zoomScale:</label>
            <input v-model.number="button.zoomScale" type="number" />
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
