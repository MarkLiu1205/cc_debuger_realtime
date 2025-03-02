
<script lang="ts" setup>
import { inject, onMounted, ref } from 'vue';
import { _funcs } from '../../../tools/_funcs';

const verifyInfo = inject("verifyInfo") as VerifyRespParam

</script>

<template>
    <div class="md-info">
        <div class="row">
            <label class="label_1">{{ _funcs.getI18nText("text_34") }}</label>
            <ui-link>{{ verifyInfo.authorInfo?.helpDocUrl }}</ui-link>
        </div>
        <div class="row">
            <label class="label_1">{{ _funcs.getI18nText("text_35") }}</label>
            <ui-link>{{ verifyInfo.authorInfo?.feedbackUrl }}</ui-link>
        </div>
        <div class="row">
            <label class="label_1">QQ:</label>
            <div v-for="(str, index) in verifyInfo.authorInfo.qq" :key="index" style="padding-right: 15px;">
                <label> {{ str }}</label>
            </div>
            
        </div>
        <div class="row">
            <label class="label_1">QQ群:</label>
            <div v-for="(str, index) in verifyInfo.authorInfo.qqgroups" :key="index" style="padding-right: 15px;">
                <label> {{ str }}</label>
            </div>
        </div>
        <div class="row">
            <label class="label_1">WeChat:</label>
            <div v-for="(str, index) in verifyInfo.authorInfo.wechat" :key="index" style="padding-right: 15px;">
                <label> {{ str }}</label>
            </div>
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
    user-select: text;
}

.row{
    display: flex;
    flex-direction: row;
}

.label_1{
    width: 80px;
    color: orange;
}


</style>
