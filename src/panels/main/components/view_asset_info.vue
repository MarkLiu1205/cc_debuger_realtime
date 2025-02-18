
<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { _pluginSocket } from '../../../tools/plugin_socket';

const assetInfo = defineModel<ResTreeItem>() 

onMounted(()=>{
    
})

watch(assetInfo,(newVal,oldVal)=>{
    console.log("assetInfo变化",assetInfo.value)
})

</script>

<template>
    <div class="asset-info">
        
    </div>
</template>

<style scoped>

.asset-info{
    display: flex;
    flex-direction: column; 
    font-size: 15px; 
    padding-top: 15px;
    padding-bottom: 15px;
    padding-left: 10px;
    border: 1px solid rgb(165, 165, 165);
    gap: 5px;
}

.row{
    display: flex;
    flex-direction: row;
    gap: 10px;
}

.blue{
    color: rgb(39, 215, 192);
}
</style>
