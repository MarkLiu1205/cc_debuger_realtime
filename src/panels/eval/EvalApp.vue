<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { _pluginSocket } from '../../tools/plugin_socket';
import { _funcs } from "../../tools/_funcs";
const path =  require('path');
const fs = require('fs-extra');

const maxHistoryNum = 20// 仅保留最近 20 条

const ref_js_input = ref(null);
const str_input = ref('');
const str_result = ref('');

const pageSize = ref(0)
const pageIndex = ref(1)

const history = ref<Array<{code:string,index:number}>>([]);
const saveFloderPath = `${_funcs.getCurPluginPath()}/cache`;
const historyFilePath = path.join(saveFloderPath, 'js_history.json');

// 读取历史记录
function loadHistory() {
    try {
        if (fs.existsSync(historyFilePath)) {
            const data = fs.readFileSync(historyFilePath, 'utf-8');
            history.value = JSON.parse(data).slice(-maxHistoryNum); 
            pageSize.value = history.value.length
            console.log('加载历史记录:', history.value);
            selectHistory(1)
        }
    } catch (err) {
        console.error('加载历史记录失败:', err);
    }
}

// 保存历史记录
async function saveHistory(index:number=1) {
    const code = str_input.value
    if (!code) return;

    let obj = history.value.find((item) => item.index === index);
    if(obj){
        obj.code = code
    }else{
        obj = {index,code}
        history.value.push(obj);
    }
    
    if (history.value.length > maxHistoryNum) {
        history.value = history.value.slice(-maxHistoryNum);
    }

    await _funcs.ensureFloderExist(saveFloderPath);
    fs.writeFileSync(historyFilePath, JSON.stringify(history.value, null, 2));

    pageSize.value = history.value.length
    pageIndex.value = index
}

// 执行脚本
async function do_eval() {
    const str = str_input.value;
    if (!str) {
        return;
    }
    const result = await Editor.Message.request(_funcs.getPluginName(),"callMainPanelFunc","_pluginSocket","evalJsInRuntime",str)
    
    str_result.value = result;
}

// 选择历史记录
function selectHistory(index:number) {
    const obj = history.value.find((item) => item.index === index);
    if(obj==null){
        return
    }
    str_input.value = obj.code;
}

onMounted(() => {
    loadHistory();
});

function onInputChange(event) {
    str_input.value = event.target.value;
}

function onPageIndexChange(page) {
    selectHistory(page)
    pageIndex.value = page
}

function onPageSizeChange(size) {
    // console.log('页码数量:', size);
}

</script>

<template>
    <div class="container">
        <!-- 左侧输入框 -->
        <div class="left-panel">
            <h3>输入 JS 代码</h3>
            <ui-textarea :value="str_input" @change="onInputChange" placeholder="请使用 return 返回需要输出的结果"></ui-textarea>
            <div class="pagination-container" v-if="pageSize > 0">
                <el-pagination class="pagination" :current-page="pageIndex" :page-count="pageSize" :pager-count="5" @current-change="onPageIndexChange" @size-change="onPageSizeChange"/>
            </div>
            <div class="btn-bar">
                <el-button type="primary" @click="do_eval"><ui-icon value="play"></ui-icon>执行</el-button>
                <div style="">
                    <el-button type="success" @click="saveHistory(pageIndex)" v-if="pageSize > 0">更新本条记录</el-button>
                    <el-button type="success" @click="saveHistory(pageSize+1)">保存为新记录</el-button>
                </div>
            </div>
        </div>
        
        <!-- 右侧结果和历史记录 -->
        <div class="right-panel">
            <h3>执行结果</h3>
            <ui-label id="id_eval_result" :value="str_result"></ui-label>
        </div>
    </div>
</template>

<style scoped>
.container {
    display: flex;
    width: 100vw; 
    height: 100vh;
}
.left-panel {
    width: 50%;
    padding: 10px;
    border-right: 1px solid #ddd;
}
.right-panel {
    width: 50%;
    padding: 10px;
}
.btn-bar {
    margin-top: 10px;
    display: flex; flex-direction: row; 
    justify-content: space-between;
}

ui-textarea{
    height: 60%;
}

.pagination-container {
  display: flex;
  justify-content: flex-end; /* 将子元素推到右边 */
  margin-top: 10px; /* 可选：添加一些顶部间距 */
}

ui-label{
    width: calc(100% - 5px);
    height: 60%;
    user-select: text;
    border: 1px solid #ddd;
}

:deep(.pagination .el-pagination__jump) {
  display: none;
}
:deep(.pagination .el-pagination__total) {
  display: none;
}
</style>