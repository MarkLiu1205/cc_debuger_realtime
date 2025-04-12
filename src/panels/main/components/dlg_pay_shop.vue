<script setup lang="ts">
import { ref, defineExpose,inject, onMounted, computed } from 'vue';
import { ElButton, ElCard, ElMessage } from 'element-plus';
import { _funcs } from '../../../tools/_funcs';

const showToast = inject<ToastParam>("message")
const onBtnDoVerify = inject("do_verify_activation_code") as (code:string)=>Promise<VerifyRespParam>

//是否使用本地服务器调试
const IS_LOCAL_DEBUG = true

//>>>>>>>>>>>>商品列表 start >>>>>>>>>>>>

const url_goodsList = IS_LOCAL_DEBUG ? 
  "http://localhost:8080/req_goodslist" : 
  "http://ccdebuger.com:8080/req_goodslist"

const url_orderPre = IS_LOCAL_DEBUG ? 
  "http://localhost:8080/order_pre" : 
  "http://ccdebuger.com:8080/order_pre"

const shopDlgVisible = ref(false);

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
function openDlgShop() {
  if(oldOrderInfo.value!=null){
    openDlgOldOrder(()=>{
      shopDlgVisible.value = true;
    })
  }else{
    shopDlgVisible.value = true;
  }
  if (goodsList.value.length > 0) {
    selectedGoodsId.value = goodsList.value[0].goodsId;
  }
}

// 切换选中商品
function selectGoods(id) {
  selectedGoodsId.value = id;
}

