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
import view_Animation from '../inspector/view_Animation.vue';
import view_DargonBones from '../inspector/view_DargonBones.vue';
import view_ElseComp from '../inspector/view_ElseComp.vue';
import { _dataCtx } from '../../../tools/_dataCtx';

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

const compAttrs = computed(()=>{
    if(props.compInfo==null){
        return null
    }
    return _dataCtx.getCompAttrInfo(props.compInfo.typeStr)
})

</script>

<template>
    <view_UITransform v-if="compInfo!=null && compInfo.typeStr=='cc.UITransform'" v-model="(props.compInfo as any)" />
    <view_Label v-else-if="compInfo!=null && compInfo.typeStr=='cc.Label'" v-model="(props.compInfo as any)" />
    <view_Sprite v-else-if="compInfo!=null && compInfo.typeStr=='cc.Sprite'" v-model="(props.compInfo as any)" />
    <view_EditBox v-else-if="compInfo!=null && compInfo.typeStr=='cc.EditBox'" v-model="(props.compInfo as any)" />
    <view_Button v-else-if="compInfo!=null && compInfo.typeStr=='cc.Button'" v-model="(props.compInfo as any)" />
    <view_Camera v-else-if="compInfo!=null && compInfo.typeStr=='cc.Camera'" v-model="(props.compInfo as any)" />
    <view_Graphics v-else-if="compInfo!=null && compInfo.typeStr=='cc.Graphics'" v-model="(props.compInfo as any)" />
    <view_Layout v-else-if="compInfo!=null && compInfo.typeStr=='cc.Layout'" v-model="(props.compInfo as any)" />
    <view_Mask v-else-if="compInfo!=null && compInfo.typeStr=='cc.Mask'" v-model="(props.compInfo as any)" />
    <view_PageView v-else-if="compInfo!=null && compInfo.typeStr=='cc.PageView'" v-model="(props.compInfo as any)" />
    <view_ParticleSystem2D v-else-if="compInfo!=null && compInfo.typeStr=='cc.ParticleSystem2D'" v-model="(props.compInfo as any)" />
    <view_RichText v-else-if="compInfo!=null && compInfo.typeStr=='cc.RichText'" v-model="(props.compInfo as any)" />
    <view_ScrollView v-else-if="compInfo!=null && compInfo.typeStr=='cc.ScrollView'" v-model="(props.compInfo as any)" />
    <view_UIOpacity v-else-if="compInfo!=null && compInfo.typeStr=='cc.UIOpacity'" v-model="(props.compInfo as any)" />
    <view_Widget v-else-if="compInfo!=null && compInfo.typeStr=='cc.Widget'" v-model="(props.compInfo as any)" />
    <view_Skeleton v-else-if="compInfo!=null && compInfo.typeStr=='sp.Skeleton'" v-model="(props.compInfo as any)" />
    <view_Canvas v-else-if="compInfo!=null && compInfo.typeStr=='cc.Canvas'" v-model="(props.compInfo as any)" />
    <view_Animation v-else-if="compInfo!=null && compInfo.typeStr=='cc.Animation'" v-model="(props.compInfo as any)" />
    <view_DargonBones v-else-if="compInfo!=null && compInfo.typeStr=='dragonBones.ArmatureDisplay'" v-model="(props.compInfo as any)" />
    <view_ElseComp v-else="compInfo!=null" v-model="(props.compInfo as any)" :compAttrs="compAttrs" />
</template>

<style scoped>


</style>