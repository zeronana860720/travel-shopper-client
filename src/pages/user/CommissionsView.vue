<template>
  <div class="commissions-page">
    <div class="tab-switcher">
      <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['switch-btn', { active: currentTab === tab.id }]"
          @click="currentTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="commissions-grid">
      <div
          v-for="item in filteredCommissions"
          :key="item.serviceCode"
          class="simple-card"
      >
        <div class="card-img-box">
          <img
              :src="item.imageUrl ? ('http://127.0.0.1:5275' + item.imageUrl) : 'https://i.pinimg.com/1200x/f7/d1/36/f7d136d44bbad6846e1385711a6a634b.jpg'"
              :alt="item.title"
              class="product-img"
          >
          <span class="img-tag" :class="currentTab">{{ getStatusLabel }}</span>

          <!-- 懸浮編輯層 (只在已發佈和審核失敗時顯示) -->
          <div
              v-if="currentTab === 'published' || currentTab === 'failed'"
              class="card-overlay"
              @click.stop="handleEdit(item.serviceCode)"
          >
            <span class="edit-text">編輯委託</span>
          </div>
        </div>

        <div class="card-info">
          <h3 class="product-name">{{ item.title }}</h3>

          <div class="detail-row">
            <span class="label">參考價格：</span>
            <span class="value price">NT$ {{ item.price }}</span>
          </div>

          <div class="detail-row">
            <span class="label">購買地點：</span>
            <span class="value">{{ item.location }}</span>
          </div>

          <div class="detail-row">
            <span class="label">截止日期：</span>
            <span class="value date">{{ formatDate(item.createdAt) }}</span>
          </div>

          <div v-if="currentTab === 'failed'" class="failed-reason">
            <strong>失敗原因：</strong>
          </div>

          <!-- ✨ 操作按鈕區域 -->
          <div class="card-actions">
            <!-- 已發佈：編輯 + 刪除 -->
            <template v-if="currentTab === 'published'">
              <button class="edit-action-btn" @click.stop="handleEdit(item.serviceCode)">
                <i class="icon">✎</i> 編輯資訊
              </button>
              <button class="delete-action-btn" @click.stop="handleDelete(item.serviceCode)">
                <i class="icon"></i> 刪除委託
              </button>
            </template>

            <!-- 審核中：只能刪除 -->
            <template v-else-if="currentTab === 'pending'">
              <button class="delete-action-btn full-width" @click.stop="handleDelete(item.serviceCode)">
                <i class="icon"></i> 刪除委託
              </button>
            </template>

            <!-- 審核失敗：編輯 + 刪除 -->
            <template v-else-if="currentTab === 'failed'">
              <button class="edit-action-btn" @click.stop="handleEdit(item.serviceCode)">
                <i class="icon">✎</i> 重新編輯
              </button>
              <button class="delete-action-btn" @click.stop="handleDelete(item.serviceCode)">
                <i class="icon"></i> 刪除委託
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredCommissions.length === 0" class="empty-box">
      目前沒有相關的委託內容 (｡･ω･｡)
    </div>
  </div>
</template>

<script setup lang="ts" name="commissions-page">
import { ref, computed, onMounted } from 'vue';
import { useCommissionStore } from '@/stores/commission'; // 確保路徑對應你的 Pinia store

// 1. 初始化 Store
const store = useCommissionStore();

// 2. 頁籤相關設定
type TabType = 'published' | 'pending' | 'failed';
const currentTab = ref<TabType>('published');

// 把這裡加上型別定義
const tabs: { id: TabType; label: string }[] = [
  { id: 'published', label: '已發佈' },
  { id: 'pending', label: '審核中' },
  { id: 'failed', label: '審核失敗' }
];

// 3. 頁面掛載時，立刻去後端抓資料
onMounted(() => {
  store.fetchUserManageCommissions();
  console.log('檢查後端回傳的資料：', store.commissions);
});

