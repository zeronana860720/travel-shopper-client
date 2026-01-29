<template>
  <div class="shop-page">

    <div class="page-header">

      <div class="header-left">
        <div class="tab-group">
          <button
              v-for="tab in leftTabs"
              :key="tab.id"
              :class="['switch-btn', { active: currentTab === tab.id }]"
              @click="currentTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="header-right">
        <div class="tab-group">
          <button
              v-for="tab in rightTabs"
              :key="tab.id"
              :class="['switch-btn', { active: currentTab === tab.id }]"
              @click="currentTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <button class="add-store-btn" @click="openCreateModal">
          <i class="icon">+</i> 建立賣場
        </button>
      </div>

    </div>

    <div class="shop-grid">
      <div
          v-for="store in filteredStores"
          :key="store.storeId"
          class="simple-card"
      >
        <div class="card-img-box">
          <img
              :src="getStoreImageUrl(store.storeImage)"
              :alt="store.storeName"
              class="product-img"
          >
          <span class="img-tag" :class="getStatusClass(store.status)">
            {{ getStatusLabel(store.status) }}
          </span>

          <div class="card-overlay" @click.stop="handleEditStore(store.storeId)">
            <span class="edit-text">管理賣場</span>
          </div>
        </div>

        <div class="card-info">
          <h3 class="product-name">{{ store.storeName }}</h3>

          <div class="detail-row">
            <span class="label">建立日期：</span>
            <span class="value">{{ formatDate(store.createdAt) }}</span>
          </div>

          <div class="detail-row">
            <span class="label">狀態：</span>
            <span class="value" :class="getStatusTextColor(store.status)">
              {{ getStatusLabel(store.status) }}
            </span>
          </div>

          <div class="card-actions">
            <template v-if="store.status === 0 || store.status === 2">
              <button class="edit-action-btn" @click.stop="handleEditStore(store.storeId)">
                修改賣場資訊
              </button>
            </template>

            <template v-else-if="store.status === 3">
              <button class="edit-action-btn" @click.stop="handleEditStore(store.storeId)">
                進入賣場管理
              </button>
            </template>

            <template v-else>
              <button class="edit-action-btn disabled" disabled>
                審核進行中...
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredStores.length === 0" class="empty-box">
      目前這個分類下沒有賣場唷 (๑• . •๑)
    </div>

    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>建立新賣場</h3>
          <button class="close-icon" @click="showCreateModal = false">✕</button>
        </div>

        <div class="input-group">
          <label>賣場名稱 <span class="required">*</span></label>
          <input
              v-model="newStoreForm.storeName"
              placeholder="輸入賣場名稱，例如：東京代購小舖"
              maxlength="100"
              class="styled-input"
          />
        </div>

        <div class="input-group">
          <label>賣場封面（選填）</label>
          <div class="upload-box" @click="triggerFileSelect">
            <input
                type="file"
                ref="storeImageFileRef"
                accept="image/*"
                @change="handleImageSelect"
                style="display: none"
            />

            <div v-if="imagePreview" class="preview-container">
              <img :src="imagePreview" class="preview-img" alt=""/>
              <button class="remove-img-btn" @click.stop="removeImage">✕</button>
            </div>

            <div v-else class="upload-placeholder">
              <span class="plus-icon">+</span>
              <span>點擊上傳封面圖</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="showCreateModal = false">取消</button>
          <button
              class="confirm-btn"
              :disabled="!newStoreForm.storeName.trim()"
              @click="handleCreateStore"
          >
            建立賣場
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStoreStore } from '@/stores/store';

const store = useStoreStore();
const router = useRouter();

// --- 狀態定義 ---
const showCreateModal = ref(false);
const storeImageFileRef = ref<HTMLInputElement | null>(null);
const imagePreview = ref<string | null>(null);

const newStoreForm = ref({
  storeName: '',
  storeImage: null as File | null
});

const defaultImage = 'https://i.pinimg.com/1200x/f7/d1/36/f7d136d44bbad6846e1385711a6a634b.jpg';

// --- Tabs 設定 ---
type TabType = 'all' | 'draft' | 'published' | 'pending' | 'failed';
const currentTab = ref<TabType>('all');

