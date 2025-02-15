<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import CompPropretyWrapper from '../components/CompPropretyWrapper.vue';

const props = defineProps({
    compAttrs:{
        type:Object,
        default:null
    }
})
const compModel = defineModel<CompInfo_Base>()

function onToggle(event) {
    const eleId = event.target.id;
    const value = event.target.checked;
    if (eleId === "id_enabled") {
        compModel.value.enabled = value;
    }
}

onMounted(()=>{
    // console.log("compAttrs",props.compAttrs)
})

</script>

<template>
    <div class="component-properties">
        <div class="title">
            <ui-checkbox id="id_enabled" @change="onToggle" :value="compModel.enabled"></ui-checkbox>
            <h3>{{ compModel.typeStr }}</h3>
        </div>
        <div v-if="compAttrs!=null" v-for="(attrs, propretyName) in compAttrs" :key="propretyName" >
            <CompPropretyWrapper v-model="compModel" :attrs="attrs" :propretyName="propretyName"></CompPropretyWrapper>
        </div>
    </div>
</template>

<style scoped>
@import "./inspector.css";

</style>
