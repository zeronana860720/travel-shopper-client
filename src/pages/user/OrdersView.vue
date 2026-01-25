<template>
  <div class="orders-page">
    <div class="tab-switcher">
      <button
          v-for="tab in filterTabs"
          :key="tab.id"
          :class="['switch-btn', { active: filterStatus === tab.id }]"
          @click="filterStatus = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

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
          <div class="card-actions">
            <template v-if="order.status === '出貨中' || order.status === '已寄出'">
              <button
                  class="ship-btn"
                  :class="{ 'is-disabled': order.status === '已寄出' }"
                  :disabled="order.status === '已寄出'"
                  @click.stop="handleShip(order.serviceCode)"
              >
                {{ order.status === '已寄出' ? '已完成出貨' : '出貨完成' }}
              </button>
            </template>

            <button
                v-else
                class="upload-btn"
                @click.stop="handleUpload(order.serviceCode)"
            >
              上傳收據
            </button>

            <button
                class="detail-btn"
                @click.stop="handleViewDetail(order.serviceCode)"
            >
              查看詳情
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
    <div v-if="showShipModal" class="modal-overlay">
      <div class="modal-content">
        <h3>填寫出貨資訊 (｡•ㅅ•｡)♡</h3>

        <div class="input-group">
          <label>物流名稱 *</label>
          <input v-model="shipForm.LogisticsName" placeholder="例如：順豐、黑貓、7-11" />
        </div>

        <div class="input-group">
          <label>物流單號</label>
          <input v-model="shipForm.TrackingNumber" placeholder="請輸入追蹤編號" />
        </div>

        <div class="input-group">
          <label>備註 (選填)</label>
          <textarea v-model="shipForm.Remark" placeholder="有什麼想對買家說的嗎？"></textarea>
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="showShipModal = false">取消</button>
          <button class="confirm-btn" @click="submitShip">確認出貨</button>
        </div>
      </div>
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
// const currentMode = ref<'buyer' | 'seller'>('buyer');

// 設定目前篩選的狀態：'all' (全部), 'unshipped' (未出貨), 'shipped' (已出貨)
const filterStatus = ref<'all' | 'unshipped' | 'shipped'>('all');

// 定義篩選按鈕的選項
const filterTabs = [
  { id: 'all', label: '全部' },
  { id: 'unshipped', label: '未出貨' },
  { id: 'shipped', label: '已出貨' }
];

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

// ✨ 根據「已寄出」狀態來進行分類
const displayOrders = computed(() => {
  const allOrders = commissionStore.acceptedCommissions;

  return allOrders.filter(order => {
    // 1. 全部：不解釋，通通秀出來！
    if (filterStatus.value === 'all') return true;

    // 2. 已出貨：狀態必須完全等於「已寄出」
    if (filterStatus.value === 'shipped') {
      return order.status === '已寄出';
    }

    // 3. 未出貨：只要狀態不是「已寄出」，就屬於未出貨
    if (filterStatus.value === 'unshipped') {
      return order.status !== '已寄出';
    }

    return false;
  });
});

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

const showShipModal = ref(false);
const shipForm = ref({
  LogisticsName: '',
  TrackingNumber: '',
  Remark: ''
});

// 當點擊「出貨完成」按鈕時
const handleShip = (serviceCode: string) => {
  currentServiceCode.value = serviceCode; // 記住是哪一筆
  // 重置表單
  shipForm.value = { LogisticsName: '', TrackingNumber: '', Remark: '' };
  showShipModal.value = true; // 開啟彈窗
};

