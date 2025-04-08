
<script lang="ts" setup>
import { computed, inject, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { _funcs } from '../../../tools/_funcs';
import { eventBus } from '../../../tools/_enentBus';
import { _pluginSocket } from '../../../tools/plugin_socket';
import dlg_pay_help from './dlg_pay_help.vue';
import dlg_pay_shop from './dlg_pay_shop.vue';

const verifyInfo = inject("verifyInfo") as VerifyRespParam

const emit = defineEmits([
    "onJumpTrial"
])
const ref_payDlg = ref(null)

//正在验证购买
const isVerifying = computed(()=>{
    return verifyInfo.state==0
})

//试用期
const isInTrialing = computed(()=>{
    return verifyInfo.state==2
})

//试用期结束，未激活
const isVerifyFailed = computed(()=>{
    if(verifyInfo.state==1){
        return true 
    }
    return false
})

//激活码已过期
const isExpired = computed(()=>{
    return verifyInfo.state==4
})

const verify_code = ref("")

function onEditVerifyCode(event){
    verify_code.value = event.target.value
}

const onBtnDoVerify = inject("do_verify_activation_code") as (code:string)=>void

function onBtnPayHelp(){
    ref_payDlg.value.openDialog()
}

const tipExpired = computed(()=>{
    const _endTime = verifyInfo.endTime
    const dateStr = _funcs.formatDate("yyyy-MM-dd hh:mm",_endTime*1000)
    return _funcs.formatStr(_funcs.getI18nText("text_116"),dateStr)
})

const tipInTrialing = computed(()=>{
    const _endTime = verifyInfo.endTime
    const dateStr = _funcs.formatDate("yyyy-MM-dd hh:mm",_endTime*1000)
    return _funcs.formatStr(_funcs.getI18nText("text_115"),dateStr)
})

function onClickJump(){
    emit('onJumpTrial')
}

const errorTip = computed(()=>{
    if(verifyInfo.statusCode==200){
        if(verifyInfo.endTime&&verifyInfo.endTime!=0){
            const _endTime = verifyInfo.endTime - 8*3600//转为北京时间
            const dateStr = _funcs.formatDate("yyyy-MM-dd hh:mm",_endTime*1000)
            return _funcs.formatStr(_funcs.getI18nText("text_117"),dateStr)
        }else{
            return _funcs.getI18nText("text_95")
        }
    }else{
        return verifyInfo.msg
    }
})

</script>

<template>
    <div v-if="isVerifying" class="loading">
        <h2>{{ _funcs.getI18nText("text_114") }}</h2>
        <ui-loading></ui-loading>
    </div>
    <div class="verify_view" v-else-if="isVerifyFailed||isInTrialing||isExpired">
        <div v-if="isInTrialing" style="gap: 20px; display: flex;flex-direction: row;text-align: center;justify-content: center;align-items: center;">
            <h2 >{{ tipInTrialing }}</h2>
            <ui-button style="padding-top: 5px;padding-bottom: 5px;" @click="onClickJump">{{ _funcs.getI18nText("text_113") }}</ui-button>
        </div>
        <h2 v-else-if="isVerifyFailed">{{ errorTip }}</h2>
        <h2 v-else-if="isExpired">{{ tipExpired }}</h2>
        <div style="display: flex; flex-direction: row;gap: 10px;justify-content: center;align-items: center;">
            <h3>{{ _funcs.getI18nText("text_96") }}</h3>
            <ui-button type="icon" :tooltip='_funcs.getI18nText("text_112")' @click="onBtnPayHelp">
                <ui-icon value="help"></ui-icon>
            </ui-button>
        </div>
        <div style="padding: 20px; justify-content: center;align-items: center;text-align: center; display: flex; flex-direction: column; gap: 10px; border: 1px solid #ccc;">
            <h3>{{ _funcs.getI18nText("text_97") }}</h3>
            <ui-input ref="addressInputRef" style="font-size: 15px;width: 240px;"
                :model="verify_code"
                type="text" 
                @change="onEditVerifyCode"
            />
            <ui-button style="padding-top: 5px;padding-bottom: 5px;" @click="onBtnDoVerify(verify_code)">{{ _funcs.getI18nText("text_98") }}</ui-button>
        </div>
        
        <dlg_pay_shop ref="ref_payDlg"/>
    </div>
</template>

<style scoped>

.verify_view{
    user-select: text;
    display: flex; 
    flex-direction: column;
    align-items: center; 
    gap: 20px;
}

.loading{
    display: flex; 
    flex-direction: row; 
    align-items: center;
    justify-content: center;
    gap: 10px;
}

</style>
