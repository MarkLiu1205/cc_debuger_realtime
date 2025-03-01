<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { _pluginSocket } from '../../../tools/plugin_socket';

const enumDesc_Layers = ref<string[]>([])
const enumsMap = ref({})

onMounted(async () => {
    const enums = await _pluginSocket.getNodeLayerEnums()
    const arr = Object.keys(enums).sort((a, b) => {
        return enums[a] - enums[b]
    })
    enumDesc_Layers.value = arr
    enumsMap.value = enums
    // console.log("--------xx", enums)
    // console.log("--------keys", arr)
})

const nodeModel = defineModel<NodeInfo>()


const editingName = ref(false);
const nameInputRef = ref<HTMLInputElement | null>(null);

function onToggle(event) {
    const id = event.target.id;
    const checked = event.target.checked;
    if (id === "id_active") {
        nodeModel.value.active = checked;
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
        nodeModel.value.position.x = num
    }else if(eleId=="position.y"){
        nodeModel.value.position.y = num
    }else if(eleId=="position.z"){
        nodeModel.value.position.z = num
    }else if(eleId=="rotation.x"){
        nodeModel.value.rotation.x = num
    }else if(eleId=="rotation.y"){
        nodeModel.value.rotation.y = num
    }else if(eleId=="rotation.z"){
        nodeModel.value.rotation.z = num
    }else if(eleId=="scale.x"){
        nodeModel.value.scale.x = num
    }else if(eleId=="scale.y"){
        nodeModel.value.scale.y = num
    }else if(eleId=="scale.z"){
        nodeModel.value.scale.z = num
    }
}


function onSelect(event){
    // console.log("layer changed to:", event.target.value)
    nodeModel.value.layer = event.target.value
}

</script>

<template>
    <div class="node-properties" v-if="nodeModel!=null">
        <div class="property">
            <ui-checkbox id="id_active" :value="nodeModel.active" @change="onToggle"></ui-checkbox>

            <h3 style="padding-right: 10px;">Node: </h3>
            <div v-if="!editingName" @click="toggleEditingName" style="min-width: 60px;">
                <span >{{ nodeModel.name }}</span>
            </div>
            <ui-input ref="nameInputRef"
                v-else 
                v-model="nodeModel.name" 
                type="text" 
                @blur="handleNameBlur" 
                @keydown.enter="handleNameBlur" 
            />
        </div>

        <div class="property">
            <label>Position:</label>
            <div class="vector-input">
                <ui-num-input id="position.x" @change="onNumChange" :value="nodeModel.position.x"  step="0.1" unit="x"></ui-num-input>
                <ui-num-input id="position.y" @change="onNumChange":value="nodeModel.position.y"  step="0.1" unit="y"></ui-num-input>
                <ui-num-input id="position.z" @change="onNumChange":value="nodeModel.position.z"  step="0.1" unit="z"></ui-num-input>
            </div>
        </div>

        <div class="property">
            <label>Rotation:</label>
            <div class="vector-input">
                <ui-num-input id="rotation.x" @change="onNumChange" :value="nodeModel.rotation.x"  step="0.1" unit="x"></ui-num-input>
                <ui-num-input id="rotation.y" @change="onNumChange":value="nodeModel.rotation.y"  step="0.1" unit="y"></ui-num-input>
                <ui-num-input id="rotation.z" @change="onNumChange":value="nodeModel.rotation.z"  step="0.1" unit="z"></ui-num-input>
            
            </div>
        </div>

        <div class="property">
            <label>Scale:</label>
            <div class="vector-input">
                <ui-num-input id="scale.x" @change="onNumChange" :value="nodeModel.scale.x"  step="0.1" unit="x"></ui-num-input>
                <ui-num-input id="scale.y" @change="onNumChange":value="nodeModel.scale.y"  step="0.1" unit="y"></ui-num-input>
                <ui-num-input id="scale.z" @change="onNumChange":value="nodeModel.scale.z"  step="0.1" unit="z"></ui-num-input>
            
            </div>
        </div>

        <div class="property">
            <label>Layer:</label>
            <ui-select id="layer" v-model="nodeModel.layer" @change="onSelect">
                <option v-for="(mode, index) in enumDesc_Layers" :key="index" :value="enumsMap[mode]">{{ mode }}</option>
            </ui-select>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";

ui-num-input {
    width: calc((100% - 15px*2) / 3);
}

</style>
