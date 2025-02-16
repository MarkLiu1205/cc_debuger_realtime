<script setup lang="ts">
import { reactive } from 'vue';
import comp_component_selecter from '../components/comp_component_selecter.vue';
import comp_selecter_asset from '../components/comp_selecter_asset.vue';

enum InputMode {
    ANY = 0,
    EMAIL_ADDR = 1,
    NUMERIC = 2,
    PHONE_NUMBER = 3,
    URL = 4,
    DECIMAL = 5,
    SINGLE_LINE = 6,
}

enum InputFlag {
    PASSWORD = 0,
    SENSITIVE = 1,
    INITIAL_CAPS_WORD = 2,
    INITIAL_CAPS_SENTENCE = 3,
    INITIAL_CAPS_ALL_CHARACTERS = 4,
    DEFAULT = 5
}

enum KeyboardReturnType {
    DEFAULT = 0,
    DONE = 1,
    SEND = 2,
    SEARCH = 3,
    GO = 4,
    NEXT = 5,
}

const enumDesc_InputMode = [
    "ANY",
    "EMAIL_ADDR",
    "NUMERIC",
    "PHONE_NUMBER",
    "URL",
    "DECIMAL",
    "SINGLE_LINE",
];

const enumDesc_InputFlag = [
    "PASSWORD",
    "SENSITIVE",
    "INITIAL_CAPS_ALL_CHARACTERS",
    "INITIAL_CAPS_WORD",
    "INITIAL_CAPS_SENTENCE",
    "DEFAULT",
];

const enumDesc_KeyboardReturnType = [
    "DEFAULT",
    "DONE",
    "SEND",
    "SEARCH",
    "GO",
    "NEXT",
];

// const _compData = reactive({
//     enabled: true,
//     string: "EditBox text",
//     maxLength: 24,
//     tabIndex: 28,
//     inputMode: InputMode.ANY,
//     inputFlag: InputFlag.DEFAULT,
//     returnType: KeyboardReturnType.DEFAULT,
//     placeholder: "Enter text here",
//     backgroundImage: "",
//     textLabel: "",
//     placeholderLabel: "",
// });

const compModel = defineModel<CompInfo_EditBox>()

function onToggle(event) {
    const eleId = event.target.id;
    const value = event.target.checked;
    if (eleId === "id_enabled") {
        compModel.value.enabled = value;
    }
}

function onTextChange(event) {
    const eleId = event.target.id;
    const value = event.target.value;
    if (eleId === "id_string") {
        compModel.value.string = value;
    } else if (eleId === "id_placeholder") {
        compModel.value.placeholder = value;
    }
}

function onNumChange(event) {
    const eleId = event.target.id;
    const value = parseInt(event.target.value, 10);
    if (eleId === "id_maxLength") {
        compModel.value.maxLength = value;
    } else if (eleId === "id_tabIndex") {
        compModel.value.tabIndex = value;
    } 
}

function onSelectChange(event) {
    const eleId = event.target.id;
    const value = parseInt(event.target.value, 10);
    if (eleId === "id_inputMode") {
        compModel.value.inputMode = value;
    } else if (eleId === "id_inputFlag") {
        compModel.value.inputFlag = value;
    } else if (eleId === "id_returnType") {
        compModel.value.returnType = value;
    }
}


</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enabled" @change="onToggle" :value="compModel.enabled"></ui-checkbox>
            <h3>EditBox</h3>
        </div>
        <div class="property">
            <label>String:</label>
            <ui-input id="id_string" :value="compModel.string" @change="onTextChange"></ui-input>
        </div>
        <div class="property">
            <label>Placeholder:</label>
            <ui-input id="id_placeholder" :value="compModel.placeholder" @change="onTextChange"></ui-input>
        </div>
        <div class="property">
            <label>Text Label:</label>
            <comp_component_selecter class="comp_component_selecter" compType="cc.Label" v-model="compModel.textLabel"/>
        </div>
        <div class="property">
            <label>Placeholder Label:</label>
            <comp_component_selecter class="comp_component_selecter" compType="cc.Label" v-model="compModel.placeholderLabel"/>
        </div>
        <div class="property">
            <label>Background Image:</label>
            <comp_selecter_asset assetType="cc.SpriteFrame"  v-model="compModel.backgroundImage"/>
        </div>
        <div class="property">
            <label>Input Flag:</label>
            <ui-select id="id_inputFlag" :value="compModel.inputFlag" @change="onSelectChange">
                <option v-for="(flag, index) in enumDesc_InputFlag" :key="index" :value="index">{{ flag }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Input Mode:</label>
            <ui-select id="id_inputMode" :value="compModel.inputMode" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_InputMode" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Return Type:</label>
            <ui-select id="id_returnType" :value="compModel.returnType" @change="onSelectChange">
                <option v-for="(type, index) in enumDesc_KeyboardReturnType" :key="index" :value="index">{{ type }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Max Length:</label>
            <ui-num-input id="id_maxLength" :value="compModel.maxLength" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property">
            <label>Tab Index:</label>
            <ui-num-input id="id_tabIndex" :value="compModel.tabIndex" @change="onNumChange"></ui-num-input>
        </div>
        
    </div>
</template>

<style scoped>
@import "./inspector.css";

</style>
