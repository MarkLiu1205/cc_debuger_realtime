<script setup lang="ts">
import { reactive } from 'vue';
import { _funcs } from '../../../tools/_funcs';


const enumDesc_EmitterMode = [
    "GRAVITY",
    "RADIUS"
]
const enumDesc_PositionType = [
    "FREE",
    "RELATIVE",
    "GROUPED",
]

// const _compData = reactive({
//     enabled: true,
//     customMaterial: "d3c7820c-2a98-4429-8bc7-b8453bc9ac41",
//     preview: true,
//     playOnLoad: true,
//     autoRemoveOnFinish: false,
//     file: "particle_file.plist",
//     spriteFrame: "sprite_frame_id",
//     totalParticles: 400,
//     duration: -1,
//     emissionRate: 250,
//     life: 0.3,
//     lifeVar: 0,
//     startColor: "#00FF00FF", // Green
//     startColorVar: "#00FF00FF",
//     endColor: "#FFFFFFFF",
//     endColorVar: "#FFFFFFFF",
//     angle: -90,
//     angleVar: 90,
//     startSize: 30,
//     startSizeVar: 30,
//     endSize: 16,
//     endSizeVar: 16,
//     startSpin: 720,
//     startSpinVar: 720,
//     endSpin: 0,
//     endSpinVar: 0,
//     posVar: {x:0,y:0},
//     positionType: "FREE",
//     emitterMode: "GRAVITY",
//     gravity: {x:0,y:0},
//     speed: 150,
//     speedVar: 50,
//     tangentialAccel: 0,
//     tangentialAccelVar: 130,
//     radialAccel: 0,
//     radialAccelVar: 230,
//     rotationIsDir: false,
// });

const compModel = defineModel<CompInfo_ParticleSystem2D>()

function onToggle(event) {
    const eleId = event.target.id;
    compModel.value[eleId] = event.target.checked;
}

function onTextChange(event) {
    const eleId = event.target.id;
    compModel.value[eleId] = event.target.value;
}

function onNumChange(event) {
    const eleId = event.target.id;
    const value = parseFloat(event.target.value)
    if(eleId=="gravity.x"){
        compModel.value.gravity.x = value
    }else if(eleId=="gravity.y"){
        compModel.value.gravity.y = value
    }else if(eleId=="posVar.x"){
        compModel.value.posVar.x = value
    }else if(eleId=="posVar.y"){
        compModel.value.posVar.y = value
    }else{
        compModel.value[eleId] = value
    }
    
}

function onSelectChange(event) {
    const eleId = event.target.id;
    const value = parseInt(event.target.value)
    compModel.value[eleId] = value;
}

