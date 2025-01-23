<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue';

const enumDesc_Layers = [
    "UI_2D", "UI_3D", "World", "Background"
]

// const _nodeData = reactive({
//     name: "bg",
//     active: true,
//     position: { x: 0, y: 0, z: 0 },
//     rotation: { x: 0, y: 0, z: 0 },
//     scale: { x: 1, y: 1, z: 1 },
//     layer: enumDesc_Layers.indexOf("UI_2D"),
// });

const model = defineModel<NodeInfo>()


const editingName = ref(false);
const nameInputRef = ref<HTMLInputElement | null>(null);

function onToggle(event) {
    const id = event.target.id;
    const checked = event.target.checked;
    if (id === "id_active") {
        model.value.active = checked;
    }
}

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
        model.value.position.x = num
    }else if(eleId=="position.y"){
        model.value.position.y = num
    }else if(eleId=="position.z"){
        model.value.position.z = num
    }else if(eleId=="rotation.x"){
        model.value.rotation.x = num
    }else if(eleId=="rotation.y"){
        model.value.rotation.y = num
    }else if(eleId=="rotation.z"){
        model.value.rotation.z = num
    }else if(eleId=="scale.x"){
        model.value.scale.x = num
    }else if(eleId=="scale.y"){
        model.value.scale.y = num
    }else if(eleId=="scale.z"){
        model.value.scale.z = num
    }
}


function onSelect(event){
    console.log("layer changed to:", event.target.value)
}

</script>

<template>
    <div class="node-properties" v-if="model!=null">
        <div class="property">
            <ui-checkbox id="id_active" :value="model.active" @change="onToggle"></ui-checkbox>

            <h3 style="padding-right: 10px;">Node: </h3>
            <div v-if="!editingName" @click="toggleEditingName" style="min-width: 60px;">
                <span >{{ model.name }}</span>
            </div>
            <input ref="nameInputRef"
                v-else 
                v-model="model.name" 
                type="text" 
                @blur="handleNameBlur" 
                @keydown.enter="handleNameBlur" 
            />
        </div>

        <div class="property">
            <label>Position:</label>
            <div class="vector-input">
                <ui-num-input id="position.x" @change="onNumChange" :value="model.position.x"  step="0.1" unit="x"></ui-num-input>
                <ui-num-input id="position.y" @change="onNumChange":value="model.position.y"  step="0.1" unit="y"></ui-num-input>
                <ui-num-input id="position.z" @change="onNumChange":value="model.position.z"  step="0.1" unit="z"></ui-num-input>
            </div>
        </div>

        <div class="property">
            <label>Rotation:</label>
            <div class="vector-input">
                <ui-num-input id="rotation.x" @change="onNumChange" :value="model.rotation.x"  step="0.1" unit="x"></ui-num-input>
                <ui-num-input id="rotation.y" @change="onNumChange":value="model.rotation.y"  step="0.1" unit="y"></ui-num-input>
                <ui-num-input id="rotation.z" @change="onNumChange":value="model.rotation.z"  step="0.1" unit="z"></ui-num-input>
            
            </div>
        </div>

        <div class="property">
            <label>Scale:</label>
            <div class="vector-input">
                <!-- <label>X: <input v-model.number="model.scale.x" type="number" /></label>
                <label>Y: <input v-model.number="model.scale.y" type="number" /></label>
                <label>Z: <input v-model.number="model.scale.z" type="number" /></label> -->
                <ui-num-input id="scale.x" @change="onNumChange" :value="model.scale.x"  step="0.1" unit="x"></ui-num-input>
                <ui-num-input id="scale.y" @change="onNumChange":value="model.scale.y"  step="0.1" unit="y"></ui-num-input>
                <ui-num-input id="scale.z" @change="onNumChange":value="model.scale.z"  step="0.1" unit="z"></ui-num-input>
            
            </div>
        </div>

        <div class="property">
            <label>Layer:</label>
            <ui-select id="layer" v-model="model.layer" @change="onSelect">
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
