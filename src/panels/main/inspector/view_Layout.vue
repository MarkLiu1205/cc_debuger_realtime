<script setup lang="ts">
import { reactive } from 'vue';

enum Type {
    NONE = 0,
    HORIZONTAL = 1,
    VERTICAL = 2,
    GRID = 3,
}

enum ResizeMode {
    NONE = 0,
    CONTAINER = 1,
    CHILDREN = 2,
}

enum HoriazonDirection {
    LEFT_TO_RIGHT = 0,
    RIGHT_TO_LEFT = 1,
}

enum VerticalDirection {
    BOTTOM_TO_TOP = 0,
    TOP_TO_BOTTOM = 1
}

enum AxisDirection {
    HORIZONTAL = 0,
    VERTICAL = 1
}

enum Constraint {
    NONE = 0,
    FIXED_ROW = 1,
    FIXED_COL = 2
}

const enumDesc_Type = ["NONE", "HORIZONTAL", "VERTICAL", "GRID"];
const enumDesc_ResizeMode = ["NONE", "CONTAINER", "CHILDREN"];
const enumDesc_HoriazonDirection = ["LEFT_TO_RIGHT", "RIGHT_TO_LEFT"];
const enumDesc_VerticalDirection = ["BOTTOM_TO_TOP", "TOP_TO_BOTTOM"];
const enumDesc_AxisDirection = ["HORIZONTAL", "VERTICAL"];
const enumDesc_Constraint = ["NONE", "FIXED_ROW", "FIXED_COL"];

// const _compData = reactive({
//     enabled: true,
//     type: Type.NONE,
//     resizeMode: ResizeMode.NONE,
//     paddingLeft: 0,
//     paddingRight: 0,
//     paddingTop: 0,
//     paddingBottom: 0,
//     spacingX: 0,
//     spacingY: 0,
//     alignHorizontal: false,
//     alignVertical: false,
//     affectByScale: false,
//     verticalDirection: VerticalDirection.TOP_TO_BOTTOM,
//     horiazonDirection: HoriazonDirection.LEFT_TO_RIGHT,
//     startAxis:AxisDirection.HORIZONTAL,
//     constraint:Constraint.NONE,
// });

const compModel = defineModel<CompInfo_Layout>()

function onToggle(event) {
    const eleId = event.target.id;
    const bool = event.target.value;
    if (eleId === "id_enabled") {
        compModel.value.enabled = bool;
    } else if (eleId === "id_alignHorizontal") {
        compModel.value.alignHorizontal = bool;
    } else if (eleId === "id_alignVertical") {
        compModel.value.alignVertical = bool;
    }
}

function onSelect(event) {
    const eleId = event.target.id;
    const sel = event.target.value;
    if (eleId === "id_type") {
        compModel.value.type = sel;
    } else if (eleId === "id_resizeMode") {
        compModel.value.resizeMode = sel;
    } else if (eleId === "id_horiazonDirection") {
        compModel.value.horiazonDirection = sel;
    } else if (eleId === "id_verticalDirection") {
        compModel.value.verticalDirection = sel;
    } else if (eleId === "id_startAxis") {
        compModel.value.startAxis = sel;
    } else if (eleId === "id_constraint") {
        compModel.value.constraint = sel;
    }
}

