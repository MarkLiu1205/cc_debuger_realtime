<script setup lang=ts>
import { ref, reactive, onUnmounted, watch, nextTick } from 'vue';
import { _funcs } from '../../../tools/_funcs';

interface Option {
    label?: string,
    action?: () => void,
    isDivider?: boolean,
}

// 控制菜单的显示状态与位置
const isMenuVisible = ref(false);
const menuPosition = reactive({ x: 0, y: 0 });
const menuOptions = ref([] as Array<Option>);
const selfPopupRef = ref(null);

// 显示菜单方法
function showContextMenu(event, options: Array<Option>) {
    isMenuVisible.value = true;
    menuOptions.value = options || [];

    // 获取菜单项的高度
    const menuItemHeight = 36;
    const totalHeight = menuOptions.value.length * menuItemHeight; // 计算菜单的总高度
    const totalWidth = 150; // 计算菜单的总宽度
    
    // 获取鼠标点击位置
    const { clientX, clientY } = event;
    const distanceToBottom = window.innerHeight - clientY;
    const distanceToRight = window.innerWidth - clientX;

    // 判断菜单是否接近屏幕底部
    if (distanceToBottom < totalHeight) {
        menuPosition.y = clientY - (totalHeight - distanceToBottom); 
    } else {
        menuPosition.y = clientY; 
    }
    if (distanceToRight < totalWidth) {
        menuPosition.x = clientX - (totalWidth - distanceToRight); 
    } else {
        menuPosition.x = clientX; 
    }
    
}

// 隐藏菜单方法
function hideContextMenu() {
    isMenuVisible.value = false;
}

// 全局点击事件处理
const handlerClickGlobal = (e: MouseEvent) => {
    if (selfPopupRef.value == null) {
        return;
    }
    const isContain = _funcs.checkMouseIsInElemen(selfPopupRef.value, e);
    // const rect = selfPopupRef.value.getBoundingClientRect();
    // const isContain = e.clientX > rect.x && e.clientX < (rect.x + rect.width) && e.clientY > rect.y && e.clientY < (rect.y + rect.height);
    if (!isContain) {
        hideContextMenu();
        e.stopPropagation();
    }
};

function handleClick(option:Option) {
    hideContextMenu();
    setTimeout(() => {
        if (typeof option.action === 'function') {
            option.action();
        }
    }, 0);

    _funcs.getAssetInfoByUuid("b519ff7c-f0f4-4731-af85-d854e962bd4a").then((res)=>{
        console.log("getAssetInfoByUuid",res)
    })
}

// 监听菜单显示状态
watch(isMenuVisible, (val) => {
    if (val) {
        document.addEventListener('click', handlerClickGlobal, { capture: true });
        document.addEventListener('contextmenu', handlerClickGlobal, { capture: true });
    } else {
        document.removeEventListener('click', handlerClickGlobal, { capture: true });
        document.removeEventListener('contextmenu', handlerClickGlobal, { capture: true });
    }
});

// 组件卸载时清理事件
onUnmounted(() => {
    document.removeEventListener('click', handlerClickGlobal, { capture: true });
    document.removeEventListener('contextmenu', handlerClickGlobal, { capture: true });
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
        ref="selfPopupRef"
    >
        <ul class="menu-list">
            <li
                v-for="(option, index) in menuOptions"
                :key="index"
                @click="!option.isDivider && handleClick(option)"
                class="menu-item"
                :class="{ 'divider': option.isDivider }"
            >
                <template v-if="!option.isDivider">
                    {{ option.label }}
                </template>
            </li>
        </ul>
    </div>
</template>

<style scoped>
.context-menu {
  position: absolute;
  background: #fff; /* 深色背景 */
  border: 1px solid #ccc;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  min-width: 150px; /* 增加最小宽度 */
  color: #000; /* 白色文字 */
}

.menu-list {
  list-style: none;
  margin: 0;
}

.menu-item {
  padding: 8px 12px;
  cursor: pointer;
}

.menu-item.divider {
  border-top: 1px solid #ccc;
  margin: 4px 0;
  padding: 0;
  cursor: default;
}

.menu-item:hover {
  background-color: #e2e2e2; /* 深色背景 */
}
</style>