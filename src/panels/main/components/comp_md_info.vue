
<script lang="ts" setup>
import { computed, inject, onMounted, ref } from 'vue';
import { _funcs } from '../../../tools/_funcs';

const verifyInfo = inject("verifyInfo") as VerifyRespParam

const verifyTip = computed(()=>{
    if(verifyInfo.state==2){
        const _endTime = verifyInfo.endTime
        const dateStr = _funcs.formatDate("yyyy-MM-dd hh:mm",_endTime*1000)
        return _funcs.formatStr(_funcs.getI18nText("text_115"),dateStr)
    }else if(verifyInfo.state==3){
        if(verifyInfo.endTime&&verifyInfo.endTime>Date.now()/1000){
            const _endTime = verifyInfo.endTime
            const dateStr = _funcs.formatDate("yyyy-MM-dd hh:mm",_endTime*1000)
            return _funcs.formatStr(_funcs.getI18nText("text_122"),dateStr)
        }
        return _funcs.getI18nText("text_118")
    }
})
//比较版本号 如 1.0.0  1.0.23
function checkCurIsLatestVersion() {
    const nowVer = _funcs.getPluginVersionName();
    const vArr_self = nowVer.split(".");
    const vArr_remote = verifyInfo.latestVersion.split(".");

    const maxLength = Math.max(vArr_self.length, vArr_remote.length);

    for (let i = 0; i < maxLength; i++) {
        const subV_self = parseInt(vArr_self[i] || "0", 10); // 默认值为 0
        const subV_remote = parseInt(vArr_remote[i] || "0", 10); // 默认值为 0

        if (isNaN(subV_self) || isNaN(subV_remote)) {
            // 如果解析失败，认为当前版本是最新的
            return true;
        }

        if (subV_self < subV_remote) {
            return false; // 当前版本小于远程版本
        } else if (subV_self > subV_remote) {
            return true; // 当前版本大于远程版本
        }
        // 如果相等，继续比较下一部分
    }

    return true; // 如果所有部分都相等，认为是最新版本
}

const vertionTip = computed(()=>{
    const nowVer = _funcs.getPluginVersionName();
    if(checkCurIsLatestVersion()){ 
        return _funcs.formatStr(_funcs.getI18nText("text_119"),nowVer)
    }else{
        return _funcs.formatStr(_funcs.getI18nText("text_120"),nowVer,verifyInfo.latestVersion)
    }
})

function onClickCocosStore(){
    _funcs.openWebSiteUrl(verifyInfo.authorInfo?.cocosStoreUrl)
}

function onClickGitHub(){
    _funcs.openWebSiteUrl(verifyInfo.authorInfo?.githubUrl)
}

</script>

<template>
    <div class="md-info">
        <div class="row">
            <label style="font-style: italic;font-weight: bold;">{{ verifyTip }}</label>
        </div>
        <div class="row" v-if="verifyInfo.latestVersion!=''">
            <label v-if="checkCurIsLatestVersion()" >{{ vertionTip }}</label>
            <label v-else style="color: #ff0000;">{{ vertionTip }}</label>
        </div>
        <div class="row">
            <label class="label_1">{{ _funcs.getI18nText("text_121") }}</label>
            <div style="display: flex;flex-direction: row;gap: 10px;">
                <label class="clickable" @click="onClickCocosStore">Cocos Store</label>
                <label class="clickable" @click="onClickGitHub">Github</label>
               
            </div>
        </div>
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
    min-width: 400px;
    display: flex;
    flex-direction: column; 
    font-size: 15px; 
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 10px;
    border: 1px solid rgb(165, 165, 165);
    gap: 3px;
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

.clickable {
    cursor: pointer;
    transition: color 0.3s;
    user-select: none;
    margin-left: 5px;
    color: rgb(195, 214, 111);;
}

.clickable:hover {
    color: rgb(247, 232, 29); /* 设置 hover 颜色 */
}
</style>