function onNumChange(event) {
    const eleId = event.target.id;
    const num = parseFloat(event.target.value);
    switch (eleId) {
        case "id_paddingLeft":
            compModel.value.paddingLeft = num;
            break;
        case "id_paddingRight":
            compModel.value.paddingRight = num;
            break;
        case "id_paddingTop":
            compModel.value.paddingTop = num;
            break;
        case "id_paddingBottom":
            compModel.value.paddingBottom = num;
            break;
        case "id_spacingX":
            compModel.value.spacingX = num;
            break;
        case "id_spacingY":
            compModel.value.spacingY = num;
            break;
    }
}
</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enabled" @change="onToggle" :value="compModel.enabled"></ui-checkbox>
            <h3>cc.Layout</h3>
        </div>
        <div class="property">
            <label>Type:</label>
            <ui-select id="id_type" v-model="compModel.type" @change="onSelect">
                <option v-for="(type, index) in enumDesc_Type" :key="index" :value="index">
                    {{ type }}
                </option>
            </ui-select>
        </div>
        <div class="property" v-if="compModel.type==Type.HORIZONTAL">
            <label>Align Horizontal:</label>
            <ui-checkbox id="id_alignHorizontal" @change="onToggle" :value="compModel.alignHorizontal"></ui-checkbox>
        </div>
        <div class="property" v-if="compModel.type==Type.VERTICAL">
            <label>Align Vertical:</label>
            <ui-checkbox id="id_alignVertical" @change="onToggle" :value="compModel.alignVertical"></ui-checkbox>
        </div>
        <div class="property" v-if="compModel.type!=Type.NONE">
            <label>Resize Mode:</label>
            <ui-select id="id_resizeMode" v-model="compModel.resizeMode" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_ResizeMode" :key="index" :value="index">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
        <div class="property" v-if="compModel.type==Type.GRID">
            <label>Start Axis:</label>
            <ui-select id="id_startAxis" v-model="compModel.startAxis" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_AxisDirection" :key="index" :value="index">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
        <div class="property" v-if="compModel.type==Type.HORIZONTAL||compModel.type==Type.GRID">
            <label>Padding Left:</label>
            <ui-num-input id="id_paddingLeft" @change="onNumChange" :value="compModel.paddingLeft" step="0.1"></ui-num-input>
        </div>
        <div class="property" v-if="compModel.type==Type.HORIZONTAL||compModel.type==Type.GRID">
            <label>Padding Right:</label>
            <ui-num-input id="id_paddingRight" @change="onNumChange" :value="compModel.paddingRight" step="0.1"></ui-num-input>
        </div>
        <div class="property" v-if="compModel.type==Type.VERTICAL||compModel.type==Type.GRID">
            <label>Padding Top:</label>
            <ui-num-input id="id_paddingTop" @change="onNumChange" :value="compModel.paddingTop" step="0.1"></ui-num-input>
        </div>
        <div class="property" v-if="compModel.type==Type.VERTICAL||compModel.type==Type.GRID">
            <label>Padding Bottom:</label>
            <ui-num-input id="id_paddingBottom" @change="onNumChange" :value="compModel.paddingBottom" step="0.1"></ui-num-input>
        </div>

        <div class="property" v-if="compModel.type==Type.HORIZONTAL||compModel.type==Type.GRID">
            <label>SpacingX:</label>
            <ui-num-input id="id_spacingX" @change="onNumChange" :value="compModel.spacingX" step="0.1"></ui-num-input>
        </div>
        <div class="property" v-if="compModel.type==Type.VERTICAL||compModel.type==Type.GRID">
            <label>SpacingY:</label>
            <ui-num-input id="id_spacingY" @change="onNumChange" :value="compModel.spacingY" step="0.1"></ui-num-input>
        </div>
        <div class="property" v-if="compModel.type==Type.HORIZONTAL||compModel.type==Type.GRID">
            <label>Horiazon Direction:</label>
            <ui-select id="id_horiazonDirection" v-model="compModel.horiazonDirection" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_HoriazonDirection" :key="index" :value="index">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
        <div class="property" v-if="compModel.type==Type.VERTICAL||compModel.type==Type.GRID">
            <label>Vertical Direction:</label>
            <ui-select id="id_verticalDirection" v-model="compModel.verticalDirection" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_VerticalDirection" :key="index" :value="index">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
        <div class="property" v-if="compModel.type==Type.GRID">
            <label>Constraint:</label>
            <ui-select id="id_constraint" v-model="compModel.constraint" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_Constraint" :key="index" :value="index">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
        <div class="property" v-if="compModel.type!=Type.NONE">
            <label>Affect by scale:</label>
            <ui-checkbox id="id_affectByScale" @change="onToggle" :value="compModel.affectByScale"></ui-checkbox>
        </div>
        
    </div>
</template>

<style scoped>
@import "./inspector.css";


</style>
