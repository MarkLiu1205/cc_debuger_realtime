
<script lang="ts" setup>
import { onMounted, ref } from 'vue';



</script>

<template>
    <div class="md-info">
        <div>
            <label style="color: orange;">使用文档：</label>
            <ui-link>https://www.cocos.com/products</ui-link>
        </div>
        <div>
            <label style="color: orange;">bug反馈：</label>
            <ui-link>https://www.cocos.com/products</ui-link>
        </div>
        <div>
            <label style="color: orange;">联系作者：</label>
            <label>QQ 1451784145</label>
        </div>
    </div>
</template>

<style scoped>

.md-info{
    display: flex;
    flex-direction: column; 
    font-size: 15px; 
    padding: 15px;
    border: 1px solid rgb(165, 165, 165);
    gap: 5px;
}
</style>
