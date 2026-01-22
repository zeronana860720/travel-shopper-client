  <template>
    <div class="commissions-page">
      <div class="header">
        <h2 class="title">委託清單</h2>
        <p class="count">目前共有 {{ commissionStore.commissions.length }} 件委託</p>
      </div>

      <div class="commission-grid">
        <div v-for="item in commissionStore.commissions"
             :key="item.commissionId"
             class="commission-card"
             @click="goToDetail(item.serviceCode)">
          <div class="card-image">
            <img :src="item.imageUrl ? `http://localhost:5275${item.imageUrl}` : 'https://bucket-image.inkmaginecms.com/version/hd/9dde7c0f-a597-445c-80dd-9a93db8a4006/image/2025/06/beaafaad-a543-4d37-ad1b-da0287de9589.jpg'"
                 alt="商品圖">
            <div class="status-tag">{{item.status}}</div>
          </div>

          <div class="card-body">
            <h3 class="item-name">{{ item.title }}</h3>
            <div class="info-row">
              <span class="label">預估原價:</span>
              <span class="value price">{{item?.currency}}$ {{ formatNumber(item.price) }}</span>
            </div>
            <div class="info-row">
              <span class="label">購買地點：</span>
              <span class="value">{{ item.location || '不限地點' }}</span>
            </div>
            <div class="info-row">
              <span class="label">截止日期：</span>
              <span class="value date">{{ formatDate(item.deadline) }}</span>
            </div>

            <button class="accept-btn" @click="goToDetail(item.serviceCode)">
              接取委託
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>

  <script setup lang="ts" name = 'commissionsView'>
  import { onMounted } from 'vue';
  import { useCommissionStore } from '@/stores/commission'; // 引入第二步建立的 Store
  import {useRouter} from "vue-router";

  const router = useRouter();

  // 初始化 Store
  const commissionStore = useCommissionStore();

  // 當頁面載入完成時，主動去抓取資料
  onMounted(async () => {
    await commissionStore.fetchCommissions(); // 執行第二步寫好的 Action
  });

  // 定義一個簡單的日期格式化工具
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-TW');
  };

  const acceptOrder = (id: number) => {
    alert(`接取委託 ID: ${id}`);
  };

  const goToDetail = (code: string) => {
    router.push(`/commissions/${code}`);
  }
  const formatNumber = (num:number) => {
    if (!num) return '0';
    return num.toLocaleString(); // 會把 1000 變成 1,000
  };
  </script>

  <style scoped>
  .commissions-page {
    max-width: 1200px;
    margin: 120px auto 40px;
    padding: 0 20px;
  }

  .header {
    margin-bottom: 30px;
    border-left: 6px solid #fb7299;
    padding-left: 15px;
  }

  .title {
    font-size: 26px;
    color: #333;
  }

  .count {
    color: #999;
    margin-top: 5px;
  }

  .commission-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 25px;
  }

  .commission-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    transition: transform 0.3s;
  }

  .commission-card:hover {
    transform: translateY(-5px);
  }

  .card-image {
    height: 200px;
    position: relative;
  }

  .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .status-tag {
    position: absolute;
    top: 10px;
    left: 10px;
    background: #fb7299;
    color: white;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
  }

  .card-body {
    padding: 20px;
  }

  .item-name {
    font-size: 18px;
    margin-bottom: 15px;
    color: #333;
    height: 50px; /* 統一高度 */
  }

  .info-row {
    display: flex;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .label {
    color: #999;
    width: 80px;
  }

  .value {
    color: #555;
  }

  .price {
    color: #fb7299;
    font-weight: bold;
  }

  .date {
    color: #ff4d4f;
  }

  .accept-btn {
    width: 100%;
    margin-top: 15px;
    background: #ffeef2;
    color: #fb7299;
    border: 1px solid #fb7299;
    padding: 10px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
  }

  .accept-btn:hover {
    background: #fb7299;
    color: white;
  }
  </style>