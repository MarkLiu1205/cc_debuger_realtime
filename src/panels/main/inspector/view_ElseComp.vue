<script setup lang="ts">
import { reactive } from 'vue';

const compModel = defineModel<CompInfo_Base>()

function onToggle(event) {
    const eleId = event.target.id;
    const value = event.target.checked;
    if (eleId === "id_enabled") {
        compModel.value.enabled = value;
    }
}

function onNumChange(event) {
    const eleId = event.target.id;
    const value = parseInt(event.target.value, 10);
}

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enabled" @change="onToggle" :value="compModel.enabled"></ui-checkbox>
            <h3>{{ compModel.typeStr }}</h3>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";

</style>
