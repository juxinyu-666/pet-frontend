<template>
  <div>
    <h2 style="color:#44607c;margin-top:0">⭐ 会员管理</h2>

    <!-- 主人视角：我的会员卡 -->
    <el-card v-if="loginUser.role !== '管理员'" shadow="hover" class="member-card">
      <template v-if="myMember">
        <div class="member-title">我的会员卡</div>
        <div class="member-level">💎 {{ myMember.level }}</div>
        <div class="member-points">当前积分：<b style="color:#d97706;font-size:22px">{{ myMember.points }}</b></div>
        <div class="member-tip">规则：消费 1 元 = 1 积分；50 积分 = 1 元抵扣</div>
      </template>
      <template v-else>
        <div class="member-title">我还没有会员</div>
        <div class="member-tip">请联系店主开通会员，享受积分抵扣优惠 🐾</div>
      </template>
    </el-card>

    <!-- 管理员视角：会员管理列表 -->
    <template v-if="loginUser.role === '管理员'">
      <el-button type="primary" @click="openAdd" style="margin-bottom:10px">➕ 开通会员</el-button>
      <el-table :data="tableData" border stripe
                :header-cell-style="{background:'#e8f0f8',color:'#2c4763'}">
        <el-table-column prop="memberId" label="会员编号" width="90"></el-table-column>
        <el-table-column prop="username" label="用户账号"></el-table-column>
        <el-table-column prop="level" label="会员等级"></el-table-column>
        <el-table-column prop="points" label="积分"></el-table-column>
        <el-table-column prop="createTime" label="开通时间"></el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="scope">
            <el-button size="small" @click="openEdit(scope.row)">调整</el-button>
            <el-button size="small" type="danger" @click="handleDel(scope.row.memberId)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog v-model="dialogVisible" :title="form.memberId ? '调整会员' : '开通会员'">
        <el-form :model="form" label-width="90px">
          <el-form-item label="用户账号">
            <el-select v-if="!form.memberId" v-model="form.userId" filterable placeholder="选择要开通的用户"
                       style="width:100%">
              <el-option v-for="u in users" :key="u.userId" :label="`${u.username}（${u.role}）`" :value="u.userId"></el-option>
            </el-select>
            <el-input v-else :value="form.username" disabled></el-input>
          </el-form-item>
          <el-form-item label="会员等级">
            <el-select v-model="form.level" style="width:100%">
              <el-option label="普通会员" value="普通会员"></el-option>
              <el-option label="黄金会员" value="黄金会员"></el-option>
              <el-option label="钻石会员" value="钻石会员"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="积分">
            <el-input-number v-model="form.points" :min="0"></el-input-number>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible=false">取消</el-button>
          <el-button type="primary" @click="submit">保存</el-button>
        </template>
      </el-dialog>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const loginUser = ref(JSON.parse(sessionStorage.getItem("loginUser")))
const myMember = ref(null)
const tableData = ref([])
const users = ref([])
const dialogVisible = ref(false)
const form = ref({ memberId:null, userId:null, username:'', level:'普通会员', points:0 })

const loadMy = async ()=>{
  const res = await axios.get(`/member/my?username=${loginUser.value.username}`)
  myMember.value = res.data
}

const loadList = async ()=>{
  const res = await axios.get('/member/list')
  tableData.value = res.data
  const u = await axios.get('/user/list')
  users.value = u.data
}

const openAdd = ()=>{
  form.value = { memberId:null, userId:null, username:'', level:'普通会员', points:0 }
  dialogVisible.value = true
}

const openEdit = (row)=>{
  form.value = { ...row }
  dialogVisible.value = true
}

const submit = async ()=>{
  if(!form.value.userId && !form.value.memberId){ alert("请选择用户"); return }
  if(form.value.memberId){
    await axios.put('/member/update', form.value)
  }else{
    await axios.post('/member/add', form.value)
  }
  dialogVisible.value = false
  loadList()
}

const handleDel = async (id)=>{
  if(confirm("确定取消该会员？")){
    await axios.delete(`/member/delete/${id}`)
    loadList()
  }
}

onMounted(()=>{
  if(loginUser.value.role === '管理员'){
    loadList()
  }else{
    loadMy()
  }
})
</script>

<style scoped>
.member-card{
  border-radius:16px;
  background:linear-gradient(135deg,#fff7ed,#ffeef4);
  max-width:420px;
}
.member-title{ font-size:16px; color:#9a7b4f; font-weight:700; }
.member-level{ font-size:26px; color:#d97706; font-weight:800; margin:8px 0; }
.member-points{ font-size:14px; color:#44607c; }
.member-tip{ font-size:12px; color:#9aa8bb; margin-top:8px; }
</style>
