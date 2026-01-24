<template>
  <div class="orders-page">
<!--    <div class="mode-switcher">-->
<!--      <button-->
<!--          :class="['switch-btn', { active: currentMode === 'buyer' }]"-->
<!--          @click="currentMode = 'buyer'"-->
<!--      >-->
<!--        我是買家-->
<!--      </button>-->
<!--      <button-->
<!--          :class="['switch-btn', { active: currentMode === 'seller' }]"-->
<!--          @click="currentMode = 'seller'"-->
<!--      >-->
<!--        我是賣家-->
<!--      </button>-->
<!--    </div>-->

    <div class="orders-grid">
      <div
          v-for="order in displayOrders"
          :key="order.id"
          class="simple-card"
      >
        <div class="card-img-box">
          <img
              :src="order.imageUrl
              ? `http://localhost:5275${order.imageUrl}`
              : 'https://i.pinimg.com/1200x/f7/d1/36/f7d136d44bbad6846e1385711a6a634b.jpg'"
              :alt="order.title"
              class="product-img"
          >
<!--          <span class="img-tag">{{ currentMode === 'buyer' ? '已下單' : '待發貨' }}</span>-->
          <span class="img-tag">{{order.status}}</span>
        </div>

        <div class="card-info">
          <h3 class="product-name">{{ order.title }}</h3>

          <div class="order-footer">
            <div class="price-details">
              <p class="product-price">總價：{{order.currency}}$ {{ order.totalAmount }}</p>
              <p class="income-text">預期收入：NT$ {{order.platformFee}}</p>
            </div>

            <span class="product-quantity">數量：{{ order.quantity }}</span>
          </div>
          <div class="card-actions" v-if="order.canUpdateReceipt">
            <button class="upload-btn" @click.stop="handleUpload(order.serviceCode)">
              上傳收據
            </button>
          </div>
        </div>
      </div>
      <input
          type="file"
          ref="fileInput"
          style="display: none"
          accept="image/*"
          @change="onFileSelected"
      >
    </div>

    <div v-if="displayOrders.length === 0" class="empty-box">
      目前沒有相關訂單紀錄
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'; // ✨ 記得引入 onMounted
import { useRouter } from 'vue-router';
import{useCommissionStore} from "@/stores/commission";
import axios from "axios";

const commissionStore = useCommissionStore();
const fileInput = ref<HTMLInputElement | null>(null);
const currentServiceCode = ref(''); // 用來記錄現在是哪一筆訂單要上傳

// 切換模式：'buyer' 或 'seller'
const currentMode = ref<'buyer' | 'seller'>('buyer');

// 建立一個響應式的陣列，用來存放從後端 API 取得的委託清單
const acceptOrders = ref<AcceptCommission[]>([]);

// 定義資料結構
interface AcceptCommission{
  serviceCode: string;
  title: string;
  status: string;
  quantity: number;
  price: number;
  totalAmount: number;
  platformFee: number;
  createdAt: string;
  imageUrl: string | null;
  canUpdateReceipt: boolean;
  canUpdateShip: boolean;
  canViewReceipt: boolean;
  canViewShipping: boolean;
}

// // 模擬訂單資料
// const ordersData = ref({
//   buyer: [
//     { id: 101, name: '吉伊卡哇悠遊卡', price: 450, quantity:4, image: 'https://bucket-image.inkmaginecms.com/version/hd/9dde7c0f-a597-445c-80dd-9a93db8a4006/image/2025/06/beaafaad-a543-4d37-ad1b-da0287de9589.jpg' },
//     { id: 102, name: 'NY Cheese', price: 480, quantity: 4, image: 'https://edge.dis.commercecloud.salesforce.com/dw/image/v2/BKBN_PRD/on/demandware.static/-/Sites-catalog_master_sfcc_krs/default/dw4270ba44/images/large/2123600171_1_b.jpg' },
//   ],
//   seller: [
//     { id: 201, name: '【賣場】客製化頭像繪製', price: 800, quantity: 1, image: '/everett.png' },
//   ]
// });

// ✨ 簡化後的計算屬性：直接指向 Pinia 的資料
const displayOrders = computed(() => commissionStore.acceptedCommissions);

onMounted(() => {
  commissionStore.fetchMyAcceptCommissions()
})

const handleUpload = (serviceCode: string) => {
  currentServiceCode.value = serviceCode; // 記住這筆訂單號碼
  fileInput.value?.click(); // 模擬點擊隱藏的 input
};

const onFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  // 1. 準備快遞箱 (FormData)
  const formData = new FormData();
  formData.append('Image', file); // ✨ 名稱必須對齊妳後端的 [FromForm] UploadReceiptDto 裡的 Image

  // 如果妳的 DTO 有其他必填欄位，例如 ReceiptAmount，也可以先塞個預設值
  formData.append('ReceiptAmount', '');
  formData.append('Remark', '手機端上傳收據');

  try {
    const token = localStorage.getItem('token');
    // 2. 寄出快遞
    const response = await axios.post(
        `http://127.0.0.1:5275/Commission/${currentServiceCode.value}/receipt`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
    );

    if (response.data.success) {
      alert(response.data.message || '收據上傳成功囉！✨');
      // 3. 成功後重新整理清單，讓「上傳按鈕」根據新狀態自動消失或更新
      commissionStore.fetchMyAcceptCommissions();
    }
  } catch (error: any) {
    console.error('上傳失敗 Q_Q：', error);
    alert('上傳失敗：' + (error.response?.data?.message || '伺服器開小差了'));
  } finally {
    // 清空輸入框，這樣選同一個檔案也能再次觸發上傳喔！
    target.value = '';
  }
};
</script>

<style scoped>
.orders-page {
  padding: 10px;
}

/* --- 模式切換按鈕 --- */
.mode-switcher {
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

/* --- 網格佈局 (繼承你的 hot-grid) --- */
.orders-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* --- 卡片樣式 (繼承你的 simple-card) --- */
.simple-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #eee;
  cursor: pointer;
}

.simple-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.08);
  border-color: #fb7299;
}

.card-img-box {
  position: relative;
  height: 160px; /* 稍微縮小一點 */
  background-color: #f8f8f8;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-tag {
  position: absolute;
  top: 10px;    /* 稍微往內移一點，避免太大顯得擁擠 */
  right: 10px;
  background-color: rgba(251, 114, 153, 0.95); /* 提高不透明度，顏色更實心 */
  color: white;

  /* ✨ 核心調整：加大字體與內距 */
  font-size: 14px;        /* 原本是 11px */
  font-weight: bold;      /* 加粗字體 */
  padding: 5px 14px;      /* 增加上下左右的空間感 */

  /* ✨ 造型美化 */
  border-radius: 20px;    /* 改成膠囊型圓角，視覺上更精緻 */
  box-shadow: 0 2px 6px rgba(251, 114, 153, 0.3); /* 增加一點粉色陰影，讓它浮出來 */

  z-index: 1;             /* 確保標籤在圖片最上方 */
  letter-spacing: 0.5px;  /* 增加一點字距增加可讀性 */
}

.card-info {
  padding: 12px;
}

.product-name {
  font-size: 15px;
  color: #333;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 1; /* 縮小到一行，讓版面更整齊 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 20px;
}

/* 金額與數量的容器 */
.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  color: #fb7299;
  font-size: 16px;
  font-weight: bold;
  margin: 0;
}

.product-quantity {
  color: #999;
  font-size: 16px;
}

.empty-box {
  padding: 100px 0;
  text-align: center;
  color: #bbb;
}
/* ✨ 按鈕容器：讓按鈕靠右對齊 */
.card-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

/* ✨ 上傳按鈕主樣式 */
.upload-btn {
  background-color: #fb7299; /* 妳的主題粉紅色 */
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 20px; /* 圓角膠囊造型 */
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(251, 114, 153, 0.2);
}

/* ✨ 滑鼠移上去的效果：稍微變亮並浮起來 */
.upload-btn:hover {
  background-color: #ff85ad;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 114, 153, 0.4);
}

/* ✨ 點擊時的縮放回饋 */
.upload-btn:active {
  transform: scale(0.95);
}
/* ✨ 讓價格和收入垂直排列 */
.price-group {
  display: flex;
  flex-direction: column;
  gap: 2px; /* 兩行文字之間的小間隔 */
}

/* ✨ 總價的樣式 (稍微調整 margin) */
.product-price {
  color: #fb7299;
  font-size: 16px;
  font-weight: bold;
  margin: 0;
}

/* ✨ 預期收入：用溫暖的橘金色強調賺錢的感覺 */
.income-text {
  font-size: 13px;
  color: #ff9800;
  font-weight: 500;
  margin: 0;
}
.price-details {
  display: flex;
  flex-direction: column; /* 強制垂直排列 */
  gap: 2px;               /* 讓兩行字之間有一點點呼吸的空間 */
}
</style>