<script setup>
import { ref,defineExpose, computed } from 'vue';
import comp_md_info from './comp_md_info.vue'
import { _funcs } from '../../../tools/_funcs';
import {  ElButton } from "element-plus";


const dialogVisible = ref(false);

// 外部调用：打开弹窗
function openDialog(initialCode = '') {
  dialogVisible.value = true;
  if (initialCode) {
    if(ref_js_input.value!=null){
      ref_js_input.value.value = initialCode; // 初始化脚本输入
    }
  }
}


// 显式暴露方法
defineExpose({
  openDialog,
});

const bUseFoever = ref(true)
const bUseWechatPay = ref(true)

function onBtn_change_buyLevel(){
    bUseFoever.value = !bUseFoever.value
}

function onBtn_change_payType(){
    bUseWechatPay.value = !bUseWechatPay.value
}

const buyTip = computed(()=>{
    if(bUseFoever.value){
        return _funcs.getI18nText("text_101")
    }else{
        return _funcs.getI18nText("text_102")
    }
})

</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    width="800"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    :show-close="false"
  >
    <div class="main_view">
        <div v-if="bUseWechatPay">
            <div v-if="bUseFoever">
                <img src="./../../../../assets/wechat_220.png" class="image" alt="Cocos logo" />
            </div>
            <div v-else>
                <img src="./../../../../assets/wechat_120.png" class="image" alt="Cocos logo" />
            </div>
        </div>
        <div v-else>
            <div v-if="bUseFoever">
                <img src="./../../../../assets/alipay_220.jpg" class="image" alt="Cocos logo" />
            </div>
            <div v-else>
                <img src="./../../../../assets/alipay_120.jpg" class="image" alt="Cocos logo" />
            </div>
        </div>
        <div class="tip">
            <div style="display: flex;flex-direction: column;text-align: center;align-items: center;margin-bottom: 5px;">
                <h2>{{ _funcs.getI18nText("text_99") }}</h2>
                <h3 style="color: #ffee00;">{{ buyTip }}</h3>
            </div>

            <h3>{{ _funcs.getI18nText("text_103") }}</h3>
            <h3>{{ _funcs.getI18nText("text_104") }}</h3>
            <comp_md_info/>
            <div class="buttons">
                <ElButton @click="onBtn_change_payType">{{ bUseWechatPay?_funcs.getI18nText("text_105"):_funcs.getI18nText("text_106") }}</ElButton>
                <ElButton @click="onBtn_change_buyLevel">{{ bUseFoever?_funcs.getI18nText("text_107"):_funcs.getI18nText("text_108") }}</ElButton>
            </div>
            
            <div>
                <h2>{{ _funcs.getI18nText("text_110") }}</h2>
                <label>{{ _funcs.getI18nText("text_111") }}</label>
            </div>
        </div>
            
    </div>
    <template #footer>
      <ElButton @click="dialogVisible = false">{{ _funcs.getI18nText("text_109") }}</ElButton>
    </template>
  </el-dialog>
</template>

<style scoped>
.main_view {
  border: 1px solid #ffffff;
  width: min(800px,calc(100% - 20px));
  min-height: 300px;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: row;
  gap: 10px;
}

.image {
    width: 300px;
}

.tip {
    width: 436px;
    /* border: 1px dashed #ffffff; */
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 15px;

}

.buttons{
    display: flex;
    flex-direction: row;
    gap: 30px;
    align-items: center;
    justify-content: center;
    text-align: center;
}
</style>
