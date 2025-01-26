<script setup lang=ts>
import { ref, reactive, onUnmounted, watch, nextTick, defineExpose,defineProps, onMounted, computed } from 'vue';
import view_Node from '../inspector/view_Node.vue'
import View_UITransform from '../inspector/view_UITransform.vue';

import view_Sprite from '../inspector/view_Sprite.vue'
import view_Label from '../inspector/view_Label.vue'
import view_UITransform from '../inspector/view_UITransform.vue'
import view_Button from '../inspector/view_Button.vue'
import view_ParticleSystem2D from '../inspector/view_ParticleSystem2D.vue';
import view_Layout from '../inspector/view_Layout.vue';
import view_Skeleton from '../inspector/view_Skeleton.vue';
import view_RichText from '../inspector/view_RichText.vue';
import view_UIOpacity from '../inspector/view_UIOpacity.vue';
import view_Camera from '../inspector/view_Camera.vue';
import view_EditBox from '../inspector/view_EditBox.vue';
import view_PageView from '../inspector/view_PageView.vue';
import view_Mask from '../inspector/view_Mask.vue';
import view_ScrollView from '../inspector/view_Scrollview.vue';
import view_Graphics from '../inspector/view_Graphics.vue';
import view_Widget from '../inspector/view_Widget.vue';
import view_Canvas from '../inspector/view_Canvas.vue';
import View_ElseComp from '../inspector/view_ElseComp.vue';

// const compInfo = defineModel<CompInfo_Base>()

const emit = defineEmits([
    'update:info'
])

const props = defineProps<{
    compInfo: CompInfo_Base
}>()

watch(props.compInfo,(newVal)=>{
    emit("update:info",newVal)
})

</script>

<template>
    <view_UITransform v-if="compInfo!=null && compInfo.typeStr=='UITransform'" v-model="(props.compInfo as any)" />
    <view_Label v-else-if="compInfo!=null && compInfo.typeStr=='Label'" v-model="(props.compInfo as any)" />
    <view_Sprite v-else-if="compInfo!=null && compInfo.typeStr=='Sprite'" v-model="(props.compInfo as any)" />
    <view_EditBox v-else-if="compInfo!=null && compInfo.typeStr=='EditBox'" v-model="(props.compInfo as any)" />
    <view_Button v-else-if="compInfo!=null && compInfo.typeStr=='Button'" v-model="(props.compInfo as any)" />
    <view_Camera v-else-if="compInfo!=null && compInfo.typeStr=='Camera'" v-model="(props.compInfo as any)" />
    <view_Graphics v-else-if="compInfo!=null && compInfo.typeStr=='Graphics'" v-model="(props.compInfo as any)" />
    <view_Layout v-else-if="compInfo!=null && compInfo.typeStr=='Layout'" v-model="(props.compInfo as any)" />
    <view_Mask v-else-if="compInfo!=null && compInfo.typeStr=='Mask'" v-model="(props.compInfo as any)" />
    <view_PageView v-else-if="compInfo!=null && compInfo.typeStr=='PageView'" v-model="(props.compInfo as any)" />
    <view_ParticleSystem2D v-else-if="compInfo!=null && compInfo.typeStr=='ParticleSystem2D'" v-model="(props.compInfo as any)" />
    <view_RichText v-else-if="compInfo!=null && compInfo.typeStr=='RichText'" v-model="(props.compInfo as any)" />
    <view_ScrollView v-else-if="compInfo!=null && compInfo.typeStr=='ScrollView'" v-model="(props.compInfo as any)" />
    <view_UIOpacity v-else-if="compInfo!=null && compInfo.typeStr=='UIOpacity'" v-model="(props.compInfo as any)" />
    <view_Widget v-else-if="compInfo!=null && compInfo.typeStr=='Widget'" v-model="(props.compInfo as any)" />
    <view_Skeleton v-else-if="compInfo!=null && compInfo.typeStr=='Skeleton'" v-model="(props.compInfo as any)" />
    <view_Canvas v-else-if="compInfo!=null && compInfo.typeStr=='Canvas'" v-model="(props.compInfo as any)" />
    <View_ElseComp v-else="compInfo!=null" v-model="(props.compInfo as any)" />
</template>

<style scoped>


</style>