<script setup lang="ts">
import { reactive } from 'vue';

const _compData = reactive({
    enabled: true,
    customMaterial: "d3c7820c-2a98-4429-8bc7-b8453bc9ac41",
    preview: true,
    playOnLoad: true,
    autoRemoveOnFinish: false,
    particleFile: "particle_file.plist",
    spriteFrame: "sprite_frame_id",
    totalParticles: 400,
    duration: -1,
    emissionRate: 250,
    lifeMin: 0.3,
    lifeMax: 0,
    startColor: "#00FF00FF", // Green
    endColor: "#FFFFFFFF",  // White
    angleMin: -90,
    angleMax: 90,
    startSize: 30,
    endSize: 16,
    startSpin: 720,
    endSpin: 0,
    posVarX: 0,
    posVarY: 0,
    positionType: "FREE",
    emitterMode: "GRAVITY",
    gravityX: 0,
    gravityY: -533,
    speed: 150,
    speedVar: 50,
    tangentialAccel: 0,
    tangentialAccelVar: 130,
    radialAccel: 0,
    radialAccelVar: 230,
    rotationIsDir: false,
});

function onToggle(event) {
    const eleId = event.target.id;
    _compData[eleId] = event.target.checked;
}

function onTextChange(event) {
    const eleId = event.target.id;
    _compData[eleId] = event.target.value;
}

function onNumChange(event) {
    const eleId = event.target.id;
    _compData[eleId] = Number(event.target.value);
}

function onSelectChange(event) {
    const eleId = event.target.id;
    _compData[eleId] = event.target.value;
}
</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="enabled" @change="onToggle" :value="_compData.enabled"></ui-checkbox>
            <h3>cc.ParticleSystem2D</h3>
        </div>
        <div class="property">
            <label>CustomMaterial:</label>
            <ui-asset id="customMaterial" @change="onTextChange" droppable="cc.Material" :value="_compData.customMaterial"></ui-asset>
        </div>
        <div class="property">
            <label>Preview:</label>
            <ui-checkbox id="preview" @change="onToggle" :value="_compData.preview"></ui-checkbox>
        </div>
        <div class="property">
            <label>Play On Load:</label>
            <ui-checkbox id="playOnLoad" @change="onToggle" :value="_compData.playOnLoad"></ui-checkbox>
        </div>
        <div class="property">
            <label>Auto Remove On Finish:</label>
            <ui-checkbox id="autoRemoveOnFinish" @change="onToggle" :value="_compData.autoRemoveOnFinish"></ui-checkbox>
        </div>
        <div class="property">
            <label>File:</label>
            <ui-asset id="particleFile" @change="onTextChange" droppable="cc.ParticleAsset" :value="_compData.particleFile"></ui-asset>
        </div>
        <div class="property">
            <label>Sprite Frame:</label>
            <ui-asset id="spriteFrame" @change="onTextChange" droppable="cc.SpriteFrame" :value="_compData.spriteFrame"></ui-asset>
        </div>
        <div class="property">
            <label>Total Particles:</label>
            <ui-num-input id="totalParticles" @change="onNumChange" :value="_compData.totalParticles"></ui-num-input>
        </div>
        <div class="property">
            <label>Duration:</label>
            <ui-num-input id="duration" @change="onNumChange" :value="_compData.duration"></ui-num-input>
        </div>
        <div class="property">
            <label>Emission Rate:</label>
            <ui-num-input id="emissionRate" @change="onNumChange" :value="_compData.emissionRate"></ui-num-input>
        </div>
        <div class="property">
            <label>Life:</label>
            <div class="vector-input">
                <ui-num-input :class="{vertor2:true}" id="lifeMin" @change="onNumChange" :value="_compData.lifeMin"></ui-num-input>
                <ui-num-input :class="{vertor2:true}" id="lifeMax" @change="onNumChange" :value="_compData.lifeMax"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label>Start Color:</label>
            <ui-color id="startColor" @change="onTextChange" :value="_compData.startColor"></ui-color>
        </div>
        <div class="property">
            <label>End Color:</label>
            <ui-color id="endColor" @change="onTextChange" :value="_compData.endColor"></ui-color>
        </div>
        <div class="property">
            <label>Angle:</label>
            <div class="vector-input">
                <ui-num-input :class="{vertor2:true}" id="angleMin" @change="onNumChange" :value="_compData.angleMin"></ui-num-input>
                <ui-num-input :class="{vertor2:true}" id="angleMax" @change="onNumChange" :value="_compData.angleMax"></ui-num-input>
            </div>
        </div>
        <div class="property">
            <label>Start Size:</label>
            <ui-num-input id="startSize" @change="onNumChange" :value="_compData.startSize"></ui-num-input>
        </div>
        <div class="property">
            <label>End Size:</label>
            <ui-num-input id="endSize" @change="onNumChange" :value="_compData.endSize"></ui-num-input>
        </div>
        <div class="property">
            <label>Position Type:</label>
            <ui-select id="positionType" @change="onSelectChange" :value="_compData.positionType">
                <option value="FREE">FREE</option>
                <option value="RELATIVE">RELATIVE</option>
                <option value="GROUPED">GROUPED</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Emitter Mode:</label>
            <ui-select id="emitterMode" @change="onSelectChange" :value="_compData.emitterMode">
                <option value="GRAVITY">GRAVITY</option>
                <option value="RADIUS">RADIUS</option>
            </ui-select>
        </div>
        <div class="property">
            <label>Gravity:</label>
            <div class="vector-input">
                <ui-num-input :class="{vertor2:true}" id="gravityX" @change="onNumChange" :value="_compData.gravityX"></ui-num-input>
                <ui-num-input :class="{vertor2:true}" id="gravityY" @change="onNumChange" :value="_compData.gravityY"></ui-num-input>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";
label {
    width: 105px;
}

label.long {
    width: 120px;
}

ui-textarea {
    width: 190px;
}

ui-num-input {
    width: 190px;
}

ui-num-input.vertor2 {
    width: 85px;
}
</style>