// 左側 Tabs
const leftTabs: { id: TabType; label: string }[] = [
  { id: 'all',       label: '全部賣場' },
  { id: 'draft',     label: '草稿區' },
  { id: 'published', label: '已發布' }
];

// 右側 Tabs
const rightTabs: { id: TabType; label: string }[] = [
  { id: 'pending',   label: '審核中' },
  { id: 'failed',    label: '發布失敗' }
];

// --- 資料邏輯 ---
interface StoreItem {
  storeId: number;
  storeName: string;
  status: number; // 0:草稿, 1:審核中, 2:失敗, 3:已發布
  createdAt: string;
  storeImage?: string;
}

// 過濾器
const filteredStores = computed(() => {
  const allStores = store.stores;
  return allStores.filter(s => {
    if (currentTab.value === 'all') return true;
    if (currentTab.value === 'draft') return s.status === 0;
    if (currentTab.value === 'published') return s.status === 3;
    if (currentTab.value === 'pending') return s.status === 1;
    if (currentTab.value === 'failed') return s.status === 2;
    return false;
  });
});

onMounted(async () => {
  await store.fetchMyStores();
});

// --- 輔助函式 ---
const getStatusLabel = (status: number) => {
  switch (status) {
    case 0: return '草稿';
    case 1: return '審核中';
    case 2: return '發布失敗';
    case 3: return '已發布';
    default: return '未知';
  }
};

// 用於標籤背景色
const getStatusClass = (status: number) => {
  switch (status) {
    case 3: return 'published';
    case 1: return 'pending';
    case 2: return 'failed';
    case 0: return 'draft';
    default: return 'pending';
  }
};

// 用於文字顏色 (新增)
const getStatusTextColor = (status: number) => {
  switch (status) {
    case 3: return 'text-published';
    case 1: return 'text-pending';
    case 2: return 'text-failed';
    case 0: return 'text-draft';
    default: return '';
  }
};

const getStoreImageUrl = (path: string | undefined) => {
  if (!path) return defaultImage;
  if (path.startsWith('blob:') || path.startsWith('http')) return path;
  return `http://localhost:5275${path}`;
};

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return '無日期';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).replace(/\//g, '-');
};

// --- 操作函式 ---
const openCreateModal = () => {
  showCreateModal.value = true;
  newStoreForm.value = { storeName: '', storeImage: null };
  imagePreview.value = null;
};

const triggerFileSelect = () => {
  storeImageFileRef.value?.click();
};

const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    newStoreForm.value.storeImage = file;
    imagePreview.value = URL.createObjectURL(file);
  }
};

const removeImage = () => {
  newStoreForm.value.storeImage = null;
  imagePreview.value = null;
  if (storeImageFileRef.value) storeImageFileRef.value.value = '';
};

const handleCreateStore = async () => {
  if (!newStoreForm.value.storeName.trim()) return;
  try {
    const formData = new FormData();
    formData.append('storeName', newStoreForm.value.storeName);
    if (newStoreForm.value.storeImage) {
      formData.append('storeImage', newStoreForm.value.storeImage);
    }
    await store.createStore(formData);
    alert(`賣場「${newStoreForm.value.storeName}」建立成功！`);
    showCreateModal.value = false;
    openCreateModal();
  } catch (error: any) {
    alert(error.message || '建立失敗');
  }
};

const handleEditStore = (storeId: number) => {
  router.push(`/store/${storeId}/manage`);
};
</script>

<style scoped>
.shop-page {
  padding: 20px;
  max-width: 98%;
  margin: 0 auto;
  font-family: 'PingFang TC', 'Microsoft JhengHei', sans-serif;
}

/* --- Header 佈局 (重點修改) --- */
.page-header {
  display: flex;
  justify-content: space-between; /* 左右分佈 */
  align-items: center;
  margin-bottom: 30px;
}

/* 左側 Header */
.header-left {
  display: flex;
  align-items: center;
}

/* 右側 Header：按鈕靠在一起 */
.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* Tab 群組樣式 */
.tab-group {
  display: flex;
  background: #f1f2f5;
  padding: 4px;
  border-radius: 25px;
  gap: 2px;
}

.switch-btn {
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  background: transparent;
  transition: all 0.3s ease;
  font-weight: 500;
  white-space: nowrap;
}