// 呼叫 Store 送出資料
const submitShip = async () => {
  if (!shipForm.value.LogisticsName) {
    alert('請填寫物流名稱唷！');
    return;
  }

  try {
    const result = await commissionStore.shipCommission(currentServiceCode.value, shipForm.value);
    if (result?.success) {
      alert(result.message);
      showShipModal.value = false; // 關閉彈窗
    }
  } catch (error: any) {
    alert(error.message || '出貨失敗 Q_Q');
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

/* --- 按鈕樣式：繼承妳喜歡的可愛粉紅風格 --- */
.switch-btn {
  border: none;
  padding: 8px 24px;         /* 增加左右內距，讓它胖胖的很可愛 */
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  background: transparent;
  transition: all 0.3s;
}

/* --- 啟動狀態：變回白色底、粉紅字 --- */
.switch-btn.active {
  background: white;
  color: #fb7299;            /* 妳專屬的粉紅色 */
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1); /* 增加一點點立體陰影 */
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
  gap: 8px;
}

/* ✨ 上傳收據：實心粉紅 (方角版本) */
.upload-btn {
  flex: 1;                /* 讓它跟其他按鈕平分空間 */
  background-color: #fb7299;
  color: white;
  border: 1px solid #fb7299;
  padding: 8px;           /* 統一高度 */
  border-radius: 6px;     /* ✨ 關鍵：統一圓角為 6px */
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.upload-btn:hover {
  background-color: #ff85ad;
  border-color: #ff85ad;
  /* 移除原本的圓角陰影，改用簡潔的過渡 */
  transform: translateY(-2px);
}

.upload-btn:active {
  transform: scale(0.98);
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
.tab-switcher {
  display: flex;
  background: #eee;          /* 淺灰色底色 */
  padding: 4px;
  border-radius: 25px;       /* 圓角弧度 */
  width: fit-content;        /* ✨ 關鍵：讓容器寬度隨按鈕內容縮放 */
  margin-bottom: 25px;
}
/* ✨ 出貨完成 / 完成訂單：實心粉紅 (方角) */
.ship-btn, .complete-action-btn {
  flex: 1;
  background-color: #fb7299;
  color: white;
  border: 1px solid #fb7299;
  padding: 8px;           /* 對齊妳原本的 delete-action-btn */
  border-radius: 6px;      /* ✨ 關鍵：改回 6px 方角 */
  font-size: 13px;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.ship-btn:hover, .complete-action-btn:not(.is-disabled):hover {
  background-color: #ff85ad;
  border-color: #ff85ad;
}

/* ✨ 查看詳情 / 查看收據：白底粉邊 (方角) */
.detail-btn, .view-receipt-btn {
  flex: 1;
  background-color: white;
  color: #fb7299;
  border: 1px solid #fb7299;
  padding: 8px;           /* 對齊妳原本的 delete-action-btn */
  border-radius: 6px;      /* ✨ 關鍵：改回 6px 方角 */
  font-size: 13px;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.detail-btn:hover, .view-receipt-btn:hover {
  background-color: #fff0f3;
}
/* --- 彈窗背景遮罩 --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* 半透明黑 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* 確保在最上層 */
}

/* --- 彈窗主體 --- */
.modal-content {
  background: white;
  padding: 25px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #222;
  text-align: center;
}

/* --- 輸入框群組 --- */
.input-group {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}

.input-group label {
  font-size: 13px;
  color: #666;
  margin-bottom: 5px;
}

.input-group input,
.input-group textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px; /* 統一 6px 方角 */
  font-size: 14px;
}

.input-group textarea {
  height: 80px;
  resize: none;
}

/* --- 彈窗按鈕區 --- */
.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.cancel-btn {
  flex: 1;
  padding: 10px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}

.confirm-btn {
  flex: 1;
  padding: 10px;
  background: #fb7299; /* 妳的主題粉紅 */
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}
/* ✨ 禁用狀態的樣式 (適用於出貨完成後) */
.ship-btn.is-disabled {
  background-color: #e7e7e7; /* 淺灰色底 */
  border-color: #d9d9d9;     /* 灰色的邊框 */
  color: #bfbfbf;            /* 文字變淡灰 */
  cursor: not-allowed;       /* 滑鼠移上去會顯示禁止符號 🚫 */

  /* 確保禁用時，原本的懸浮特效不會動 */
  transform: none !important;
  box-shadow: none !important;
}

/*上傳按鈕,備用*/
.upload-btn.is-disabled {
  background-color: #f5f5f5;
  color: #ccc;
  border-color: #eee;
  cursor: not-allowed;
}
</style>