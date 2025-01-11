<script setup lang="ts">
import { reactive, ref } from 'vue';

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

const toggleEditingName = () => {
    editingName.value = !editingName.value;
};

const handleNameBlur = () => {
    editingName.value = false;
};
</script>

<template>
    <div class="node-properties">
        <div class="property">
            <input type="checkbox" v-model="node.active" />
                <div v-if="!editingName" @click="toggleEditingName">Node: <span>{{ node.name }}</span></div>
            <input 
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
.node-properties {
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    padding-left: 5px;
    padding-top: 5px;
    padding-bottom: 5px;
    border: 1px outset #fff8f8;
}

.property {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.vector-input {
    display: flex;
    gap: 15px;
}

label {
    display: flex;
    align-items: center;
    width: 60px;
}

input {
    width: 50px;
}

select {
    padding: 2px;
}
</style>
