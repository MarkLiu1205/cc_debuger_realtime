
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

const isLatestVersion = computed(()=>{
    const nowVer = _funcs.getPluginVersionName();
    const remoteVer = verifyInfo.latestVersion;
    return _funcs.compareVersion(nowVer, remoteVer) >= 0;
})

const vertionTip = computed(()=>{
    const nowVer = _funcs.getPluginVersionName();
    if(isLatestVersion.value){ 
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

const isHotfixing = ref(false);
const hotfixTip = ref("")
function onClickHotfix(){
    isHotfixing.value = true
    _funcs.checkSyncFromGit((code, msg)=>{
        hotfixTip.value = msg
    })
}

</script>

<template>
    <div class="md-info">
        <div class="row">
            <label style="font-style: italic;font-weight: bold;">{{ verifyTip }}</label>
        </div>
        <div class="row" v-if="verifyInfo.latestVersion!=''">
            <label v-if="hotfixTip">{{ hotfixTip }}</label>
            <label v-else-if="isLatestVersion" >{{ vertionTip }}</label>
            <label v-else style="color: #ff0000;">{{ vertionTip }}</label>
        </div>
        <div class="row">
            <label class="label_1">{{ _funcs.getI18nText("text_121") }}</label>
            <div style="display: flex;flex-direction: row;gap: 10px;">
                <label class="btn-hotfix" @click="onClickHotfix" v-if="!isLatestVersion">在线热更新</label>
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

.btn-hotfix {
    cursor: pointer;
    transition: color 0.3s;
    user-select: none;
    margin-left: 5px;
    color: rgb(245, 39, 39);;
}

.btn-hotfix:hover {
    color: rgb(207, 247, 29); /* 设置 hover 颜色 */
}

</style>