.switch-btn.active {
  background: white;
  color: #fb7299;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.add-store-btn {
  background: linear-gradient(135deg, #fb7299 0%, #ff92ae 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 15px rgba(251, 114, 153, 0.3);
  white-space: nowrap;
}

.add-store-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(251, 114, 153, 0.4);
}

/* --- 網格佈局 --- */
.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 25px;
}

/* --- 卡片樣式 --- */
.simple-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

.simple-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  border-color: #ffdae3;
}

.card-img-box {
  position: relative;
  height: 160px;
  background-color: #f8f8f8;
  overflow: hidden;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.simple-card:hover .product-img {
  transform: scale(1.05);
}

/* 狀態標籤 (圖片右上角) */
.img-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 20px;
  z-index: 2;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

/* 背景顏色 Class */
.published { background-color: #fb7299; }
.pending   { background-color: #ffb11b; }
.failed    { background-color: #9499a0; }
.draft     { background-color: #00aeec; }

/* 文字顏色 Class (用於資訊欄) */
.text-published { color: #fb7299; font-weight: bold; }
.text-pending   { color: #ffb11b; font-weight: bold; }
.text-failed    { color: #9499a0; font-weight: bold; }
.text-draft     { color: #00aeec; font-weight: bold; }

.card-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
}

.simple-card:hover .card-overlay {
  opacity: 1;
}

.edit-text {
  color: white;
  border: 1px solid white;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: bold;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(4px);
}

.card-info {
  padding: 16px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 16px;
  color: #333;
  margin-bottom: 12px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-row {
  display: flex;
  font-size: 13px;
  margin-bottom: 8px;
  align-items: center;
}

.label { color: #9499a1; width: 70px; }
.value { color: #333; font-weight: 500; }

.card-actions {
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px dashed #eee;
}

.edit-action-btn {
  width: 100%;
  background: #fff5f7;
  border: 1px solid #ffdae3;
  color: #fb7299;
  padding: 8px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
  font-weight: bold;
}

.edit-action-btn:hover:not(:disabled) {
  background: #fb7299;
  color: white;
}

.edit-action-btn.disabled {
  background: #f5f5f5;
  border-color: #ddd;
  color: #999;
  cursor: not-allowed;
}

.empty-box {
  padding: 100px 0;
  text-align: center;
  color: #bbb;
  grid-column: 1 / -1;
}

/* --- 彈窗樣式 --- */
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.5);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 24px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  border: 2px solid #fff0f5;
  animation: slideUp 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.modal-content h3 {
  margin: 0;
  color: #fb7299;
  font-size: 20px;
  font-weight: 800;
}

.close-icon {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
}

.close-icon:hover { color: #fb7299; }

.input-group {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
}

.input-group label {
  font-size: 14px;
  color: #555;
  margin-bottom: 8px;
  font-weight: 600;
}

.required { color: #fb7299; }

.styled-input {
  padding: 12px 16px;
  border: 2px solid #eee;
  border-radius: 12px;
  font-size: 15px;
  color: #333;
  background: #fafafa;
}

.styled-input:focus {
  outline: none;
  border-color: #fb7299;
  background: white;
}

.upload-box {
  width: 100%;
  height: 180px;
  border: 2px dashed #ddd;
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  background: #fafafa;
  position: relative;
  overflow: hidden;
}

.upload-box:hover {
  border-color: #fb7299;
  background: #fff5f7;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
  gap: 8px;
}

.plus-icon { font-size: 32px; color: #ccc; }
.upload-box:hover .plus-icon { color: #fb7299; }

.preview-container { width: 100%; height: 100%; position: relative; }
.preview-img { width: 100%; height: 100%; object-fit: cover; }

.remove-img-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
}

.remove-img-btn:hover { background: #fb7299; transform: scale(1.1); }

.modal-actions { display: flex; gap: 15px; margin-top: 10px; }

.cancel-btn {
  flex: 1;
  padding: 12px;
  background: #f0f0f0;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: #666;
  font-weight: 600;
}

.cancel-btn:hover { background: #e0e0e0; }

.confirm-btn {
  flex: 2;
  padding: 12px;
  background: linear-gradient(135deg, #fb7299 0%, #ff92ae 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: bold;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(251, 114, 153, 0.4);
}

.confirm-btn:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
  color: #999;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>