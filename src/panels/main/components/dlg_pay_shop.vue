<script setup lang="ts">
import { ref, defineExpose,inject, onMounted } from 'vue';
import { ElButton, ElCard, ElMessage } from 'element-plus';
import { _funcs } from '../../../tools/_funcs';

const showToast = inject<ToastParam>("message")

const dialogVisible = ref(false);

// 商品列表
const goodsList = ref([
  {
    goodsId: 'sku.1',
    productName: '永久激活码',
    desc: '激活码永久有效',
    price: '220',
  },
  {
    goodsId: 'sku.2',
    productName: '90天激活码',
    desc: '激活码90天内有效',
    price: '120',
  },
]);

// 当前选中商品 ID
const selectedGoodsId = ref('');

// 打开弹窗时默认选中第一项
function openDialog() {
  dialogVisible.value = true;
  if (goodsList.value.length > 0) {
    selectedGoodsId.value = goodsList.value[0].goodsId;
  }
}

// 切换选中商品
function selectGoods(id) {
  selectedGoodsId.value = id;
}

async function getGoodsList(){
  const url = "http://ccdebuger.com:8080/req_goodslist"
  // const url = "http://localhost:8080/req_goodslist"
  const jsonData = {
    pluginVersion:_funcs.getPluginVersionName()
 }
  try{
    const obj = await _funcs.sendPostRequest(url,jsonData,true)
    // console.log("obj",obj)
    goodsList.value = obj.goodsCfgList
  }catch(e){
    // showToast(e.message)
  }
}

onMounted(()=>{
  getGoodsList()
})

// 去下单按钮点击
async function handleBuy() {
  const item = goodsList.value.find(g => g.goodsId === selectedGoodsId.value);
  if (!item) {
    showToast('请先选择一个商品');
    return;
  }
  const url = "http://ccdebuger.com:8080/order_pre"
  // const url = "http://localhost:8080/order_pre"
  let userInfo = await Editor.User.getData()
  const jsonData = {
    goodsId: selectedGoodsId.value,
    cocos_uid: userInfo.cocos_uid+"",
    deviceId:"",
    pluginVersion:_funcs.getPluginVersionName()
 }
  try{
    const obj = await _funcs.sendPostRequest(url,jsonData,true)
    // console.log("obj",obj)
    //TODO 下单成功后，去网页完成支付
    _funcs.openWebSiteUrl(`http://ccdebuger.com/#/payment?orderId=${obj.orderId}`)
    
  }catch(e){
    showToast(e.message)
  }
}

defineExpose({
  openDialog,
});
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    width="600"
    title="购买激活码"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    :show-close="true"
  >
    <div class="main_view_scroll">
      <div class="goods_scroll">
        <el-card
          v-for="item in goodsList"
          :key="item.goodsId"
          class="goods_card"
          :class="{ selected: selectedGoodsId === item.goodsId }"
          shadow="hover"
          @click="selectGoods(item.goodsId)"
        >
          <div class="title">{{ item.productName }}</div>
          <pre class="desc">{{ item.desc }}</pre>
          <div class="price">¥{{ item.price }}</div>
        </el-card>
      </div>
    </div>

    <div class="tip_area" v-if="selectedGoodsId">
      <div class="tip_box">
        <div>当前选中:</div>
        <div class="highlight">
          {{
            goodsList.find((g) => g.goodsId === selectedGoodsId)?.productName
          }}
        </div>
        <div class="highlight">
          ¥{{ goodsList.find((g) => g.goodsId === selectedGoodsId)?.price }} 元
        </div>
      </div>
    </div>

    <template #footer>
      <ElButton type="primary" class="custom-button" @click="handleBuy">去下单</ElButton>
    </template>
  </el-dialog>
</template>

<style scoped>
.main_view_scroll {
  overflow-x: auto;
  padding: 10px 0;
}

.goods_scroll {
  display: flex;
  flex-direction: row;
  gap: 16px;
  min-width: max-content;
  padding: 0 10px;
}

.goods_card {
  width: 200px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid #45454666;
}

.goods_card.selected {
  border: 2px solid #409eff;
}

.title {
  font-weight: bold;
  font-size: 16px;
}

.desc {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  color: #666;
}

.price {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
}

.tip_area {
  margin-top: 16px;
  display: flex;
  justify-content: flex-start;
}

.tip_box {
  border: 1px solid #363636;
  border-radius: 6px;
  padding: 12px 16px;
  /* background-color: #2a2a2a; */
  text-align: left;
  font-size: 16px;
  color: #ffffff;
  line-height: 1.8;
}

.highlight {
  font-weight: bold;
  color: #409eff;
  font-size: 22px;
}

.custom-button {
  font-size: 20px; /* 增大字体 */
  padding: 12px 24px; /* 增大按钮的内边距 */
  height: auto; /* 允许按钮高度自适应 */
}
</style>
