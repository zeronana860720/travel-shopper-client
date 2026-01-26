<template>
  <div class="commissions-page">
    <div class="page-header">
      <h2>委託審核中心 (๑•̀ㅂ•́)و✧</h2>
      <p>-----------</p>
    </div>

    <div class="commissions-grid">
      <div
          v-for="item in pendingCommissions"
          :key="item.serviceCode"
          class="simple-card"
      >
        <div class="card-img-box">
          <img
              :src="item.imageUrl ? ('http://127.0.0.1:5275' + item.imageUrl) : 'https://i.pinimg.com/1200x/f7/d1/36/f7d136d44bbad6846e1385711a6a634b.jpg'"
              class="product-img"
          >
          <span class="img-tag status-pending">審核中</span>
        </div>

        <div class="card-info">
          <h3 class="product-name">{{ item.title }}</h3>

          <div class="detail-row">
            <span class="label">價格：</span>
            <span class="value price">{{item.currency}}$ {{ item.price }}</span>
          </div>

          <div class="detail-row">
            <span class="label">購買地點：</span>
            <span class="value">{{ item.location }}</span>
          </div>
          <div class="detail-row">
            <span class="label">截止時間：</span>
            <span class="value">{{ item.deadline }}</span>
          </div>

          <div class="card-actions">
            <button class="approve-action-btn" @click.stop="handleApprove(item.serviceCode)">
              審核通過
            </button>
            <button class="reject-action-btn" @click.stop="handleReject(item.serviceCode)">
              退回
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="pendingCommissions.length === 0" class="empty-box">
      目前沒有需要審核的委託，辛苦囉！ (｡･ω･｡)
    </div>
  </div>
</template>

<script setup lang="ts" name = 'Review'>
import { computed, onMounted } from 'vue';
import { useCommissionStore } from '@/stores/commission';

// 1. 初始化 Store
const store = useCommissionStore();

// 2. 頁面掛載時，抓取所有委託資料
onMounted(() => {
  store.fetchUserManageCommissions();
});

// 3. 核心過濾邏輯：只把「審核中」的委託抓出來顯示
const pendingCommissions = computed(() => {
  return store.commissions.filter(item => item.status === '審核中');
});
console.log(pendingCommissions);

// 4. 實作「審核通過」
// 1. ✨ 自動化審核通過邏輯
const handleApprove = async (serviceCode: string) => {
  // 還是要確認一下，避免手滑點錯喔 (｡◕∀◕｡)
  if (confirm('確定要通過這筆委託嗎？')) {
    try {
      // 直接呼叫 Store 的 action
      // 傳入 true (通過), 並自動填寫 reason 為 "通過"
      const result = await store.reviewCommission(serviceCode, true, '通過');

      if (result?.success) {
        alert('審核通過成功！(๑˃ᴗ˂)ﻭ');
        // 重新整理列表，讓該卡片消失
        await store.fetchUserManageCommissions();
      }
    } catch (error: any) {
      alert(error.message || '操作失敗，請稍後再試');
    }
  }
};

// 5. 實作「審核失敗」
const handleReject = async (serviceCode: string) => {
  const reason = prompt('請輸入審核失敗的原因 (´•ω•̥`)');
  if (reason) {
    try {
      const result = await store.rejectCommission(serviceCode, reason);
      if (result?.success) {
        alert('已標記為審核失敗');
        await store.fetchUserManageCommissions(); // 重新整理列表
      }
    } catch (error: any) {
      alert(error.message || '操作失敗');
    }
  }
};
</script>

<style scoped>
/* 延用原本的頁面內距 */
.commissions-page {
  padding: 20px;
}

/* 標題區域樣式 */
.page-header {
  margin-bottom: 30px;
  border-left: 5px solid #fb7299;
  padding-left: 15px;
}
.page-header h2 {
  font-size: 24px;
  color: #222;
  margin-bottom: 5px;
}
.page-header p {
  color: #9499a0;
  font-size: 14px;
}

/* 延用原本的網格佈局 */
.commissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

/* 卡片與圖片框 (參照原樣式) */
.simple-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #eee;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s;
}
.simple-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.1);
}
.card-img-box {
  height: 180px;
  position: relative;
}
.product-img {
  width: 100%; height: 100%; object-fit: cover;
}

/* 狀態標籤 (使用原本的黃色) */
.img-tag {
  position: absolute; top: 10px; right: 10px;
  padding: 4px 12px; border-radius: 20px;
  color: white; font-size: 12px; font-weight: bold;
}
.status-pending { background-color: #ffb11b; }

/* 資訊內容區 */
.card-info { padding: 15px; }
.product-name { font-size: 16px; margin-bottom: 10px; font-weight: bold; }
.detail-row { font-size: 13px; margin-bottom: 5px; color: #666; }
.price { color: #fb7299; font-weight: bold; }

/* ✨ 關鍵：審核按鈕樣式 */
.card-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.approve-action-btn {
  flex: 2; /* 讓通過按鈕寬一點，引導點擊 */
  background-color: #fb7299;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: 0.2s;
}
.approve-action-btn:hover { background-color: #ff85ad; }

.reject-action-btn {
  flex: 1;
  background-color: white;
  color: #9499a0;
  border: 1px solid #ccd0d7;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
}
.reject-action-btn:hover {
  background-color: #f4f5f7;
  color: #ff4d4f;
  border-color: #ff4d4f;
}

.empty-box {
  text-align: center; padding: 100px; color: #bbb;
}
</style>