<template>
  <nav class="bili-nav">
    <div class="nav-left-group">
      <div class="logo-wrapper" @click="router.push('/homepage')">
        <img src="@/assets/everett.png" alt="logo" class="logo-img">
        <span class="logo-text">demo</span>
      </div>

      <div class="nav-links">
        <span class="nav-link-item" @click="goToProducts">買東西</span>
        <span class="nav-link-item" @click="goToCommissions">接委託</span>
      </div>
    </div>

    <div class="nav-center">
      <div class="search-bar">
        <div class="search-dropdown"
             @mouseenter="isOpen = true"
             @mouseleave="isOpen = false"
        >
          <span class="selected-category">{{ selectCategory }}</span>
          <i class="arrow-down"></i>

          <transition name="dropdown-slide">
            <ul class="dropdown-menu" v-show="isOpen">
              <li v-for="item in categories" :key="item" @click.stop="handleSelect(item)">{{ item }}</li>
            </ul>
          </transition>
        </div>
        <input type="text" placeholder="探索感興趣的內容..." />
        <button class="search-btn" type="button">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="nav-right">
      <template v-if="isLoggedIn">
        <div class="action-group">
          <button class="action-btn-outline" @click="navigateTo('/user/shops')">
            <span class="btn-icon">+</span> 新增商品
          </button>
          <button class="action-btn-outline" @click="goToCreateCommission">
            <span class="btn-icon">+</span> 新增委託
          </button>
        </div>

        <div class="user-profile-wrapper">
          <div class="avatar-box">
            <img :src="getImageUrl(currentUserAvatar)" alt="User Avatar" class="avatar-img">
          </div>

          <div class="profile-card">
            <div class="card-header">
              <p class="user-name">{{ currentUserName }}</p>
              <div class="user-badges"><span class="badge-vip">小幫手賣家</span></div>
            </div>
            <ul class="card-menu">
              <li @click="navigateTo('/user/profile')"><span>會員中心</span> <i class="arrow">〉</i></li>
              <li><span>我的錢包</span> <i class="arrow">〉</i></li>
              <li @click="navigateTo('/user/orders')"><span>訂單管理</span> <i class="arrow">〉</i></li>
              <li @click="navigateTo('/user/commissions')"><span>委託管理</span> <i class="arrow">〉</i></li>
              <li @click="navigateTo('/user/shops')"><span>賣場管理</span> <i class="arrow">〉</i></li>
              <li><span>訊息中心</span> <i class="arrow">〉</i></li>
            </ul>
            <div class="card-footer">
              <div class="logout-item" @click="handleLogout">登出帳號</div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="auth-section">
        <button class="login-btn" @click="navigateTo('/login')">登入</button>
        <button class="register-btn" @click="navigateTo('/register')">註冊</button>
      </div>
    </div>
  </nav>

  <main class="main-content">
    <router-view />
  </main>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 使用 computed 從 store 取得狀態（響應式）
const isLoggedIn = computed(() => authStore.isLoggedIn);
const currentUserName = computed(() => authStore.userName || '訪客');
const currentUserAvatar = ref(localStorage.getItem('userAvatar') || '');

const isOpen = ref(false);
const selectCategory = ref('全站');
const categories = ['全站', '周邊', '食品', '紀念品'];

// 監聽路由變化時更新頭像
watch(() => route.path, () => {
  currentUserAvatar.value = localStorage.getItem('userAvatar') || '';
});

const handleSelect = (category: string) => {
  selectCategory.value = category;
  isOpen.value = false;
};

const goToProducts = () => router.push('/products');
const goToCreateCommission = () => router.push('/create-commission');
const goToCommissions = () => router.push('/commissions');

const navigateTo = (path: string) => {
  router.push(path);
};

// 登出邏輯：使用 store 的 logout
const handleLogout = () => {
  if (confirm('確定要登出嗎？')) {
    authStore.logout();
    router.push('/login');
  }
};

// 初始化時讀取 balance 和監聽事件
onMounted(() => {
  // authStore.initializeAuth();

  window.addEventListener('user-data-updated', () => {
    currentUserAvatar.value = localStorage.getItem('userAvatar') || '';
  });
});

const getImageUrl = (path: string) => {
  if (!path) return 'https://i.imgur.com/6VBx3io.png';
  if (path.startsWith('blob:') || path.startsWith('data:')) return path;
  return `http://localhost:5275${path}`;
};
</script>


<style scoped>
/* 保持妳原本漂亮的 CSS 不變 */
.bili-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  height: 64px;
  background-color: rgba(255, 255, 255, 0.95);
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  backdrop-filter: blur(20px);
  box-shadow: 0 1px 5px rgba(0,0,0,0.05);
  border-bottom: 1px solid #f1f2f3;
}

