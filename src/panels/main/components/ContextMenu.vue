<script setup lang=ts>
import { ref, reactive,onMounted, onUnmounted,watch} from 'vue';

// 控制菜单的显示状态与位置
const isMenuVisible = ref(false);
const menuPosition = reactive({ x: 0, y: 0 });
const menuOptions = ref([]);
const selfPopupRef = ref(null)

// 显示菜单方法
function showContextMenu(event, options) {
    isMenuVisible.value = true;
    menuPosition.x = event.clientX;
    menuPosition.y = event.clientY;
    menuOptions.value = options || [];
}

// 隐藏菜单方法
function hideContextMenu() {
    isMenuVisible.value = false;
}

const handlerClickGlobal = (e:MouseEvent) => {
    if (selfPopupRef.value == null) {
        return;
    }
    const rect = selfPopupRef.value.getBoundingClientRect();
    const isContain = e.clientX > rect.x && e.clientX < (rect.x + rect.width) && e.clientY > rect.y && e.clientY < (rect.y + rect.height);
    console.log('rect',rect,e.clientX,e.clientY)
    if (!isContain) {
        hideContextMenu()
        e.stopPropagation()
    }
};

watch(isMenuVisible, async (val) => {
  if(val){
    document.addEventListener('click', handlerClickGlobal,{capture:true});
  }else{
    document.removeEventListener('click', handlerClickGlobal,{capture:true});
  }
})

onUnmounted(() => {
    document.removeEventListener('click', handlerClickGlobal,{capture:true});
});

// 公开方法供外部调用
defineExpose({
    showContextMenu,
});
</script>

<template>
    <div
        v-if="isMenuVisible"
        class="context-menu"
        :style="{ top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }"
        @click="hideContextMenu"
        ref="selfPopupRef"
    >
        <el-menu default-active="1" style="border: none;">
            <el-menu-item
                v-for="(option, index) in menuOptions"
                :key="index"
                @click="option.action; hideContextMenu()"
            >
                {{ option.label }}
            </el-menu-item>
        </el-menu>
    </div>
</template>

<style scoped>
.context-menu {
    position: absolute;
    z-index: 9999;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    padding: 4px 0;
    min-width: 150px;
}
</style>
