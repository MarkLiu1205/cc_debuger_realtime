<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue';
import { _funcs } from '../../../tools/_funcs';


enum ClearFlag {
    SKYBOX = 14,
    SOLID_COLOR = 7, 
    DEPTH_ONLY = 6, 
    DONT_CLEAR = 0
}

enum CameraProjection {
    ORTHO = 0,
    PERSPECTIVE = 1
}

enum CameraFOVAxis {
    VERTICAL = 0,
    HORIZONTAL = 1
}

enum CameraAperture {
    F1_8 = 0,
    F2_0 = 1,
    F2_2 = 2,
    F2_5 = 3,
    F2_8 = 4,
    F3_2 = 5,
    F3_5 = 6,
    F4_0 = 7,
    F4_5 = 8,
    F5_0 = 9,
    F5_6 = 10,
    F6_3 = 11,
    F7_1 = 12,
    F8_0 = 13,
    F9_0 = 14,
    F10_0 = 15,
    F11_0 = 16,
    F13_0 = 17,
    F14_0 = 18,
    F16_0 = 19,
    F18_0 = 20,
    F20_0 = 21,
    F22_0 = 22
}

enum CameraShutter {
    D1 = 0,
    D2 = 1,
    D4 = 2,
    D8 = 3,
    D15 = 4,
    D30 = 5,
    D60 = 6,
    D125 = 7,
    D250 = 8,
    D500 = 9,
    D1000 = 10,
    D2000 = 11,
    D4000 = 12
}

enum CameraISO {
    ISO100 = 0,
    ISO200 = 1,
    ISO400 = 2,
    ISO800 = 3
}

const enumDesc_CameraProjection = [
    "ORTHO",
    "PERSPECTIVE",
]

const enumDesc_CameraFOVAxis = [
    "VERTICAL",
    "HORIZONTAL",
]

const enumDesc_CameraAperture = [
    "F1_8",
    "F2_0",
    "F2_2",
    "F2_5",
    "F2_8",
    "F3_2",
    "F3_5",
    "F4_0",
    "F4_5",
    "F5_0",
    "F5_6",
    "F6_3",
    "F7_1",
    "F8_0",
    "F9_0",
    "F10_0",
    "F11_0",
    "F13_0",
    "F14_0",
    "F16_0",
    "F18_0",
    "F20_0",
    "F22_0",
]

const enumDesc_CameraShutter = [
    "D1",
    "D2",
    "D4",
    "D8",
    "D15",
    "D30",
    "D60",
    "D125",
    "D250",
    "D500",
    "D1000",
    "D2000",
    "D4000",
]

const enumDesc_CameraISO = [
    "ISO100",
    "ISO200",
    "ISO400",
    "ISO800",
]

// const _compData = reactive({
//     enabled: true,
//     priority: 0,
//     visibility: 0,
//     clearFlags: ClearFlag.SOLID_COLOR,
//     clearColor: "#000000",
//     clearDepth:0,
//     clearStencil:0,
//     projection: CameraProjection.ORTHO,
//     fovAxis: CameraFOVAxis.VERTICAL,
//     fov: 45,
//     near: 0.1,
//     far: 1000,
//     orthoHeight: 10,
//     targetTexture: null,
//     postProcess: false,
//     aperture: CameraAperture.F16_0,
//     shutter: CameraShutter.D125,
//     iso: CameraISO.ISO200,
//     rect: {x:0,y:0,z:0,w:0},
// });

const compModel = defineModel<CompInfo_Camera>()

function onToggle(event) {
    const id = event.target.id;
    const checked = event.target.checked;
    if (id === "enabled") {
        compModel.value.enabled = checked;
    }
}

function onNumChange(event) {
    const id = event.target.id;
    const value = parseFloat(event.target.value);
    if (id === "priority") {
        compModel.value.priority = value;
    } else if (id === "fov") {
        compModel.value.fov = value;
    } else if (id === "near") {
        compModel.value.near = value;
    } else if (id === "far") {
        compModel.value.far = value;
    } else if (id === "id_orthoHeight") {
        compModel.value.orthoHeight = value;
    } else if (id === "id_clearDepth") {
        compModel.value.clearDepth = value;
    } else if (id === "id_clearStencil") {
        compModel.value.clearStencil = value;
    } else if (id === "rect.x") {
        compModel.value.rect.x = value;
    } else if (id === "rect.y") {
        compModel.value.rect.y = value;
    } else if (id === "rect.z") {
        compModel.value.rect.z = value;
    } else if (id === "rect.w") {
        compModel.value.rect.w = value;
    }
}

function onSelectChange(event) {
    const id = event.target.id;
    const value = event.target.value;
    if (id === "id_projection") {
        compModel.value.projection = parseInt(value);
    } else if (id === "id_clearFlags") {
        compModel.value.clearFlags = parseInt(value);
    } else if (id === "id_fovAxis") {
        compModel.value.fovAxis = parseInt(value);
    } else if (id === "id_aperture") {
        compModel.value.aperture = parseInt(value);
    } else if (id === "id_shutter") {
        compModel.value.shutter = parseInt(value);
    } else if (id === "id_iso") {
        compModel.value.iso = parseInt(value);
    } 
    console.log("value",value,typeof value,"id",id)
}

