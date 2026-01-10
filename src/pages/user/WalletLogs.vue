<template>
  <div class="logs-container">
    <div class="section-header">
      <h3 class="section-title">最近交易紀錄</h3>
      <span class="log-count">共 {{ walletLogs.length }} 筆資料</span>
    </div>

    <div v-if="isLoading" class="status-box">
      <div class="loading-spinner"></div>
      <p>讀取紀錄中...</p>
    </div>

    <div v-else-if="walletLogs.length === 0" class="status-box empty">
      這裡還空空如也，快去進行第一筆交易吧 ( ﾟ∀ﾟ)
    </div>

    <div v-else class="log-grid">
      <div v-for="log in walletLogs" :key="log.id" class="log-card">
        <div class="log-main">
          <div class="log-type-tag" :class="log.action.toLowerCase()">
            {{ log.action === 'Deposit' ? '儲值' : '異動' }}
          </div>
          <div class="log-content">
            <div class="log-title">{{ log.action === 'Deposit' ? '錢包餘額儲值' : '帳戶金額調整' }}</div>
            <div class="log-time">{{ new Date(log.createdAt).toLocaleString() }}</div>
          </div>
        </div>

        <div class="log-values">
          <div class="log-amount-wrapper">
            <span class="label">變動金額：</span>
            <span class="value price">+NT$ {{ log.amount.toLocaleString() }}</span>
          </div>
          <div class="log-balance-wrapper">
            <span class="label">異動後餘額：</span>
            <span class="value">{{ log.balance.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="walletLogs">
import {onMounted, ref} from "vue";
import {useWallet} from "@/composable/useWallet";

// 從組合式函數中拿取需要的資料與方法
const {
  walletLogs=ref([]),
  fetchWalletLogs,
  isLoading
} = useWallet();

// 當組件掛載完成後，立即去抓取後端的紀錄資料
onMounted(async () => {
  console.log("開始抓取紀錄...");
  await fetchWalletLogs(); // 👈 確保這裡有加上 await
  console.log("抓到的紀錄：", walletLogs.value);
});
</script>

<style scoped>
.logs-container {
  padding: 10px;
}

/* --- 標題區塊 --- */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  color: #222;
  font-weight: bold;
}

.log-count {
  font-size: 13px;
  color: #9499a1;
}

/* --- 狀態盒子 (載入中/無資料) --- */
.status-box {
  padding: 80px 0;
  text-align: center;
  color: #bbb;
  background: white;
  border-radius: 12px;
  border: 1px dashed #ddd;
}

/* --- 紀錄卡片網格 --- */
.log-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-card {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  border: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.log-card:hover {
  border-color: #fb7299;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transform: translateX(4px); /* 輕微往右動一下，很有互動感 */
}

/* --- 左側資訊 --- */
.log-main {
  display: flex;
  align-items: center;
  gap: 15px;
}

.log-type-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  background-color: #9499a0; /* 預設色 */
}

.log-type-tag.deposit {
  background-color: #fb7299; /* 儲值專用粉色 */
}

.log-title {
  font-size: 15px;
  color: #222;
  font-weight: 500;
  margin-bottom: 4px;
}

.log-time {
  font-size: 12px;
  color: #9499a1;
}

/* --- 右側數值 --- */
.log-values {
  text-align: right;
}

.log-amount-wrapper, .log-balance-wrapper {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.label {
  color: #9499a1;
}

.value {
  color: #222;
  min-width: 80px;
}

.price {
  color: #fb7299;
  font-weight: bold;
  font-size: 16px;
}
</style>