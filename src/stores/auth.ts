import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
    // 直接從 localStorage 初始化，避免初次渲染為 0
    const token = ref(localStorage.getItem('token') || '')
    const userName = ref(localStorage.getItem('userName') || '')

    // 修正點：直接在這裡初始化 balance
    const balance = ref<number>(Number(localStorage.getItem('balance')) || 0)

    const isLoggedIn = computed(() => !!token.value)

    function login(newToken: string, name: string, avatarUrl: string, userBalance: number,userId:string) {
        token.value = newToken
        userName.value = name
        balance.value = Number(userBalance)||0

        localStorage.setItem('token', newToken)
        localStorage.setItem('userName', name)
        localStorage.setItem('userAvatar', avatarUrl || '')
        // 確保存入的是字串
        localStorage.setItem('balance', userBalance.toString())
        localStorage.setItem('userId', userId.toString())
    }

    function logout() {
        token.value = ''
        userName.value = ''
        balance.value = 0 // 登出也要清空狀態
        localStorage.clear() // 或者逐項 removeItem
    }

    // 這個方法可以保留，用來手動從伺服器同步最新餘額，而不是只讀本地緩存
    async function refreshBalance() {
        // 這裡通常會串接 API 取得最新餘額
        // const res = await getProfile()
        // balance.value = res.data.balance
    }

    return { token, userName, isLoggedIn, login, logout, balance, refreshBalance }
})