async function getGoodsList(){
  const url = url_goodsList
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
async function onBtnDoOrder() {
  const item = goodsList.value.find(g => g.goodsId === selectedGoodsId.value);
  if (!item) {
    showToast('请先选择一个商品');
    return;
  }
  const url = url_orderPre
  let userInfo = await Editor.User.getData()
  const jsonData = {
    goodsId: selectedGoodsId.value,
    cocos_uid: userInfo.cocos_uid+"",
    deviceId:"",
    pluginVersion:_funcs.getPluginVersionName()
 }
  try{
    const obj:OrderPreRespParam = await _funcs.sendPostRequest(url,jsonData,true)
    // console.log("下单返回obj",obj)
    if(obj.code==0){
      //TODO 下单成功后，去网页完成支付
      _funcs.openWebSiteUrl(`http://ccdebuger.com/#/payment?orderId=${obj.orderId}`)

      openDlgOldOrder(null,1)
      //用于给客户查看的
      let jsonStr = await Editor.Profile.getConfig(_funcs.getPluginName(),obj.orderId)
      if(jsonStr==null){
        Editor.Profile.setConfig(_funcs.getPluginName(),obj.orderId,JSON.stringify(obj))
      }
    }else{
      showToast(obj.msg??"下单失败")
    }
    
    
  }catch(e){
    showToast(e.message)
  }
}

defineExpose({
  openDlgShop,
});
//>>>>>>>>>>>>商品列表 end >>>>>>>>>>>>

//>>>>>>>>>>>>未支付订单提示 start >>>>>>>>>>>>
const url_orderInfo = IS_LOCAL_DEBUG ? 
  "http://localhost:8080/order_info" : 
  "http://ccdebuger.com:8080/order_info"

const dlgOldOrderVisible = ref(false);
const oldOrderInfo = ref<QueryOrderRespParam>(null)

let _onCloseCallback_DlgOrderInfo:()=>void = null
let _orderDlgType = ref(0)
async function openDlgOldOrder(onClose:()=>void,type=0) {
  dlgOldOrderVisible.value = true;
  _onCloseCallback_DlgOrderInfo = onClose

  _orderDlgType.value = type

  //用于给客户查看的
  let jsonStr = await Editor.Profile.getConfig(_funcs.getPluginName(),oldOrderInfo.value.orderId)
  if(jsonStr==null){
    Editor.Profile.setConfig(_funcs.getPluginName(),oldOrderInfo.value.orderId,JSON.stringify(oldOrderInfo.value))
  }
  
}

function onCloseDlgOrderInfo(){
  if(_onCloseCallback_DlgOrderInfo){
    _onCloseCallback_DlgOrderInfo()
  }
}

async function checkOldOrder() {
  const url = url_orderInfo
  let userInfo = await Editor.User.getData()
  const jsonData = {
    cocos_uid: userInfo.cocos_uid+"",
    deviceId:"",
  }
  try{
    const obj:QueryOrderRespParam = oldOrderInfo.value = await _funcs.sendPostRequest(url,jsonData,true)
    _funcs.log_1("存在未完成订单：",obj)
    if(obj.code==0){
      openDlgOldOrder(null)
    }
    
  }catch(e){
    // showToast(e.message)
  }
}

onMounted(()=>{
  checkOldOrder()
})

async function onClick_pay_olrOrder() {
  const orderId = oldOrderInfo.value.orderId
  _funcs.openWebSiteUrl(`http://ccdebuger.com/#/payment?orderId=${orderId}`)
  _orderDlgType.value = 1
}

async function onClick_check_has_pay_finish() {
  const orderId = oldOrderInfo.value.orderId

  const url = url_orderInfo
  // let userInfo = await Editor.User.getData()
  const jsonData = {
    orderId:orderId
  }
  try{
    const obj:QueryOrderRespParam = await _funcs.sendPostRequest(url,jsonData,true)
    // console.log("======订单状态obj",obj)
    if(obj.status==3){
      const info:VerifyRespParam = await onBtnDoVerify(obj.activationCode)
      // console.log("======验证激活码info",info)
      if(info.state==3){
        shopDlgVisible.value = false
        dlgOldOrderVisible.value = false
      }else{
        showToast(info.msg)
      }
    }else{
      showToast("订单未完成支付")
    }
    
  }catch(e){
    // showToast(e.message)
  }
}

const orderDlgTitleStr =  computed(()=>{
  if(_orderDlgType.value==0){
    return "您有未完成订单，建议跳转支付宝付款"
  }else if(_orderDlgType.value==1){
    return "您已成功下单，请在网页端完成支付"
  }
})


//>>>>>>>>>>>>未支付订单提示 end >>>>>>>>>>>>

</script>

<template>
  <el-dialog
    v-model="shopDlgVisible"
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
      <ElButton type="primary" class="custom-button" @click="onBtnDoOrder">去下单</ElButton>
    </template>
  </el-dialog>

  <el-dialog
    v-model="dlgOldOrderVisible"
    width="600"
    title=""
    :close-on-click-modal="false"
    :destroy-on-close="true"
    :show-close="true"
    top="calc(50% - 230px)"
    @close="onCloseDlgOrderInfo"
  >
  <h2>{{ orderDlgTitleStr }}</h2>
    <div class="old-order-info">
      <div class="row">
        <label style="font-weight: bold;">{{ "订单号：" }}</label>
        <label >{{ oldOrderInfo?.orderId }}</label>
      </div>
      <div class="row">
        <label style="font-weight: bold;">{{ "选中商品：" }}</label>
        <label >{{ oldOrderInfo?.productName??"" }}</label>
      </div>
      <div class="row">
        <label style="font-weight: bold;">{{ "商品价格：" }}</label>
        <label >{{ (oldOrderInfo?.price??"") +" 元"}}</label>
      </div>
      <div class="row">
        <label style="font-weight: bold;">{{ "下单时间：" }}</label>
        <label >{{ _funcs.formatDate("yyyy-MM-dd hh:mm:ss",(oldOrderInfo?.orderTime??0)*1000) }}</label>
      </div>
    </div>
    
    <template #footer>
      <ElButton v-if="_orderDlgType==0" type="primary" class="custom-button" @click="onClick_pay_olrOrder">去付款</ElButton>
      <ElButton v-if="_orderDlgType==1" type="primary" class="custom-button" @click="onClick_check_has_pay_finish">我已完成支付</ElButton>
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


.old-order-info {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: fit-content;
  gap: 5px;
}

.custom-button {
  font-size: 16px; 
  padding: 9px 18px;
  height: auto;
}

.row {
  display: flex;
  flex-direction: row;
  font-size: 16px;
}
</style>
