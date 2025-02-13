<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from "vue";
import { ElInput, ElButton, ElCheckbox, ElScrollbar, ElTable, ElTableColumn } from "element-plus";
import { _funcs } from "../../tools/_funcs";

interface LogEntry {
    id: number;
    message: string;
    level: "info" | "warn" | "error";
    timestamp: string;
}

const logs = ref<LogEntry[]>([]);
const searchQuery = ref("");
const filterLevel = ref<"all" | "info" | "warn" | "error">("all");
const autoScroll = ref(true);

const logHeight = ref("300px");
const ref_container = ref<HTMLElement | null>(null);
const ref_scrollbar = ref<InstanceType<typeof ElScrollbar> | null>(null);

const gameEnvObj = ref<GameEnvParam>(null)
onMounted(async ()=>{
    let aa = await Editor.Message.request(_funcs.getPluginName(),"callMainPanelFunc","_pluginSocket","getGameEnv")
    console.log("结果",aa)
    gameEnvObj.value = aa
    updateLogHeight()
})

// 计算日志区域的高度
function updateLogHeight() {
    if (ref_container.value) {
        let height = ref_container.value.clientHeight - 80 ;
        if(gameEnvObj.value?.CC_PREVIEW||!gameEnvObj.value?.CC_DEBUG){
            height-=30
        }
        logHeight.value = `${height}px`;
    }
}

// 监听窗口大小变化
onMounted(() => {
    updateLogHeight();
    window.addEventListener("resize", updateLogHeight);
});

onUnmounted(() => {
    window.removeEventListener("resize", updateLogHeight);
});

// 模拟日志追加
function addLog(message: string, level: "info" | "warn" | "error" = "info",timestamp=null) {
    logs.value.push({
        id: logs.value.length,
        message,
        level,
        timestamp: timestamp??new Date().toLocaleTimeString(),
    });

    if (autoScroll.value) {
        nextTick(() => {
            if (ref_scrollbar.value?.wrapRef) {
                // 这里才是正确的滚动区域
                const scrollWrap = ref_scrollbar.value.wrapRef;
                scrollWrap.scrollTop = scrollWrap.scrollHeight;
            }
        });
    }
}

// 计算过滤后的日志
const filteredLogs = computed(() =>
    logs.value.filter(log =>
        (filterLevel.value === "all" || log.level === filterLevel.value) &&
        (!searchQuery.value || log.message.toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
);

// 清空日志
function clearLogs() {
    logs.value = [];
}

// 模拟日志生成（测试用）
function simulateLogs() {
    const levels = ["info", "warn", "error"] as const;
    setInterval(() => {
        const level = levels[Math.floor(Math.random() * levels.length)];
        addLog(`This is a ${level} message.`, level);
    }, 2000);
}

// simulateLogs(); // 开启模拟日志

defineExpose({
    addLog,
});
</script>

<template>
    <div style="width: 100vw; height: 100vh;" ref="ref_container">
        <div class="log-viewer">
            <!-- 控制面板 -->
            <div class="controls">
                <ElInput v-model="searchQuery" placeholder="搜索日志..." clearable />
                <ElButton @click="clearLogs" type="danger">清空日志</ElButton>
                <ElCheckbox v-model="autoScroll">自动滚动</ElCheckbox>
                <ElButton @click="() => (filterLevel = 'all')">全部</ElButton>
                <ElButton @click="() => (filterLevel = 'info')">Info</ElButton>
                <ElButton @click="() => (filterLevel = 'warn')">Warn</ElButton>
                <ElButton @click="() => (filterLevel = 'error')">Error</ElButton>
            </div>

            <!-- 日志列表 -->
            <ElScrollbar :height="logHeight" ref="ref_scrollbar">
                <ElTable :data="filteredLogs" style="width: 100%" size="small" border>
                    <ElTableColumn prop="timestamp" label="时间" width="100" />
                    <ElTableColumn prop="level" label="级别" width="80">
                        <template #default="{ row }">
                            <span :class="row.level">{{ row.level.toUpperCase() }}</span>
                        </template>
                    </ElTableColumn>
                    <ElTableColumn prop="message" label="内容" />
                </ElTable>
            </ElScrollbar>
            <div class="bottomTip" v-if="gameEnvObj?.CC_PREVIEW">
                注意：当前是preview模式，不支持cc.log/warn/error，只支持console.log/warn/error
            </div>
            <div class="bottomTip" v-else-if="!gameEnvObj?.CC_DEBUG">
                注意：当前是不是debug模式，不支持cc.log/warn/error，只支持console.log/warn/error
            </div>
        </div>
    </div>
</template>

<style scoped>
.log-viewer {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    background: #2c2c2c;
    color: #fff;
    border-radius: 8px;
}

.controls {
    display: flex;
    gap: 10px;
    align-items: center;
}

.info {
    color: lightblue;
}

.warn {
    color: orange;
}

.error {
    color: red;
}

.bottomTip {
    height: 30px;
    color: orange;
    text-align: center;

}
</style>