// 4. 修改後的動態篩選邏輯
const filteredCommissions = computed(() => {
  // 從 store 的 commissions 陣列中過濾
  return store.commissions.filter(item => {
    if (currentTab.value === 'pending') return item.status === '審核中';
    if (currentTab.value === 'failed') return item.status === '審核失敗';
    if (currentTab.value === 'published') {
      // 除了審核中和失敗，其餘已通過審核的狀態（如：出貨中、已寄出）都放在這一欄
      return item.status !== '審核中' && item.status !== '審核失敗';
    }
    return false;
  });
});

// 5. 狀態標籤文字
const getStatusLabel = computed(() => {
  if (currentTab.value === 'published') return '已上架';
  if (currentTab.value === 'pending') return '審核中';
  return '未通過';
});

// 6. 操作函式（之後可以再補上 API 呼叫）
const handleEdit = (id: string | number) => {
  alert(`開啟編輯 - ID: ${id}`);
};

const handleDelete = (id: string | number) => {
  if (confirm('確定要刪除嗎？ (´•̥̥̥ω•̥̥̥`)')) {
    alert(`執行刪除 - ID: ${id}`);
  }
};

// ✨ 新增：日期格式化工具
const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return '無日期';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-'); // 把 / 換成 -
};
</script>

<style scoped>
.commissions-page {
  padding: 10px;
}

/* --- 切換鈕 --- */
.tab-switcher {
  display: flex;
  background: #eee;
  padding: 4px;
  border-radius: 25px;
  width: fit-content;
  margin-bottom: 25px;
}

.switch-btn {
  border: none;
  padding: 8px 24px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  background: transparent;
  transition: all 0.3s;
}

.switch-btn.active {
  background: white;
  color: #fb7299;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* --- 網格 --- */
.commissions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* --- 卡片 --- */
.simple-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.simple-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.08);
  border-color: #fb7299;
}

.card-img-box {
  position: relative;
  height: 160px;
  background-color: #f8f8f8;
  overflow: hidden;
}

/* 懸浮編輯層 */
.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: 0.3s;
  cursor: pointer;
  z-index: 2;
}

.simple-card:hover .card-overlay {
  opacity: 1;
}

.edit-text {
  color: white;
  border: 1px solid white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* --- 狀態標籤 --- */
.img-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  color: white;
  font-size: 13px;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  z-index: 3;
}
.published { background-color: #fb7299; }
.pending { background-color: #ffb11b; }
.failed { background-color: #9499a0; }

/* --- 資訊內文 --- */
.card-info {
  padding: 15px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 16px;
  color: #222;
  margin-bottom: 12px;
  height: 24px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.detail-row {
  display: flex;
  font-size: 13px;
  margin-bottom: 6px;
  line-height: 1.4;
}

.label {
  color: #9499a1;
  width: 70px;
  flex-shrink: 0;
}

.value {
  color: #222;
}

.price {
  color: #fb7299;
  font-weight: bold;
}

.date {
  color: #ff6699;
}

/* 失敗原因區塊 */
.failed-reason {
  margin-top: 10px;
  padding: 8px;
  background-color: #fff1f0;
  border-radius: 4px;
  font-size: 12px;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

/* ✨ 操作按鈕區域 */
.card-actions {
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px dotted #eee;
  display: flex;
  gap: 8px;
}

.edit-action-btn,
.delete-action-btn {
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  border: 1px solid;
}

.edit-action-btn {
  background: white;
  border-color: #ccd0d7;
  color: #666;
}

.edit-action-btn:hover {
  border-color: #fb7299;
  color: #fb7299;
  background-color: #fff0f3;
}

.delete-action-btn {
  background: white;
  border-color: #ffccc7;
  color: #ff4d4f;
}

.delete-action-btn:hover {
  background-color: #fff1f0;
  border-color: #ff4d4f;
}

.delete-action-btn.full-width {
  flex: 1 1 100%;
}

.empty-box {
  padding: 100px 0;
  text-align: center;
  color: #bbb;
}
</style>
