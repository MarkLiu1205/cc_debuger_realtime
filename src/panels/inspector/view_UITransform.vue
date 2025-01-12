<script setup lang="ts">
import { reactive } from 'vue';

const uiTransform = reactive({
    anchorPoint:{x:0.5,y:0.5},
    contentSize:{width:100,height:100},
    enabled:true,
});

function onNumChange(event){
    console.log("event.target.value",event.target.value,"id",event.target.id)
}

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
                <ui-num-input id="anchor.x" @change="onNumChange" :value="uiTransform.anchorPoint.x"  step="0.01" unit="x"></ui-num-input>
                <ui-num-input id="anchor.y" @change="onNumChange":value="uiTransform.anchorPoint.y"  step="0.01" unit="y"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label>contentSize:</label>
            <div class="vector-input">
                <ui-num-input id="size.width" @change="onNumChange" :value="uiTransform.contentSize.width" placeholder="width"></ui-num-input>
                <ui-num-input id="size.height" @change="onNumChange":value="uiTransform.contentSize.height" placeholder="height"></ui-num-input>
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

ui-num-input {
    width: 90px;
}
</style>
