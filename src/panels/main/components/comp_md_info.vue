
<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { _funcs } from '../../../tools/_funcs';



</script>

<template>
    <div class="md-info">
        <div>
            <label style="color: orange;">{{ _funcs.getI18nText("text_34") }}</label>
            <ui-link>https://www.cocos.com/products</ui-link>
        </div>
        <div>
            <label style="color: orange;">{{ _funcs.getI18nText("text_35") }}</label>
            <ui-link>https://www.cocos.com/products</ui-link>
        </div>
        <div>
            <label style="color: orange;">{{ _funcs.getI18nText("text_36") }}</label>
            <label>QQ 1451784145</label>
        </div>
    </div>
</template>

<style scoped>

.md-info{
    display: flex;
    flex-direction: column; 
    font-size: 15px; 
    padding-top: 15px;
    padding-bottom: 15px;
    padding-left: 10px;
    border: 1px solid rgb(165, 165, 165);
    gap: 5px;
}
</style>
