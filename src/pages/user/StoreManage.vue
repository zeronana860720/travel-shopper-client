<template>
  <div class="store-manage-page">
    <!-- 賣場資訊卡片 -->
    <div class="store-info-card">
      <!-- 左側:圖片+名稱 -->
      <button class="edit-store-btn" @click="openEditModal">
        <span class="edit-icon"></span>
        編輯賣場資訊
      </button>
      <div class="store-left">
        <div class="store-image-box">
          <img
              :src="getStoreImageUrl(currentStore?.storeImage)"
              :alt="currentStore?.storeName"
              class="store-cover"
          >
        </div>
        <div class="store-basic">
          <h2 class="store-name">{{ currentStore?.storeName }}</h2>
          <div class="store-meta">
            <span class="status-badge" :class="getStatusClass(currentStore?.status)">
              {{ getStatusLabel(currentStore?.status) }}
            </span>
            <span class="created-date">建立於 {{ formatDate(currentStore?.createdAt) }}</span>
            <!-- ✨ 新增:草稿狀態才顯示送審按鈕 -->
            <button
                v-if="currentStore?.status === 0"
                class="submit-review-btn"
                @click="handleSubmitReview"
            >
              送出審核
            </button>
          </div>
        </div>
      </div>

      <!-- 右側:描述 -->
      <div class="store-right">
        <h3 class="section-title">賣場介紹</h3>
        <p class="store-description" v-if="currentStore?.storeDescription">
          {{ currentStore.storeDescription }}
        </p>
        <p class="store-description placeholder" v-else>
          這間店主很神祕,還沒寫下任何介紹唷 (๑• . •๑)
        </p>
      </div>
    </div>

    <!-- 商品列表區 -->
    <div class="products-section">
      <div class="section-header">
        <div class="header-left">
          <h3 class="products-title">商品列表</h3>
          <span class="products-count">共 {{ products.length }} 件商品</span>
        </div>
        <button class="add-product-btn" @click="openAddProductModal">
          <span class="plus-icon">+</span>
          新增商品
        </button>
      </div>

      <!-- 商品網格 (4格) -->
      <div class="products-grid">
        <div
            v-for="product in products"
            :key="product.productId"
            class="product-card"
            @click="handleProductClick(product.productId)"
        >
          <div class="product-image">
            <img
                :src="product.imageUrl || defaultProductImage"
                :alt="product.productName"
            >
            <span class="product-status-tag" :class="getProductStatusClass(product.status)">
              {{ getProductStatusLabel(product.status) }}
            </span>
          </div>

          <div class="product-body">
            <h4 class="product-name">{{ product.productName }}</h4>
            <div class="product-info-row">
              <span class="product-price">NT$ {{ formatNumber(product.price) }}</span>
            </div>
            <div class="product-info-row">
              <span class="product-stock">庫存：{{ product.stock }}</span>
            </div>
            <button class="edit-product-btn" @click.stop="handleEditProduct(product.productId)">
              編輯商品
            </button>
          </div>
        </div>
      </div>

      <!-- 空狀態 -->
      <div v-if="products.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <p class="empty-text">還沒有商品唷~快來新增第一個商品吧! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧</p>
      </div>
    </div>

    <!-- 新增商品彈窗 (預留) -->
    <div v-if="showAddProductModal" class="modal-overlay" @click.self="showAddProductModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>新增商品</h3>
          <button class="close-icon" @click="showAddProductModal = false">✕</button>
        </div>
        <p style="text-align: center; color: #999; padding: 40px;">
          商品表單開發中... (๑•̀ㅂ•́)و✧
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStoreStore } from '@/stores/store';

const route = useRoute();
const router = useRouter();
const store = useStoreStore();

// --- 狀態定義 ---
const storeId = computed(() => Number(route.params.storeId));
// 透過路由參數去抓到storeId
// path: '/store/:storeId/manage',
// :storeId -> 動態參數
const currentStore = ref<any>(null);
const products = ref<any[]>([]);
const showAddProductModal = ref(false);

// ✨ 新增:編輯賣場用的狀態
const showEditModal = ref(false);
const storeImageFileRef = ref<HTMLInputElement | null>(null);
const imagePreview = ref<string | null>(null);

const editStoreForm = ref({
  storeDescription: '',
  storeImage: null as File | null
});


const defaultImage = 'https://i.pinimg.com/1200x/f7/d1/36/f7d136d44bbad6846e1385711a6a634b.jpg';
const defaultProductImage = 'https://i.imgur.com/6VBx3io.png';

// --- 生命週期 ---
onMounted(async () => {
  await loadStoreData();
  await loadProducts();
});

// --- 資料載入 ---
const loadStoreData = async () => {
  // 先從 store 裡找
  await store.fetchMyStores();
  currentStore.value = store.stores.find(s => s.storeId === storeId.value);

  if (!currentStore.value) {
    alert('找不到此賣場!');
    router.push('/shop');
  }
};

const loadProducts = async () => {
  // TODO: 之後改成呼叫商品 API
  // 現在先用假資料示範
  products.value = [
    {
      productId: 1,
      productName: '日本零食福袋',
      price: 599,
      stock: 15,
      status: 1, // 1:上架中, 0:下架
      imageUrl: 'https://i.imgur.com/6VBx3io.png'
    },
    {
      productId: 2,
      productName: '東京限定草莓巧克力',
      price: 299,
      stock: 0,
      status: 0,
      imageUrl: 'https://i.imgur.com/6VBx3io.png'
    }
  ];
};

// --- 輔助函式 ---
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

