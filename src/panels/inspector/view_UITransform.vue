<script setup lang="ts">
import { reactive } from 'vue';

const uiTransform = reactive({
    anchorPoint:{x:0.5,y:0.5},
    contentSize:{width:100,height:100},
    enabled:true,
});
</script>

<template>
    <div class="component-properties">
        <div class="title">
            <input type="checkbox" v-model="uiTransform.enabled" />
            <h3>cc.UITransform</h3>
        </div>
        <div class="property">
            <label>anchorPoint:</label>
            <div class="vector-input">
                <input v-model.number="uiTransform.anchorPoint.x" type="number" step="0.01"/>
                <input v-model.number="uiTransform.anchorPoint.y" type="number" step="0.01"/>
            </div>
        </div>
        <div class="property">
            <label>contentSize:</label>
            <div class="vector-input">
                <input v-model.number="uiTransform.contentSize.width" type="number" />
                <input v-model.number="uiTransform.contentSize.height" type="number" />
            </div>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";

label {
    width: 90px;
    /* display: inline-block; */
}

input[type="number"] {
  width: 80px;
}
</style>
