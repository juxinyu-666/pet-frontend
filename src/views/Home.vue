<template>
  <el-container style="height:100vh">
    <!-- 侧边栏改成柔和萌系蓝 -->
    <el-aside width="230px" style="background:#547899">
      <div style="padding:18px;text-align:center;color:white;font-size:18px;font-weight:bold;border-bottom:1px solid #83a2bd">
        🐾宠物管理系统
        <div style="font-size:12px;font-weight:normal;margin-top:6px;color:#d7e4f2">🕘 营业时间 9:00 - 18:00</div>
      </div>
      <el-menu router background-color="#547899" text-color="#fff" active-text-color="#ffd380">
        <!-- 管理员：店铺总览看板 -->
        <el-menu-item v-if="loginUser.role === '管理员'" index="/home/dashboard">🏠 店铺总览</el-menu-item>

        <!-- 所有角色都可见 -->
        <el-menu-item index="/home/pet">🐱 宠物信息</el-menu-item>
        <el-menu-item index="/home/notice">📢 公告查看</el-menu-item>
        <el-menu-item index="/home/message">💬 留言反馈</el-menu-item>
        <el-menu-item index="/home/reserve">📅 我的预约</el-menu-item>
        <el-menu-item index="/home/staff">👩‍⚕️ 店员查看</el-menu-item>
        <el-menu-item index="/home/member">⭐ 会员积分</el-menu-item>
        <el-menu-item index="/home/bill">{{ loginUser.role === '管理员' ? '🧾 账单管理' : '🧾 我的账单' }}</el-menu-item>
        <el-menu-item index="/home/ai">🤖 AI 宠物助手</el-menu-item>

        <!-- 仅管理员可见 -->
        <el-menu-item v-if="loginUser.role === '管理员'" index="/home/owner">👥 主人管理</el-menu-item>
        <el-menu-item v-if="loginUser.role === '管理员'" index="/home/service">🛁 服务项目管理</el-menu-item>
        <el-menu-item v-if="loginUser.role === '管理员'" index="/home/reserveAudit">✅ 预约审核处理</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background:#fff8f0;display:flex;justify-content:flex-end;align-items:center;padding-right:24px;border-bottom:2px solid #f4e2d0">
        <span style="font-size:16px">欢迎：{{loginUser.username}} 【{{loginUser.role}}】 🐶</span>
        <el-button text @click="logout" style="margin-left:12px">退出登录</el-button>
      </el-header>
      <!-- 主体背景改成浅米色，柔和护眼 -->
      <el-main style="background-color:#fffbf6">
        <!-- 未支付订单提醒：常驻直到手动关闭 -->
        <div v-if="unreadUnpaid.length" style="margin-bottom:12px">
          <el-alert v-for="u in unreadUnpaid" :key="u.billId" type="warning" show-icon :closable="true"
                    @close="closeUnpaid(u.billId)"
                    style="margin-bottom:8px;border-radius:12px"
                    :title="`💸 您有未支付订单：${u.petName} - ${u.serviceName}（¥${u.totalAmount}）`"
                    :description="`请到「我的账单」尽快支付，支持线上/线下，可用积分抵扣 🐾`">
          </el-alert>
        </div>
        <!-- 服务完成常驻提醒：直到主人手动关闭 -->
        <div v-if="unreadDone.length" style="margin-bottom:12px">
          <el-alert v-for="n in unreadDone" :key="n.id" type="success" show-icon :closable="true"
                    @close="closeDone(n.id)"
                    style="margin-bottom:8px;border-radius:12px"
                    :title="`🎉 服务完成：您的宠物「${n.petName}」的「${n.serviceName}」已完成啦！`"
                    :description="`服务时长已按实际时间记录，快去「我的账单」查看并支付吧 🐾`">
          </el-alert>
        </div>
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
const router = useRouter()
const loginUser = ref(JSON.parse(sessionStorage.getItem('loginUser')))

//退出登录
const logout = ()=>{
  sessionStorage.removeItem("loginUser")
  router.push("/login")
}

/* ===== 主人端：服务完成提醒（常驻横幅，直到主人手动关闭） ===== */
let doneTimer = null
const unreadDone = ref([])  // 未关闭的完成提醒
const closedIds = ref(JSON.parse(localStorage.getItem('doneClosedIds') || '[]'))  // 已关闭的预约ID

/* ===== 主人端：未支付订单提醒（常驻横幅，直到主人手动关闭） ===== */
const unreadUnpaid = ref([])  // 未关闭的未支付提醒
const closedUnpaidIds = ref(JSON.parse(localStorage.getItem('unpaidClosedIds') || '[]'))  // 已关闭的账单ID

// 把新完成的预约加入提醒列表
const pushDone = (fresh)=>{
  fresh.forEach(r=>{
    if(!closedIds.value.includes(r.id) && !unreadDone.value.some(u=>u.id===r.id)){
      unreadDone.value.push({ id:r.id, petName:r.petName, serviceName:r.serviceName, reserveDate:r.reserveDate })
    }
  })
}

// 主人手动关闭提醒（记住，不再显示）
const closeDone = (id)=>{
  unreadDone.value = unreadDone.value.filter(u=>u.id!==id)
  closedIds.value.push(id)
  localStorage.setItem('doneClosedIds', JSON.stringify(closedIds.value))
}

// 把未支付账单加入提醒列表
const pushUnpaid = (bills)=>{
  bills.forEach(b=>{
    if(!closedUnpaidIds.value.includes(b.billId) && !unreadUnpaid.value.some(x=>x.billId===b.billId)){
      unreadUnpaid.value.push({ billId:b.billId, petName:b.petName, serviceName:b.serviceName, totalAmount:b.totalAmount })
    }
  })
}

// 主人手动关闭未支付提醒
const closeUnpaid = (billId)=>{
  unreadUnpaid.value = unreadUnpaid.value.filter(x=>x.billId!==billId)
  closedUnpaidIds.value.push(billId)
  localStorage.setItem('unpaidClosedIds', JSON.stringify(closedUnpaidIds.value))
}

// 查询未支付账单（历史+新出现的都显示，直到手动关闭）
const loadUnpaid = async ()=>{
  if(loginUser.value.role === '管理员') return
  try{
    const res = await axios.get(`/bill/my?username=${loginUser.value.username}`)
    pushUnpaid(res.data.filter(b=>b.payStatus==='未支付'))
  }catch(e){ /* 忽略网络波动 */ }
}

// 初始化：把历史已完成但未关闭的预约加入常驻提醒（直到主人手动关闭）
const initDoneNotify = async ()=>{
  if(loginUser.value.role === '管理员') return
  try{
    const res = await axios.get(`/reserve/my?username=${loginUser.value.username}`)
    const done = res.data.filter(r=>r.status==='已完成')
    pushDone(done)
  }catch(e){ /* 忽略网络波动 */ }
}

// 每15秒检查：有新完成的预约就加到常驻提醒区
const pollDone = async ()=>{
  if(loginUser.value.role === '管理员') return
  try{
    const res = await axios.get(`/reserve/my?username=${loginUser.value.username}`)
    const fresh = res.data.filter(r=>r.status==='已完成' && !closedIds.value.includes(r.id))
    pushDone(fresh)
  }catch(e){ /* 忽略网络波动 */ }
}

onMounted(()=>{
  initDoneNotify()
  loadUnpaid()
  doneTimer = setInterval(()=>{
    pollDone()
    loadUnpaid()
  }, 15000)
})
onUnmounted(()=>{
  if(doneTimer) clearInterval(doneTimer)
})
</script>

<style scoped>
</style>