.nav-left-group { display: flex; align-items: center; gap: 30px; }
.logo-wrapper { display: flex; align-items: center; cursor: pointer; }
.logo-img { width: 30px; height: 30px; border-radius: 6px; margin-right: 8px; }
.logo-text { font-size: 20px; font-weight: 900; color: #fb7299; letter-spacing: -0.5px; }
.nav-links { display: flex; gap: 20px; }
.nav-link-item { font-size: 15px; color: #18191c; cursor: pointer; position: relative; transition: color 0.3s; }
.nav-link-item:hover { color: #fb7299; }
.nav-link-item::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 2px; background-color: #fb7299; transition: width 0.3s; }
.nav-link-item:hover::after { width: 100%; }

.nav-center { flex: 1; max-width: 420px; margin: 0 20px; }
.search-bar { display: flex; align-items: center; background-color: #f1f2f3; border-radius: 8px; padding: 0 8px 0 16px; height: 36px; border: 1px solid transparent; transition: 0.3s; }
.search-bar:focus-within { background-color: white; border-color: #fb7299; }
.search-dropdown { position: relative; display: flex; align-items: center; padding-right: 12px; margin-right: 12px; font-size: 13px; color: #61666d; border-right: 1px solid #e3e5e7; cursor: pointer; }
.arrow-down { border-top: 4px solid #9499a0; border-left: 3px solid transparent; border-right: 3px solid transparent; margin-left: 6px; }

.dropdown-menu {
  position: absolute; top: 40px; left: -10px;
  background: white; border-radius: 6px; width: 90px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1); border: 1px solid #e3e5e7;
  list-style: none; padding: 5px 0; z-index: 1001;
}
.dropdown-menu li { padding: 8px 12px; font-size: 13px; color: #18191c; }
.dropdown-menu li:hover { background-color: #f1f2f3; color: #fb7299; }

.dropdown-slide-enter-active, .dropdown-slide-leave-active { transition: all 0.4s ease; }
.dropdown-slide-enter-from, .dropdown-slide-leave-to { opacity: 0; transform: translateY(-10px); }

.search-bar input { flex: 1; background: transparent; border: none; outline: none; font-size: 13px; }
.search-btn { background: transparent; border: none; color: #61666d; cursor: pointer; padding: 4px; }
.search-btn:hover { color: #fb7299; }

.nav-right { display: flex; align-items: center; gap: 20px; }
.action-group { display: flex; gap: 10px; }
.action-btn-outline { background: white; color: #61666d; border: 1px solid #ccd0d7; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s; }
.action-btn-outline:hover { color: #fb7299; border-color: #fb7299; background-color: #fff0f3; }
.btn-icon { font-size: 16px; font-weight: 400; color: #fb7299; }

.auth-section { display: flex; gap: 12px; }
.login-btn { background: #f1f2f3; color: #18191c; border: none; padding: 8px 22px; border-radius: 8px; font-size: 14px; cursor: pointer; transition: all 0.3s ease; }
.login-btn:hover { background: #e3e5e7; transform: translateY(-1px); }
.register-btn { background: #fb7299; color: white; border: none; padding: 8px 22px; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.register-btn:hover { background: #ff85a2; transform: translateY(-2px) scale(1.02); box-shadow: 0 4px 15px rgba(251, 114, 153, 0.4); }

.user-profile-wrapper {
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-box {
  display: flex;
  align-items: center;
  z-index: 102;
  cursor: pointer;
}

.avatar-img {
  width: 50px; height: 50px; border-radius: 50%;
  border: 1px solid #e3e5e7; background-color: white;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.user-profile-wrapper:hover .avatar-img {
  transform: scale(1.5) translateY(5px);
  border-color: #fb7299;
}

.profile-card {
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px);
  transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);

  position: absolute;
  top: 100%;
  right: -10px;
  width: 240px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-top: 15px;
  border: 1px solid #f1f2f3;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  z-index: 100;
}

.profile-card::before {
  content: "";
  position: absolute;
  top: -15px;
  left: calc(100% - 40px);
  width: 40px;
  height: 15px;
  background: transparent;
}

.user-profile-wrapper:hover .profile-card {
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.user-name { color: #fb7299; font-size: 17px; font-weight: bold; margin-bottom: 4px; }
.badge-vip { background: #fff0f3; color: #fb7299; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
.card-menu { list-style: none; padding: 10px 0; border-bottom: 1px solid #f1f2f3; }
.card-menu li { display: flex; justify-content: space-between; align-items: center; padding: 10px 8px; cursor: pointer; font-size: 13px; color: #61666d; border-radius: 6px; transition: 0.2s; }
.card-menu li:hover { background-color: #f6f7f8; color: #fb7299; }
.arrow { color: #c9ccd0; font-size: 9px; font-style: normal; }
.logout-item { padding-top: 15px; color: #9499a0; font-size: 12px; text-align: center; cursor: pointer; transition: 0.2s; }
.logout-item:hover { color: #fb7299; }

.main-content { padding-top: 64px; }
* { margin: 0; padding: 0; box-sizing: border-box; }
</style>