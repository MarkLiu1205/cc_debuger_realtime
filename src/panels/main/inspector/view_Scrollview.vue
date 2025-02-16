<script setup lang="ts">
import { reactive } from 'vue';
import comp_node_selecter from '../components/comp_node_selecter.vue';
import comp_component_selecter from '../components/comp_component_selecter.vue';

// const scrollViewData = reactive({
//     enabled: true,
//     horizontal: true,
//     vertical: true,
//     inertia: true,
//     brake: 0.5,
//     bounceDuration: 1,
//     elastic: true,
        
//     cancelInnerEvents: true,
//     content: null,
//     horizontalScrollBar: null,
//     verticalScrollBar: null,
// });

const compModel = defineModel<CompInfo_ScrollView>()

function onToggle(event) {
    const id = event.target.id;
    const checked = event.target.checked;
    if (id === "enabled") {
        compModel.value.enabled = checked;
    } else if (id === "horizontal") {
        compModel.value.horizontal = checked;
    } else if (id === "vertical") {
        compModel.value.vertical = checked;
    } else if (id === "inertia") {
        compModel.value.inertia = checked;
    } else if (id === "elastic") {
        compModel.value.elastic = checked;
    } else if (id === "cancelInnerEvents") {
        compModel.value.cancelInnerEvents = checked;
    }
}

function onNumChange(event) {
    const id = event.target.id;
    const value = parseFloat(event.target.value);
    if (id === "brake") {
        compModel.value.brake = value;
    } else if (id === "bounceDuration") {
        compModel.value.bounceDuration = value;
    }
}

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="enabled" :value="compModel.enabled" @change="onToggle"></ui-checkbox>
            <h3>ScrollView</h3>
        </div>

        

        <div class="property">
            <label>Horizontal:</label>
            <ui-checkbox id="horizontal" :value="compModel.horizontal" @change="onToggle"></ui-checkbox>
        </div>
        <div class="property" v-if="compModel.horizontal">
            <label>Horizontal Scroll Bar:</label>
            <comp_component_selecter compType="cc.Scrollbar"  v-model="compModel.horizontalScrollBar"/>
        </div>

        <div class="property">
            <label>Vertical:</label>
            <ui-checkbox id="vertical" :value="compModel.vertical" @change="onToggle"></ui-checkbox>
        </div>

        <div class="property" v-if="compModel.vertical">
            <label>Vertical Scroll Bar:</label>
            <comp_component_selecter compType="cc.Scrollbar"  v-model="compModel.verticalScrollBar"/>
        </div>

        <div class="property">
            <label>Inertia:</label>
            <ui-checkbox id="inertia" :value="compModel.inertia" @change="onToggle"></ui-checkbox>
        </div>

        <div class="property" v-if="compModel.inertia">
            <label>Brake:</label>
            <ui-num-input id="brake" :value="compModel.brake" @change="onNumChange" step="0.1" min="0" max="1"></ui-num-input>
        </div>

        <div class="property">
            <label>Elastic:</label>
            <ui-checkbox id="elastic" :value="compModel.elastic" @change="onToggle"></ui-checkbox>
        </div>

        <div class="property" v-if="compModel.elastic">
            <label>Bounce Duration:</label>
            <ui-num-input id="bounceDuration" :value="compModel.bounceDuration" @change="onNumChange" step="0.1" min="0" max="1"></ui-num-input>
        </div>

        <div class="property">
            <label>Content:</label>
            <comp_node_selecter class="comp_node_selecter" v-model="compModel.content" />
        </div>


        <div class="property">
            <label>Cancel Inner Events:</label>
            <ui-checkbox id="cancelInnerEvents" :value="compModel.cancelInnerEvents" @change="onToggle"></ui-checkbox>
        </div>

        

       
    </div>
</template>

<style scoped>
@import "./inspector.css";

</style>