function onColorChange(event) {
    const eleId = event.target.id;
    const [r,g,b,a] = event.target.value
    
    const value = _funcs.rgbaToHex(r,g,b,a)
    compModel.value[eleId] = value

}

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="enabled" @change="onToggle" :value="compModel.enabled"></ui-checkbox>
            <h3>cc.ParticleSystem2D</h3>
        </div>
        <div class="property">
            <label>CustomMaterial:</label>
            <ui-asset id="customMaterial" @change="onTextChange" droppable="cc.Material" :value="compModel.customMaterial"></ui-asset>
        </div>
        <div class="property">
            <label>Preview:</label>
            <ui-checkbox id="preview" @change="onToggle" :value="compModel.preview"></ui-checkbox>
        </div>
        <div class="property">
            <label>Play On Load:</label>
            <ui-checkbox id="playOnLoad" @change="onToggle" :value="compModel.playOnLoad"></ui-checkbox>
        </div>
        <div class="property">
            <label>Auto Remove On Finish:</label>
            <ui-checkbox id="autoRemoveOnFinish" @change="onToggle" :value="compModel.autoRemoveOnFinish"></ui-checkbox>
        </div>
        <div class="property">
            <label>File:</label>
            <ui-asset id="file" @change="onTextChange" droppable="cc.ParticleAsset" :value="compModel.file"></ui-asset>
        </div>
        <div class="property">
            <label>Sprite Frame:</label>
            <ui-asset id="spriteFrame" @change="onTextChange" droppable="cc.SpriteFrame" :value="compModel.spriteFrame"></ui-asset>
        </div>
        <div class="property">
            <label>Total Particles:</label>
            <ui-num-input id="totalParticles" @change="onNumChange" :value="compModel.totalParticles"></ui-num-input>
        </div>
        <div class="property">
            <label>Duration:</label>
            <ui-num-input id="duration" @change="onNumChange" :value="compModel.duration"></ui-num-input>
        </div>
        <div class="property">
            <label>Emission Rate:</label>
            <ui-num-input id="emissionRate" @change="onNumChange" :value="compModel.emissionRate"></ui-num-input>
        </div>
        <div class="property">
            <label>Life:</label>
            <div class="vector-input">
                <ui-num-input :class="{vertor2:true}" id="life" @change="onNumChange" :value="compModel.life"></ui-num-input>
                <ui-num-input :class="{vertor2:true}" id="lifeVar" @change="onNumChange" :value="compModel.lifeVar"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label>Start Color:</label>
            <div class="vector-input">
                <ui-color :class="{vertor2:true}" id="startColor" @change="onColorChange" :value="compModel.startColor"></ui-color>
                <ui-color :class="{vertor2:true}" id="startColorVar" @change="onColorChange" :value="compModel.startColorVar"></ui-color>
            </div>
        </div>
        <div class="property">
            <label>End Color:</label>
            <div class="vector-input">
                <ui-color :class="{vertor2:true}" id="endColor" @change="onColorChange" :value="compModel.endColor"></ui-color>
                <ui-color :class="{vertor2:true}" id="endColorVar" @change="onColorChange" :value="compModel.endColorVar"></ui-color>
            </div>
        </div>
        <div class="property">
            <label>Angle:</label>
            <div class="vector-input">
                <ui-num-input :class="{vertor2:true}" id="angle" @change="onNumChange" :value="compModel.angle"></ui-num-input>
                <ui-num-input :class="{vertor2:true}" id="angleVar" @change="onNumChange" :value="compModel.angleVar"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label>Start Size:</label>
            <div class="vector-input">
                <ui-num-input :class="{vertor2:true}" id="startSize" @change="onNumChange" :value="compModel.startSize"></ui-num-input>
                <ui-num-input :class="{vertor2:true}" id="startSizeVar" @change="onNumChange" :value="compModel.startSizeVar"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label>End Size:</label>
            <div class="vector-input">
                <ui-num-input :class="{vertor2:true}" id="endSize" @change="onNumChange" :value="compModel.endSize"></ui-num-input>
                <ui-num-input :class="{vertor2:true}" id="endSizeVar" @change="onNumChange" :value="compModel.endSizeVar"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label>Start Spin:</label>
            <div class="vector-input">
                <ui-num-input :class="{vertor2:true}" id="startSpin" @change="onNumChange" :value="compModel.startSpin"></ui-num-input>
                <ui-num-input :class="{vertor2:true}" id="startSpinVar" @change="onNumChange" :value="compModel.startSpinVar"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label>End Spin:</label>
            <div class="vector-input">
                <ui-num-input :class="{vertor2:true}" id="endSpin" @change="onNumChange" :value="compModel.endSpin"></ui-num-input>
                <ui-num-input :class="{vertor2:true}" id="endSpinVar" @change="onNumChange" :value="compModel.endSpinVar"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label>Pos Var:</label>
            <div class="vector-input">
                <ui-num-input :class="{vertor2:true}" id="posVar.x" @change="onNumChange" :value="compModel.posVar.x"></ui-num-input>
                <ui-num-input :class="{vertor2:true}" id="posVar.y" @change="onNumChange" :value="compModel.posVar.y"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label>Position Type:</label>
            <ui-select id="positionType" :value="compModel.positionType" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_PositionType" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Emitter Mode:</label>
            <ui-select id="emitterMode" :value="compModel.emitterMode" @change="onSelectChange">
                <option v-for="(mode, index) in enumDesc_EmitterMode" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Gravity:</label>
            <div class="vector-input">
                <ui-num-input :class="{vertor2:true}" id="gravity.x" @change="onNumChange" :value="compModel.gravity.x"></ui-num-input>
                <ui-num-input :class="{vertor2:true}" id="gravity.y" @change="onNumChange" :value="compModel.gravity.y"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label>Speed:</label>
            <div class="vector-input">
                <ui-num-input :class="{vertor2:true}" id="speed" @change="onNumChange" :value="compModel.speed"></ui-num-input>
                <ui-num-input :class="{vertor2:true}" id="speedVar" @change="onNumChange" :value="compModel.speedVar"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label>Tangential Accel:</label>
            <div class="vector-input">
                <ui-num-input :class="{vertor2:true}" id="tangentialAccel" @change="onNumChange" :value="compModel.tangentialAccel"></ui-num-input>
                <ui-num-input :class="{vertor2:true}" id="tangentialAccelVar" @change="onNumChange" :value="compModel.tangentialAccelVar"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label>Radial Accel:</label>
            <div class="vector-input">
                <ui-num-input :class="{vertor2:true}" id="radialAccel" @change="onNumChange" :value="compModel.radialAccel"></ui-num-input>
                <ui-num-input :class="{vertor2:true}" id="radialAccelVar" @change="onNumChange" :value="compModel.radialAccelVar"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label>Rotation Is Dir:</label>
            <ui-checkbox id="rotationIsDir" @change="onToggle" :value="compModel.rotationIsDir"></ui-checkbox>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";

label.long {
    width: 120px;
}

ui-num-input.vertor2 {
    width: 85px;
}
ui-color.vertor2 {
    width: 85px;
}
</style>
