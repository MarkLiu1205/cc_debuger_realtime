<script setup lang="ts">
import { reactive } from 'vue';

const scrollViewData = reactive({
    enabled: true,
    horizontal: true,
    vertical: true,
    inertia: true,
    brake: 0.5,
    bounceDuration: 1,
    elastic: true,
        
    cancelInnerEvents: true,
    content: null,
    horizontalScrollBar: null,
    verticalScrollBar: null,
});

function onToggle(event) {
    const id = event.target.id;
    const checked = event.target.checked;
    if (id === "enabled") {
        scrollViewData.enabled = checked;
    } else if (id === "horizontal") {
        scrollViewData.horizontal = checked;
    } else if (id === "vertical") {
        scrollViewData.vertical = checked;
    } else if (id === "inertia") {
        scrollViewData.inertia = checked;
    } else if (id === "elastic") {
        scrollViewData.elastic = checked;
    } else if (id === "cancelInnerEvents") {
        scrollViewData.cancelInnerEvents = checked;
    }
}

function onNumChange(event) {
    const id = event.target.id;
    const value = parseFloat(event.target.value);
    if (id === "brake") {
        scrollViewData.brake = value;
    } else if (id === "bounceDuration") {
        scrollViewData.bounceDuration = value;
    }
}

function onAssetChange(event) {
    const id = event.target.id;
    const value = event.target.value;
    if (id === "content") {
        scrollViewData.content = value;
    } else if (id === "horizontalScrollBar") {
        scrollViewData.horizontalScrollBar = value;
    } else if (id === "verticalScrollBar") {
        scrollViewData.verticalScrollBar = value;
    }
}
</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="enabled" :value="scrollViewData.enabled" @change="onToggle"></ui-checkbox>
            <h3>ScrollView</h3>
        </div>

        

        <div class="property">
            <label>Horizontal:</label>
            <ui-checkbox id="horizontal" :value="scrollViewData.horizontal" @change="onToggle"></ui-checkbox>
        </div>
        <div class="property" v-if="scrollViewData.horizontal">
            <label>Horizontal Scroll Bar:</label>
            <ui-asset id="horizontalScrollBar" :value="scrollViewData.horizontalScrollBar" @change="onAssetChange" droppable="cc.Scrollbar"></ui-asset>
        </div>

        <div class="property">
            <label>Vertical:</label>
            <ui-checkbox id="vertical" :value="scrollViewData.vertical" @change="onToggle"></ui-checkbox>
        </div>

        <div class="property" v-if="scrollViewData.vertical">
            <label>Vertical Scroll Bar:</label>
            <ui-asset id="verticalScrollBar" :value="scrollViewData.verticalScrollBar" @change="onAssetChange" droppable="cc.Scrollbar"></ui-asset>
        </div>

        <div class="property">
            <label>Inertia:</label>
            <ui-checkbox id="inertia" :value="scrollViewData.inertia" @change="onToggle"></ui-checkbox>
        </div>

        <div class="property" v-if="scrollViewData.inertia">
            <label>Brake:</label>
            <ui-num-input id="brake" :value="scrollViewData.brake" @change="onNumChange" step="0.1" min="0" max="1"></ui-num-input>
        </div>

        <div class="property">
            <label>Elastic:</label>
            <ui-checkbox id="elastic" :value="scrollViewData.elastic" @change="onToggle"></ui-checkbox>
        </div>

        <div class="property" v-if="scrollViewData.elastic">
            <label>Bounce Duration:</label>
            <ui-num-input id="bounceDuration" :value="scrollViewData.bounceDuration" @change="onNumChange" step="0.1" min="0" max="1"></ui-num-input>
        </div>

        <div class="property">
            <label>Content:</label>
            <ui-node id="content" :value="scrollViewData.content" @change="onAssetChange" droppable="cc.Node"></ui-node>
        </div>


        <div class="property">
            <label>Cancel Inner Events:</label>
            <ui-checkbox id="cancelInnerEvents" :value="scrollViewData.cancelInnerEvents" @change="onToggle"></ui-checkbox>
        </div>

        

       
    </div>
</template>

<style scoped>
@import "./inspector.css";

</style>
