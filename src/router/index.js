import { createRouter, createWebHistory } from 'vue-router'
// 路由懒加载：按需加载页面组件，减少首屏包体积
const Login = () => import('../views/Login.vue')
const Register = () => import('../views/Register.vue')
const Home = () => import('../views/Home.vue')
const PetTable = () => import('../views/PetTable.vue')
const OwnerTable = () => import('../views/OwnerTable.vue')
const NoticeTable = () => import('../views/NoticeTable.vue')
const MessageTable = () => import('../views/MessageTable.vue')
const ServiceTable = () => import('../views/ServiceTable.vue')
const ReserveTable = () => import('../views/ReserveTable.vue')
const ReserveAudit = () => import('../views/ReserveAudit.vue')
const Dashboard = () => import('../views/Dashboard.vue')
const StaffTable = () => import('../views/StaffTable.vue')
const MemberTable = () => import('../views/MemberTable.vue')
const BillTable = () => import('../views/BillTable.vue')
const AIChat = () => import('../views/AIChat.vue')

const routes = [
    { path:'/', redirect:'/login' },
    { path:'/login', component: Login },
    { path:'/register', component: Register },
    {
        path:'/home',
        component: Home,
        children:[
            { path:'pet', component: PetTable },
            { path:'owner', component: OwnerTable },
            { path:'notice', component: NoticeTable },
            { path:'message', component: MessageTable },
            { path:'service', component: ServiceTable },
            { path:'reserve', component: ReserveTable }, //宠物主人：我的预约【所有人可进】
            { path:'reserveAudit', component: ReserveAudit }, //管理员：预约审核【仅管理员】
            { path:'dashboard', component: Dashboard },      //管理员：店铺总览【仅管理员】
            { path:'staff', component: StaffTable },         //店员：查看/管理员管理
            { path:'member', component: MemberTable },       //会员：主人看积分/管理员管理
            { path:'bill', component: BillTable },            //账单：主人支付/管理员查看
            { path:'ai', component: AIChat }                   //AI宠物助手（Spring AI）
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

//路由全局守卫
router.beforeEach((to,from,next)=>{
    const userStr = sessionStorage.getItem("loginUser")
    if(to.path === '/login' || to.path === '/register'){
        next()
    }else{
        if(!userStr){
            next("/login")
        }else{
            const loginUser = JSON.parse(userStr)
            //管理员专属页面列表：主人管理、服务项目、预约审核、店铺总览
            const adminPages = ['/home/service','/home/reserveAudit','/home/owner','/home/dashboard']
            if(adminPages.includes(to.path) && loginUser.role !== '管理员'){
                alert("您没有权限访问该页面")
                next("/home/pet")
            }else{
                next()
            }
        }
    }
})

export default router
