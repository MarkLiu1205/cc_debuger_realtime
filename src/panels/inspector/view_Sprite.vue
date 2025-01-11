<script setup lang="ts">
import { reactive } from 'vue';

const sprite = reactive({
    color: "#ffffff",
    customMaterial: null,
    grayscale: false,
    sharedMaterials: ["@ui-sprite-material"],
    sizeMode: "TRIMMED",
    spriteAtlas: null,
    spriteFrame: "@按钮",
    trim: true,
    type: "SIMPLE",
    enabled: true,
});
</script>

<template>
    <div class="component-properties">
        <div class="title">
            <input type="checkbox" v-model="sprite.enabled" />
            <h3>cc.Sprite</h3>
        </div>
        <div class="property">
            <label>color:</label>
            <input v-model="sprite.color" type="color" />
        </div>
        <div class="property">
            <label>customMaterial:</label>
            <input v-model="sprite.customMaterial" type="text" />
        </div>
        <div class="property">
            <label>grayscale:</label>
            <input v-model="sprite.grayscale" type="checkbox" />
        </div>
        <div class="property">
            <label>sizeMode:</label>
            <select v-model="sprite.sizeMode">
                <option value="TRIMMED">TRIMMED</option>
                <option value="RAW">RAW</option>
                <option value="CUSTOM">CUSTOM</option>
            </select>
        </div>
        <div class="property">
            <label>spriteFrame:</label>
            <input v-model="sprite.spriteFrame" type="text" />
        </div>
        <div class="property">
            <label>type:</label>
            <select v-model="sprite.type">
                <option value="SIMPLE">SIMPLE</option>
                <option value="SLICED">SLICED</option>
                <option value="TILED">TILED</option>
                <option value="FILLED">FILLED</option>
            </select>
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