function onConfirmColor(event){
    const [r,g,b,a] = event.target.value
    
    compModel.value.clearColor = _funcs.rgbaToHex(r,g,b,a)
}

function onAssetChange(event) {
    const value = event.target.value;
    compModel.value.targetTexture = value;
}

const editingVisibility = ref(false);
const visibilityInputRef = ref(null)
const toggleVisibility = () => {
  editingVisibility.value = !editingVisibility.value;
  if (editingVisibility.value) {
    nextTick(() => {
      visibilityInputRef.value?.focus();
    });
  }
};

const handleNameBlur = () => {
    editingVisibility.value = false;
};

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="enabled" :value="compModel.enabled" @change="onToggle"></ui-checkbox>
            <h3>Camera</h3>
        </div>

        <div class="property">
            <label>Priority:</label>
            <ui-num-input id="priority" :value="compModel.priority" @change="onNumChange" step="1" min="0"></ui-num-input>
        </div>
        <div class="property">
            <label>Visibility:</label>
            <div v-if="!editingVisibility" @click="toggleVisibility" style="min-width: 60px;">
                <span >{{ compModel.visibility }}</span>
            </div>
            <ui-num-input ref="visibilityInputRef"
                v-else 
                v-model="compModel.visibility" 
                type="text" 
                @blur="handleNameBlur" 
                @keydown.enter="handleNameBlur" 
                step="1" min="0"
            />
        </div>

        <div class="property">
            <label>Clear Flags:</label>
            <ui-select id="id_clearFlags" :value="compModel.clearFlags" @change="onSelectChange">
                <option :value="ClearFlag.DONT_CLEAR">DONT_CLEAR</option>
                <option :value="ClearFlag.DEPTH_ONLY">DEPTH_ONLY</option>
                <option :value="ClearFlag.SOLID_COLOR">SOLID_COLOR</option>
                <option :value="ClearFlag.SKYBOX">SKYBOX</option>
            </ui-select>
        </div>

        <div class="property">
            <label>ClearColor:</label>
            <ui-color :value="compModel.clearColor" @confirm="onConfirmColor"></ui-color>
        </div>
        <div class="property">
            <label>Clear Depth:</label>
            <ui-num-input id="id_clearDepth" :value="compModel.clearDepth" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property">
            <label>Clear Stencil:</label>
            <ui-num-input id="id_clearStencil" :value="compModel.clearStencil" @change="onNumChange"></ui-num-input>
        </div>

        <div class="property">
            <label>Projection:</label>
            <ui-select id="id_projection" :value="compModel.projection" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_CameraProjection" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property" v-if="compModel.projection === CameraProjection.ORTHO">
            <label>Ortho Height:</label>
            <ui-num-input id="id_orthoHeight" :value="compModel.orthoHeight" @change="onNumChange"></ui-num-input>
        </div>

        <div class="property" v-if="compModel.projection === CameraProjection.PERSPECTIVE">
            <label>Fov Axis:</label>
            <ui-select id="id_fovAxis" :value="compModel.fovAxis" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_CameraFOVAxis" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>

        <div class="property" v-if="compModel.projection === CameraProjection.PERSPECTIVE">
            <label>Fov:</label>
            <ui-num-input id="id_fov" :value="compModel.fov" @change="onNumChange"></ui-num-input>
        </div>

        <div class="property">
            <label>Near:</label>
            <ui-num-input id="near" :value="compModel.near" @change="onNumChange"></ui-num-input>
        </div>

        <div class="property">
            <label>Far:</label>
            <ui-num-input id="far" :value="compModel.far" @change="onNumChange"></ui-num-input>
        </div>
        <div class="property">
            <label>Aperture:</label>
            <ui-select id="id_aperture" :value="compModel.aperture" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_CameraAperture" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Shutter:</label>
            <ui-select id="id_shutter" :value="compModel.shutter" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_CameraShutter" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Iso:</label>
            <ui-select id="id_iso" :value="compModel.iso" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_CameraISO" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Rect:</label>
            <div class="vector-input">
                <ui-num-input :class="{vector2:true}" id="rect.x" @change="onNumChange" :value="compModel.rect.x" unit="x"></ui-num-input>
                <ui-num-input :class="{vector2:true}" id="rect.y" @change="onNumChange":value="compModel.rect.y" unit="y"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label></label>
            <div class="vector-input">
                <ui-num-input :class="{vector2:true}" id="rect.z" @change="onNumChange" :value="compModel.rect.z" unit="z"></ui-num-input>
                <ui-num-input :class="{vector2:true}" id="rect.w" @change="onNumChange":value="compModel.rect.w" unit="w"></ui-num-input>
            </div>
        </div>

        <div class="property">
            <label>TargetTexture:</label>
            <ui-asset id="targetTexture" :value="compModel.targetTexture" @change="onAssetChange" droppable="cc.RenderTexture"></ui-asset>
        </div>

    </div>
</template>

<style scoped>
@import "./inspector.css";


ui-num-input.vector2 {
    width: 85px;
}
</style>
