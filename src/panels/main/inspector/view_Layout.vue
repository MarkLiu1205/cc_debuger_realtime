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

const _compData = reactive({
    enabled: true,
    type: Type.NONE,
    resizeMode: ResizeMode.NONE,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    spacingX: 0,
    spacingY: 0,
    alignHorizontal: false,
    alignVertical: false,
    affectByScale: false,
    verticalDirection: VerticalDirection.TOP_TO_BOTTOM,
    horiazonDirection: HoriazonDirection.LEFT_TO_RIGHT,
    startAxis:AxisDirection.HORIZONTAL,
    constraint:Constraint.NONE,
});

function onToggle(event) {
    const eleId = event.target.id;
    const bool = event.target.value;
    if (eleId === "id_enabled") {
        _compData.enabled = bool;
    } else if (eleId === "id_alignHorizontal") {
        _compData.alignHorizontal = bool;
    } else if (eleId === "id_alignVertical") {
        _compData.alignVertical = bool;
    }
}

function onSelect(event) {
    const eleId = event.target.id;
    const sel = event.target.value;
    if (eleId === "id_type") {
        _compData.type = sel;
    } else if (eleId === "id_resizeMode") {
        _compData.resizeMode = sel;
    } else if (eleId === "id_horiazonDirection") {
        _compData.horiazonDirection = sel;
    } else if (eleId === "id_verticalDirection") {
        _compData.verticalDirection = sel;
    } else if (eleId === "id_startAxis") {
        _compData.startAxis = sel;
    } else if (eleId === "id_constraint") {
        _compData.constraint = sel;
    }
}

function onNumChange(event) {
    const eleId = event.target.id;
    const num = parseFloat(event.target.value);
    switch (eleId) {
        case "id_paddingLeft":
            _compData.paddingLeft = num;
            break;
        case "id_paddingRight":
            _compData.paddingRight = num;
            break;
        case "id_paddingTop":
            _compData.paddingTop = num;
            break;
        case "id_paddingBottom":
            _compData.paddingBottom = num;
            break;
        case "id_spacingX":
            _compData.spacingX = num;
            break;
        case "id_spacingY":
            _compData.spacingY = num;
            break;
    }
}
</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enabled" @change="onToggle" :value="_compData.enabled"></ui-checkbox>
            <h3>cc.Layout</h3>
        </div>
        <div class="property">
            <label>Type:</label>
            <ui-select id="id_type" v-model="_compData.type" @change="onSelect">
                <option v-for="(type, index) in enumDesc_Type" :key="index" :value="index">
                    {{ type }}
                </option>
            </ui-select>
        </div>
        <div class="property" v-if="_compData.type==Type.HORIZONTAL">
            <label>Align Horizontal:</label>
            <ui-checkbox id="id_alignHorizontal" @change="onToggle" :value="_compData.alignHorizontal"></ui-checkbox>
        </div>
        <div class="property" v-if="_compData.type==Type.VERTICAL">
            <label>Align Vertical:</label>
            <ui-checkbox id="id_alignVertical" @change="onToggle" :value="_compData.alignVertical"></ui-checkbox>
        </div>
        <div class="property" v-if="_compData.type!=Type.NONE">
            <label>Resize Mode:</label>
            <ui-select id="id_resizeMode" v-model="_compData.resizeMode" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_ResizeMode" :key="index" :value="index">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
        <div class="property" v-if="_compData.type==Type.GRID">
            <label>Start Axis:</label>
            <ui-select id="id_startAxis" v-model="_compData.startAxis" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_AxisDirection" :key="index" :value="index">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
        <div class="property" v-if="_compData.type==Type.HORIZONTAL||_compData.type==Type.GRID">
            <label>Padding Left:</label>
            <ui-num-input id="id_paddingLeft" @change="onNumChange" :value="_compData.paddingLeft" step="0.1"></ui-num-input>
        </div>
        <div class="property" v-if="_compData.type==Type.HORIZONTAL||_compData.type==Type.GRID">
            <label>Padding Right:</label>
            <ui-num-input id="id_paddingRight" @change="onNumChange" :value="_compData.paddingRight" step="0.1"></ui-num-input>
        </div>
        <div class="property" v-if="_compData.type==Type.VERTICAL||_compData.type==Type.GRID">
            <label>Padding Top:</label>
            <ui-num-input id="id_paddingTop" @change="onNumChange" :value="_compData.paddingTop" step="0.1"></ui-num-input>
        </div>
        <div class="property" v-if="_compData.type==Type.VERTICAL||_compData.type==Type.GRID">
            <label>Padding Bottom:</label>
            <ui-num-input id="id_paddingBottom" @change="onNumChange" :value="_compData.paddingBottom" step="0.1"></ui-num-input>
        </div>

        <div class="property" v-if="_compData.type==Type.HORIZONTAL||_compData.type==Type.GRID">
            <label>SpacingX:</label>
            <ui-num-input id="id_spacingX" @change="onNumChange" :value="_compData.spacingX" step="0.1"></ui-num-input>
        </div>
        <div class="property" v-if="_compData.type==Type.VERTICAL||_compData.type==Type.GRID">
            <label>SpacingY:</label>
            <ui-num-input id="id_spacingY" @change="onNumChange" :value="_compData.spacingY" step="0.1"></ui-num-input>
        </div>
        <div class="property" v-if="_compData.type==Type.HORIZONTAL||_compData.type==Type.GRID">
            <label>Horiazon Direction:</label>
            <ui-select id="id_horiazonDirection" v-model="_compData.horiazonDirection" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_HoriazonDirection" :key="index" :value="index">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
        <div class="property" v-if="_compData.type==Type.VERTICAL||_compData.type==Type.GRID">
            <label>Vertical Direction:</label>
            <ui-select id="id_verticalDirection" v-model="_compData.verticalDirection" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_VerticalDirection" :key="index" :value="index">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
        <div class="property" v-if="_compData.type==Type.GRID">
            <label>Constraint:</label>
            <ui-select id="id_constraint" v-model="_compData.constraint" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_Constraint" :key="index" :value="index">
                    {{ mode }}
                </option>
            </ui-select>
        </div>
        <div class="property" v-if="_compData.type!=Type.NONE">
            <label>Affect by scale:</label>
            <ui-checkbox id="id_affectByScale" @change="onToggle" :value="_compData.affectByScale"></ui-checkbox>
        </div>
        
    </div>
</template>

<style scoped>
@import "./inspector.css";

/* label.small {
    width: 50px;
    text-align: right;
}

.vector-input {
    display: flex;
    gap: 10px;
    align-items: center;
} */

</style>
