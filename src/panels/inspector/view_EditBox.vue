<script setup lang="ts">
import { reactive } from 'vue';

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

const _compData = reactive({
    enabled: true,
    string: "EditBox text",
    maxLength: 24,
    tabIndex: 28,
    inputMode: InputMode.ANY,
    inputFlag: InputFlag.DEFAULT,
    keyboardReturnType: KeyboardReturnType.DEFAULT,
    placeholder: "Enter text here",
    backgroundImage: "",
    color: "#FFFFFF",
    textLabel: "",
    placeholderLabel: "",
});

function onToggle(event) {
    const eleId = event.target.id;
    const value = event.target.checked;
    if (eleId === "id_enabled") {
        _compData.enabled = value;
    }
}

function onTextChange(event) {
    const eleId = event.target.id;
    const value = event.target.value;
    if (eleId === "id_string") {
        _compData.string = value;
    } else if (eleId === "id_placeholder") {
        _compData.placeholder = value;
    }
}

function onNumChange(event) {
    const eleId = event.target.id;
    const value = parseInt(event.target.value, 10);
    if (eleId === "id_maxLength") {
        _compData.maxLength = value;
    } else if (eleId === "id_tabIndex") {
        _compData.tabIndex = value;
    } 
}

function onSelectChange(event) {
    const eleId = event.target.id;
    const value = parseInt(event.target.value, 10);
    if (eleId === "id_inputMode") {
        _compData.inputMode = value;
    } else if (eleId === "id_inputFlag") {
        _compData.inputFlag = value;
    } else if (eleId === "id_keyboardReturnType") {
        _compData.keyboardReturnType = value;
    }
}
function onAssetChange(event) {
    const uuid = event.target.value;
    _compData.backgroundImage = uuid;
}

function onNodeChange(event) {
    const eleId = event.target.id;
    const uuid = event.target.value
    if (eleId === "id_textLabel") {
        _compData.textLabel = uuid;
    } else if (eleId === "id_placeholderLabel") {
        _compData.placeholderLabel = uuid;
    }
}

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enabled" @change="onToggle" :value="_compData.enabled"></ui-checkbox>
            <h3>EditBox</h3>
        </div>
        <div class="property">
            <label>String:</label>
            <ui-input id="id_string" :value="_compData.string" @change="onTextChange"></ui-input>
        </div>
        <div class="property">
            <label>Placeholder:</label>
            <ui-input id="id_placeholder" :value="_compData.placeholder" @change="onTextChange"></ui-input>
        </div>
        <div class="property">
            <label>Text Label:</label>
            <ui-node id="id_textLabel" :value="_compData.textLabel" @change="onNodeChange" droppable="cc.Label"></ui-node>
        </div>
        <div class="property">
            <label>Placeholder Label:</label>
            <ui-node id="id_placeholderLabel" :value="_compData.placeholderLabel" @change="onNodeChange" droppable="cc.Label"></ui-node>
        </div>
        <div class="property">
            <label>Background Image:</label>
            <ui-asset id="id_backgroundImage" :value="_compData.backgroundImage" @change="onAssetChange" droppable="cc.SpriteFrame"></ui-asset>
        </div>
        <div class="property">
            <label>Input Flag:</label>
            <ui-select id="id_inputFlag" :value="_compData.inputFlag" @change="onSelectChange">
                <option v-for="(flag, index) in enumDesc_InputFlag" :key="index" :value="index">{{ flag }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Input Mode:</label>
            <ui-select id="id_inputMode" :value="_compData.inputMode" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_InputMode" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Return Type:</label>
            <ui-select id="id_keyboardReturnType" :value="_compData.keyboardReturnType" @change="onSelectChange">
                <option v-for="(type, index) in enumDesc_KeyboardReturnType" :key="index" :value="index">{{ type }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Max Length:</label>
            <ui-num-input id="id_maxLength" :value="_compData.maxLength" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property">
            <label>Tab Index:</label>
            <ui-num-input id="id_tabIndex" :value="_compData.tabIndex" @change="onNumChange"></ui-num-input>
        </div>
        
    </div>
</template>

<style scoped>
@import "./inspector.css";

</style>