const formatNumber = (num: number) => {
  if (!num) return '0';
  return num.toLocaleString();
};

const getStatusLabel = (status: number | undefined) => {
  switch (status) {
    case 0: return '草稿';
    case 1: return '審核中';
    case 2: return '發布失敗';
    case 3: return '已發布';
    default: return '未知';
  }
};

const getStatusClass = (status: number | undefined) => {
  switch (status) {
    case 3: return 'published';
    case 1: return 'pending';
    case 2: return 'failed';
    case 0: return 'draft';
    default: return 'pending';
  }
};

const getProductStatusLabel = (status: number) => {
  return status === 1 ? '上架中' : '已下架';
};

const getProductStatusClass = (status: number) => {
  return status === 1 ? 'on-sale' : 'off-sale';
};

// --- 操作函式 ---
const openAddProductModal = () => {
  showAddProductModal.value = true;
};

const handleProductClick = (productId: number) => {
  console.log('點擊商品:', productId);
};

const handleEditProduct = (productId: number) => {
  console.log('編輯商品:', productId);
};
// ✨ 新增:處理送出審核
const handleSubmitReview = async () => {
  // 1️⃣ 先確認一下
  const confirmed = confirm('確定要送出審核嗎?\n送出後將無法編輯,需等待管理員審核唷 (๑•̀ㅂ•́)و✧');

  if (!confirmed) return;

  try {
    // 2️⃣ 呼叫 Pinia store 的方法
    await store.submitStoreForReview(storeId.value);

    // 3️⃣ 成功後提示 + 重新載入資料
    alert('送出審核成功!請等待管理員審核唷~ ♪(๑ᴖ◡ᴖ๑)♪');
    await loadStoreData(); // 重新載入賣場資料,更新狀態

  } catch (error: any) {
    // 4️⃣ 失敗時顯示錯誤訊息
    alert(error.message || '送出審核失敗 (｡•́︿•̀｡)');
  }
};

</script>

<style scoped>
.store-manage-page {
  max-width: 95%;
  margin: 120px auto 40px;
  padding: 0 20px;
  font-family: 'PingFang TC', 'Microsoft JhengHei', sans-serif;
}

/* --- 賣場資訊卡片 --- */
.store-info-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  display: flex;
  gap: 40px;
  position: relative;
}

/* 左側:圖片+名稱 */
.store-left {
  display: flex;
  gap: 20px;
  align-items: center;
  min-width: 400px;
}

.store-image-box {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.store-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.store-basic {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.store-name {
  font-size: 24px;
  color: #333;
  margin: 0;
  font-weight: bold;
}

.store-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.status-badge.published { background: #fb7299; }
.status-badge.pending { background: #ffb11b; }
.status-badge.failed { background: #9499a0; }
.status-badge.draft { background: #00aeec; }

.created-date {
  font-size: 14px;
  color: #999;
}

/* 右側:描述 */
.store-right {
  flex: 1;
  padding: 10px 0;
}

.section-title {
  font-size: 16px;
  color: #666;
  margin-bottom: 12px;
  font-weight: 600;
}

.store-description {
  font-size: 15px;
  line-height: 1.8;
  color: #555;
  margin: 0;
}

.store-description.placeholder {
  color: #bbb;
  font-style: italic;
}

/* --- 商品列表區 --- */
.products-section {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.products-title {
  font-size: 20px;
  color: #333;
  margin: 0;
  font-weight: bold;
}

.products-count {
  font-size: 14px;
  color: #999;
  background: #f5f5f5;
  padding: 4px 12px;
  border-radius: 20px;
}

.add-product-btn {
  background: linear-gradient(135deg, #fb7299 0%, #ff92ae 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 15px rgba(251, 114, 153, 0.3);
}

.add-product-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(251, 114, 153, 0.4);
}

.plus-icon {
  font-size: 18px;
  font-weight: bold;
}

/* --- 商品網格 (4格) --- */
.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  border-color: #ffdae3;
}

.product-image {
  height: 180px;
  position: relative;
  background: #f8f8f8;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-status-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: bold;
  color: white;
}

.product-status-tag.on-sale { background: #fb7299; }
.product-status-tag.off-sale { background: #9499a0; }

.product-body {
  padding: 15px;
}

.product-name {
  font-size: 15px;
  color: #333;
  margin: 0 0 10px 0;
  height: 40px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-weight: 600;
}

.product-info-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  font-size: 14px;
}

.product-price {
  color: #fb7299;
  font-weight: bold;
  font-size: 17px;
}

.product-stock {
  color: #666;
  font-size: 13px;
}

.edit-product-btn {
  width: 100%;
  margin-top: 10px;
  background: #fff5f7;
  color: #fb7299;
  border: 1px solid #ffdae3;
  padding: 8px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.edit-product-btn:hover {
  background: #fb7299;
  color: white;
}

/* --- 空狀態 --- */
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: #bbb;
}

/* --- 彈窗 --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
  max-width: 500px;
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

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* --- 響應式 (選配) --- */
@media (max-width: 1400px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .store-info-card {
    flex-direction: column;
  }

  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
.edit-store-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: #fff5f7;
  color: #fb7299;
  border: 1px solid #ffdae3;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.edit-store-btn:hover {
  background: #fb7299;
  color: white;
}

.edit-icon {
  font-size: 16px;
}
.submit-review-btn {
  background: linear-gradient(135deg, #00aeec 0%, #5bc0de 100%);
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(0, 174, 236, 0.3);
}

.submit-review-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 174, 236, 0.5);
}


</style>
