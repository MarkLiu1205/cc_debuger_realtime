<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue';

const enumDesc_Layers = [
    "UI_2D", "UI_3D", "World", "Background"
]

const _nodeData = reactive({
    name: "bg",
    active: true,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    layer: enumDesc_Layers.indexOf("UI_2D"),
});



const layers = ref(["UI_2D", "UI_3D", "World", "Background"]);
const editingName = ref(false);

const nameInputRef = ref<HTMLInputElement | null>(null);

const toggleEditingName = () => {
  editingName.value = !editingName.value;
  if (editingName.value) {
    nextTick(() => {
      nameInputRef.value?.focus();
    });
  }
};

const handleNameBlur = () => {
    editingName.value = false;
};

function onNumChange(event){
    const num = event.target.value
    const eleId = event.target.id
    if(eleId=="position.x"){
        _nodeData.position.x = num
    }else if(eleId=="position.y"){
        _nodeData.position.y = num
    }else if(eleId=="position.z"){
        _nodeData.position.z = num
    }else if(eleId=="rotation.x"){
        _nodeData.rotation.x = num
    }else if(eleId=="rotation.y"){
        _nodeData.rotation.y = num
    }else if(eleId=="rotation.z"){
        _nodeData.rotation.z = num
    }else if(eleId=="scale.x"){
        _nodeData.scale.x = num
    }else if(eleId=="scale.y"){
        _nodeData.scale.y = num
    }else if(eleId=="scale.z"){
        _nodeData.scale.z = num
    }
    console.log("_nodeData.position",_nodeData.position,"id",event.target.id)
}

function onToggle(event){
    _nodeData.active = event.target.value
    console.log("event.target.value",event.target.value,"id",event.target.id)
}

function onSelect(event){
    console.log("layer changed to:", event.target.value)
}

</script>

<template>
    <div class="node-properties">
        <div class="property">
            <ui-checkbox id="id_active" @change="onToggle" :value="_nodeData.active"></ui-checkbox>

            <h3 style="padding-right: 10px;">Node: </h3>
            <div v-if="!editingName" @click="toggleEditingName" style="min-width: 60px;">
                <span >{{ _nodeData.name }}</span>
            </div>
            <input ref="nameInputRef"
                v-else 
                v-model="_nodeData.name" 
                type="text" 
                @blur="handleNameBlur" 
                @keydown.enter="handleNameBlur" 
            />
        </div>

        <div class="property">
            <label>Position:</label>
            <div class="vector-input">
                <ui-num-input id="position.x" @change="onNumChange" :value="_nodeData.position.x"  step="0.1" unit="x"></ui-num-input>
                <ui-num-input id="position.y" @change="onNumChange":value="_nodeData.position.y"  step="0.1" unit="y"></ui-num-input>
                <ui-num-input id="position.z" @change="onNumChange":value="_nodeData.position.z"  step="0.1" unit="z"></ui-num-input>
            </div>
        </div>

        <div class="property">
            <label>Rotation:</label>
            <div class="vector-input">
                <ui-num-input id="rotation.x" @change="onNumChange" :value="_nodeData.rotation.x"  step="0.1" unit="x"></ui-num-input>
                <ui-num-input id="rotation.y" @change="onNumChange":value="_nodeData.rotation.y"  step="0.1" unit="y"></ui-num-input>
                <ui-num-input id="rotation.z" @change="onNumChange":value="_nodeData.rotation.z"  step="0.1" unit="z"></ui-num-input>
            
            </div>
        </div>

        <div class="property">
            <label>Scale:</label>
            <div class="vector-input">
                <!-- <label>X: <input v-model.number="_nodeData.scale.x" type="number" /></label>
                <label>Y: <input v-model.number="_nodeData.scale.y" type="number" /></label>
                <label>Z: <input v-model.number="_nodeData.scale.z" type="number" /></label> -->
                <ui-num-input id="scale.x" @change="onNumChange" :value="_nodeData.scale.x"  step="0.1" unit="x"></ui-num-input>
                <ui-num-input id="scale.y" @change="onNumChange":value="_nodeData.scale.y"  step="0.1" unit="y"></ui-num-input>
                <ui-num-input id="scale.z" @change="onNumChange":value="_nodeData.scale.z"  step="0.1" unit="z"></ui-num-input>
            
            </div>
        </div>

        <div class="property">
            <label>Layer:</label>
            <ui-select id="layer" v-model="_nodeData.layer" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_Layers" :key="index" :value="index">{{ mode }}</option>
            </ui-select>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";

label {
    display: flex;
    align-items: center;
    width: 60px;
}

ui-num-input {
    width: 68px;
}

select {
    padding: 2px;
}

ui-select {
    width: 200px;
}
</style>
