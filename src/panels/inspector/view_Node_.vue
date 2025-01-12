<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue';

const node = reactive({
    name: "bg",
    active: true,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    layer: "UI_2D",
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
    console.log("event.target.value",event.target.value,"id",event.target.id)
}
</script>

<template>
    <div class="node-properties">
        <div class="property">
            <input type="checkbox" v-model="node.active" />
            <span style="padding-right: 10px;">Node: </span>
            <div v-if="!editingName" @click="toggleEditingName" style="min-width: 60px;">
                <span >{{ node.name }}</span>
            </div>
            <input ref="nameInputRef"
                v-else 
                v-model="node.name" 
                type="text" 
                @blur="handleNameBlur" 
                @keydown.enter="handleNameBlur" 
            />
        </div>

        <div class="property">
            <label>Position:</label>
            <div class="vector-input">
                <ui-num-input id="position.x" @change="onNumChange" :value="node.position.x"  step="0.1" unit="x"></ui-num-input>
                <ui-num-input id="position.y" @change="onNumChange":value="node.position.y"  step="0.1" unit="y"></ui-num-input>
                <ui-num-input id="position.z" @change="onNumChange":value="node.position.z"  step="0.1" unit="z"></ui-num-input>
            </div>
        </div>

        <div class="property">
            <label>Rotation:</label>
            <div class="vector-input">
                <ui-num-input id="rotation.x" @change="onNumChange" :value="node.rotation.x"  step="0.1" unit="x"></ui-num-input>
                <ui-num-input id="rotation.y" @change="onNumChange":value="node.rotation.y"  step="0.1" unit="y"></ui-num-input>
                <ui-num-input id="rotation.z" @change="onNumChange":value="node.rotation.z"  step="0.1" unit="z"></ui-num-input>
            
            </div>
        </div>

        <div class="property">
            <label>Scale:</label>
            <div class="vector-input">
                <!-- <label>X: <input v-model.number="node.scale.x" type="number" /></label>
                <label>Y: <input v-model.number="node.scale.y" type="number" /></label>
                <label>Z: <input v-model.number="node.scale.z" type="number" /></label> -->
                <ui-num-input id="scale.x" @change="onNumChange" :value="node.scale.x"  step="0.1" unit="x"></ui-num-input>
                <ui-num-input id="scale.y" @change="onNumChange":value="node.scale.y"  step="0.1" unit="y"></ui-num-input>
                <ui-num-input id="scale.z" @change="onNumChange":value="node.scale.z"  step="0.1" unit="z"></ui-num-input>
            
            </div>
        </div>

        <div class="property">
            <label for="layer">Layer:</label>
            <select id="layer" v-model="node.layer">
                <option v-for="layer in layers" :key="layer" :value="layer">{{ layer }}</option>
            </select>
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
</style>
