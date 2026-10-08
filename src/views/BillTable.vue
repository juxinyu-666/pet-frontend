<template>
  <div>
    <h2 style="color:#44607c;margin-top:0">🧾 {{ loginUser.role === '管理员' ? '账单管理' : '我的账单' }}</h2>
    <div style="color:#9aa8bb;font-size:13px;margin-bottom:10px">
      {{ loginUser.role === '管理员' ? '全部顾客账单，可修改未支付订单金额（支付由顾客本人操作）' : '查看您的消费账单，未支付可在线支付或到店支付' }}
    </div>
    <el-table :data="tableData" border stripe
              :header-cell-style="{background:'#e8f0f8',color:'#2c4763'}">
      <el-table-column prop="billId" label="账单号" width="90"></el-table-column>
      <el-table-column prop="petName" label="宠物"></el-table-column>
      <el-table-column prop="serviceName" label="服务项目"></el-table-column>
      <el-table-column v-if="loginUser.role === '管理员'" prop="username" label="预约人"></el-table-column>
      <el-table-column prop="totalAmount" label="总金额" width="100">
        <template #default="scope">¥ {{ scope.row.totalAmount }}</template>
      </el-table-column>
      <el-table-column prop="pointsUsed" label="积分抵扣" width="90"></el-table-column>
      <el-table-column prop="payAmount" label="实付" width="100">
        <template #default="scope">¥ {{ scope.row.payAmount }}</template>
      </el-table-column>
      <el-table-column prop="payMethod" label="支付方式" width="90">
        <template #default="scope">
          <span v-if="scope.row.payMethod">{{ scope.row.payMethod }}</span>
          <span v-else style="color:#c0c6cf">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="payStatus" label="支付状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.payStatus==='已支付' ? 'success' : 'warning'">{{ scope.row.payStatus }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="服务时长" width="90">
        <template #default="scope">
          <span v-if="scope.row.serviceMinutes">{{ scope.row.serviceMinutes }} 分钟</span>
          <span v-else style="color:#c0c6cf">—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="190">
        <template #default="scope">
          <template v-if="scope.row.payStatus==='未支付'">
            <el-button v-if="loginUser.role === '管理员'" size="small" type="warning" plain
                       @click="openAmount(scope.row)">改价</el-button>
            <el-button v-if="loginUser.role !== '管理员'" size="small" type="primary" @click="openPay(scope.row)">去支付</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 管理员修改金额弹窗 -->
    <el-dialog v-model="amountVisible" title="💰 修改账单金额" width="440px">
      <div v-if="currentBill" style="background:#f7f9fc;border-radius:10px;padding:12px;margin-bottom:12px">
        <div style="font-size:13px;color:#8a94a6;margin-bottom:4px">
          {{ currentBill.username }} 的 {{ currentBill.petName }} - {{ currentBill.serviceName }}
        </div>
        <div style="color:#44607c">当前金额：<b>¥ {{ currentBill.totalAmount }}</b>（未支付，可修改）</div>
      </div>
      <el-form label-width="80px">
        <el-form-item label="新金额">
          <el-input-number v-model="amountForm.totalAmount" :min="0" :precision="2" :step="10" style="width:100%"></el-input-number>
        </el-form-item>
      </el-form>
      <div style="color:#9aa8bb;font-size:12px">适用于线下顾客临时增加项目等情况，修改后顾客账单金额同步更新</div>
      <template #footer>
        <el-button @click="amountVisible=false">取消</el-button>
        <el-button type="primary" @click="submitAmount">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 支付对话框 -->
    <el-dialog v-model="payVisible" title="💳 支付账单">
      <div v-if="currentBill" style="margin-bottom:14px">
        <div style="font-size:14px;color:#44607c;margin-bottom:4px">
          项目：{{ currentBill.serviceName }}（{{ currentBill.petName }}）
        </div>
        <div style="font-size:14px;color:#44607c;margin-bottom:4px">
          账单金额：<b>¥ {{ currentBill.totalAmount }}</b>
        </div>
        <div v-if="myMember" style="font-size:14px;color:#44607c;margin-bottom:4px">
          我的积分：<b style="color:#d97706">{{ myMember.points }}</b>（50积分=1元，最多可抵 <b style="color:#d97706">¥{{ maxMoney }}</b>）
        </div>
        <div v-else style="font-size:13px;color:#9aa8bb;margin-bottom:4px">
          你还不是会员，无法使用积分抵扣
        </div>
      </div>
      <el-form :model="payForm" label-width="90px">
        <el-form-item label="使用积分">
          <el-input-number v-model="payForm.pointsUsed" :min="0" :max="maxUsable" :step="50" :step-strictly="true" :disabled="!myMember"></el-input-number>
          <div style="font-size:12px;color:#9aa8bb">按 50 的倍数输入，每 50 积分抵 1 元</div>
        </el-form-item>
        <el-form-item label="支付方式">
          <el-radio-group v-model="payForm.payMethod">
            <el-radio value="线上">线上支付（模拟）</el-radio>
            <el-radio value="线下">线下支付</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="实付金额">
          <b style="color:#d97706;font-size:18px">¥ {{ computedPay }}</b>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payVisible=false">取消</el-button>
        <el-button type="primary" @click="doPay">确认支付</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

const loginUser = ref(JSON.parse(sessionStorage.getItem("loginUser")))
const tableData = ref([])
const payVisible = ref(false)
const amountVisible = ref(false)
const currentBill = ref(null)
const myMember = ref(null)
const payForm = ref({ billId:null, pointsUsed:0, payMethod:'线上' })
const amountForm = ref({ billId:null, totalAmount:0 })

const maxUsable = computed(()=>{
  if(!currentBill.value || !myMember.value) return 0
  // 最多可用积分 = min(我的积分, 总金额*50)（50积分=1元）
  return Math.min(myMember.value.points, Math.floor(Number(currentBill.value.totalAmount)) * 50)
})

const maxMoney = computed(()=>{
  return Math.floor((myMember.value ? myMember.value.points : 0) / 50).toFixed(0)
})

const computedPay = computed(()=>{
  if(!currentBill.value) return '0.00'
  const total = Number(currentBill.value.totalAmount)
  const used = payForm.value.pointsUsed || 0
  return (total - Math.floor(used / 50)).toFixed(2)
})

const loadData = async ()=>{
  let res
  if(loginUser.value.role === '管理员'){
    res = await axios.get('/bill/list')
  }else{
    res = await axios.get(`/bill/my?username=${loginUser.value.username}`)
  }
  tableData.value = res.data
}

const loadMember = async ()=>{
  const res = await axios.get(`/member/my?username=${loginUser.value.username}`)
  myMember.value = res.data
}

const openPay = (row)=>{
  currentBill.value = row
  payForm.value = { billId:row.billId, pointsUsed:0, payMethod:'线上' }
  payVisible.value = true
}

// 管理员：打开改价弹窗
const openAmount = (row)=>{
  currentBill.value = row
  amountForm.value = { billId:row.billId, totalAmount: Number(row.totalAmount) }
  amountVisible.value = true
}

const submitAmount = async ()=>{
  if(amountForm.value.totalAmount == null || amountForm.value.totalAmount < 0){
    alert("请输入正确的金额！")
    return
  }
  const res = await axios.post('/bill/updateAmount', amountForm.value)
  if(res.data === 'paid'){ alert("该账单已支付，不能修改！"); return }
  amountVisible.value = false
  alert("账单金额已修改 ✅")
  loadData()
}

const doPay = async ()=>{
  const used = payForm.value.pointsUsed || 0
  if(used > 0 && used > maxUsable.value){
    alert("积分超出可用范围！")
    return
  }
  await axios.post('/bill/pay', {
    billId: payForm.value.billId,
    pointsUsed: used,
    payMethod: payForm.value.payMethod
  })
  payVisible.value = false
  alert("支付成功！积分已更新 🐾")
  loadData()
  if(loginUser.value.role !== '管理员'){ loadMember() }
}

onMounted(()=>{
  loadData()
  if(loginUser.value.role !== '管理员'){ loadMember() }
})
</script>
