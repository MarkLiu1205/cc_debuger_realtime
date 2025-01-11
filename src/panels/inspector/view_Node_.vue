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
                <label>X: <input v-model.number="node.position.x" type="number" /></label>
                <label>Y: <input v-model.number="node.position.y" type="number" /></label>
                <label>Z: <input v-model.number="node.position.z" type="number" /></label>
            </div>
        </div>

        <div class="property">
            <label>Rotation:</label>
            <div class="vector-input">
                <label>X: <input v-model.number="node.rotation.x" type="number" /></label>
                <label>Y: <input v-model.number="node.rotation.y" type="number" /></label>
                <label>Z: <input v-model.number="node.rotation.z" type="number" /></label>
            </div>
        </div>

        <div class="property">
            <label>Scale:</label>
            <div class="vector-input">
                <label>X: <input v-model.number="node.scale.x" type="number" /></label>
                <label>Y: <input v-model.number="node.scale.y" type="number" /></label>
                <label>Z: <input v-model.number="node.scale.z" type="number" /></label>
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



select {
    padding: 2px;
}
</style>
