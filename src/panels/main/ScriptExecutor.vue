<script setup>
import { ref,defineExpose } from 'vue';
import { _pluginSocket } from '../../tools/plugin_socket';

// 内部状态
const ref_js_input = ref(null);
const dialogVisible = ref(false);
const str_result = ref('');

// 外部调用：打开弹窗
function openDialog(initialCode = '') {
  dialogVisible.value = true;
  if (initialCode) {
    ref_js_input.value.value = initialCode; // 初始化脚本输入
  }
}

// 内部方法：执行脚本
async function do_eval() {
  const str = ref_js_input.value?.value || '';
  if (!str) {
    alert("执行代码为空"); // 提示内容
    return;
  }
  const result = await _pluginSocket.evalJsInRuntime(str);
  str_result.value = result;
}

// 显式暴露方法
defineExpose({
  openDialog,
});
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="执行脚本工具"
    width="80%"
    height="80%"
    :close-on-click-modal="false"
    :destroy-on-close="true"
  >
    <div class="main_view">
      <div class="inputJs">
        <h3>在runtime中执行js脚本</h3>
        <ui-textarea ref="ref_js_input" placeholder="请使用return返回需要输出的结果"></ui-textarea>
      </div>
      <div class="btnBar">
        <el-button type="primary" @click="do_eval">
          <ui-icon value="play"></ui-icon>
          执行
        </el-button>
      </div>
      <div class="inputJs" v-if="str_result">
        <h3>执行结果</h3>
        <ui-label id="id_eval_result" :value="str_result"></ui-label>
      </div>
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.main_view {
  border: 1px solid #ffffff;
  width: calc(100% - 20px);
  min-height: 300px;
  overflow-y: auto;
  padding: 10px;
}

.inputJs{
  height: 200px;
}

.btnBar{
  margin-top:10px;
  margin-bottom:10px;
}

ui-label{
  height: 90%;
  user-select: text;
}
ui-textarea{
    height: 90%;
}
</style>
