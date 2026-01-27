<template>
  <div class="commissions-page">
    <aside class="filter-sidebar">
      <div class="filter-header">
        <span class="filter-title">進階篩選</span>
      </div>

      <div class="filter-group">
        <h4 class="group-title">關鍵字搜尋</h4>
        <div class="search-input-wrapper">
          <input type="text" v-model="searchKeyword" placeholder="搜尋標題、內容..." class="side-search-input">
        </div>
      </div>

      <div class="filter-group">
        <h4 class="group-title">排序方式</h4>
        <select v-model="currentSort" class="styled-select">
          <option value="">最新上架</option>
          <option value="price_asc">價格：低到高</option>
          <option value="price_desc">價格：高到低</option>
          <option value="deadline_asc">截止日：近到遠</option>
        </select>
      </div>

      <div class="filter-group">
        <h4 class="group-title">熱門地點</h4>
        <ul class="filter-list">
          <li v-for="loc in ['東京', '北海道', '京都', '大阪']" :key="loc" class="filter-item">
            <label class="checkbox-container">
              <input type="checkbox" :value="loc" v-model="filterLocations">
              <span class="checkmark"></span>
              {{ loc }}
            </label>
          </li>
        </ul>
      </div>

      <div class="filter-group">
        <h4 class="group-title">價格範圍</h4>
        <div class="price-range-inputs">
          <input type="number" v-model.number="minPrice" placeholder="最低" class="price-input">
          <span class="range-dash">-</span>
          <input type="number" v-model.number="maxPrice" placeholder="最高" class="price-input">
        </div>
      </div>

      <button class="apply-filter-btn" @click="handleFilterSearch">開始過濾</button>
      <button class="reset-btn" @click="resetFilters">清空條件</button>
    </aside>

    <div class="main-list">
      <div class="header">
        <h2 class="title">委託清單</h2>
        <p class="count">共 {{ commissionStore.commissions.length }} 件</p>
      </div>

      <div class="commission-grid">
        <div v-for="item in commissionStore.commissions"
             :key="item.commissionId"
             class="commission-card"
             @click="goToDetail(item.serviceCode)">
          <div class="card-image">
            <img :src="item.imageUrl ? `http://localhost:5275${item.imageUrl}` : 'https://i.imgur.com/6VBx3io.png'"
                 alt="商品圖">
            <div class="status-tag">{{item.status}}</div>
          </div>

          <div class="card-body">
            <h3 class="item-name">{{ item.title }}</h3>
            <div class="info-row">
              <span class="value price">{{item?.currency}}$ {{ formatNumber(item.price) }}</span>
            </div>
            <div class="info-row">
              <span class="value">{{ item.location || '不限地點' }}</span>
            </div>
            <div class="info-row">
              <span class="value date">截止：{{ formatDate(item.deadline) }}</span>
            </div>
            <button class="accept-btn">接取委託</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

  <script setup lang="ts" name = 'commissionsView'>
  import {onMounted, watch} from 'vue';
  import { useCommissionStore } from '@/stores/commission'; // 引入第二步建立的 Store
  import {useRouter} from "vue-router";
  import {useRoute} from "vue-router";
  import {ref} from "vue";

  const router = useRouter();
  const route = useRoute();

  // 初始化 Store
  const commissionStore = useCommissionStore();

  // 當頁面載入完成時，主動去抓取資料
  onMounted(async () => {
    // 2. 從網址取得 keyword，傳給 Store 的 fetch 函數
    const keyword = (route.query.keyword as string) || '';
    await commissionStore.fetchCommissions(keyword);
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

  // 監聽網址參數的變化
  watch(() => route.query.keyword, (newKeyword) => {
    // 只要關鍵字一變，就立刻重新抓取資料
    commissionStore.fetchCommissions(newKeyword as string || '');
  });

  // 把原本的 filterLocation = ref('') 改成陣列
  const filterLocations = ref<string[]>([]);

  // 在 resetFilters 也要記得清空陣列喔
  const resetFilters = () => {
    searchKeyword.value = '';
    currentSort.value = '';
    filterLocations.value = []; // 清空陣列
    minPrice.value = null;
    maxPrice.value = null;
    handleFilterSearch();
  };
  </script>

<style scoped>
/* --- 1. 頁面整體佈局 --- */
.commissions-page {
  /* 增加寬度以容納側邊欄與四格卡片 */
  max-width: 95%;
  margin: 120px auto 40px;
  padding: 0 10px;
  /* 使用 flex 讓側邊欄與主內容並排 */
  display: flex;
  gap: 30px;

  //min-height: 200vh;
}

/* --- 2. 側邊篩選欄 (蝦皮風格) --- */
.filter-sidebar {
  width: 260px;
  flex-shrink: 0;
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

  /* ✨ 核心修改：固定在頁面上 */
  position: sticky;
  top: 120px;       /* 100px(Navbar) + 20px(預留間距) */

  /* ✨ 增加安全性：防止篩選欄太長超出螢幕 */
  max-height: calc(100vh - 140px);
  overflow-y: auto; /* 如果內容太多會出現內部捲軸 */

  align-self: flex-start; /* 確保 flex 佈局下它不會被拉長 */
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 25px;
  color: #333;
}

.filter-group {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.group-title {
  font-size: 16px;
  margin-bottom: 15px;
  color: #222;
  font-weight: 600;
}

/* 清單與勾選框 */
.filter-list {
  list-style: none;
  padding: 0;
}

.filter-item {
  margin-bottom: 10px;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: 0.2s;
}

.checkbox-container input {
  margin-right: 10px;
}

.checkbox-container:hover {
  color: #fb7299;
}

/* 價格輸入區 */
.price-range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}

.price-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.price-input:focus {
  border-color: #fb7299;
}

.apply-filter-btn {
  width: 100%;
  padding: 10px;
  background-color: #fb7299;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.3s;
}

.apply-filter-btn:hover {
  background-color: #ff85a2;
}

.reset-btn {
  width: 100%;
  background: transparent;
  border: none;
  color: #999;
  font-size: 13px;
  cursor: pointer;
  margin-top: 10px;
}

/* --- 3. 右側主內容區 --- */
.main-list {
  flex: 1;
}

.header {
  margin-bottom: 30px;
  border-left: 6px solid #fb7299;
  padding-left: 15px;
  display: flex;
  flex-direction: column; /* 讓標題跟數量垂直排列 */
  align-items: flex-start;
}

.title {
  font-size: 26px;
  color: #333;
}

.count {
  color: #999;
  margin-top: 5px;
}

/* --- 4. 一排四個的 Grid --- */
.commission-grid {
  display: grid;
  /* 強制固定為四欄 */
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.commission-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  transition: transform 0.3s;
  cursor: pointer;
}

.commission-card:hover {
  transform: translateY(-5px);
}

.card-image {
  height: 160px; /* 縮小一點高度以符合四格佈局 */
  position: relative;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #fb7299;
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.card-body {
  padding: 15px;
}

.item-name {
  font-size: 16px;
  margin-bottom: 10px;
  color: #333;
  height: 44px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
  color: #666;
}

.price {
  color: #fb7299;
  font-weight: bold;
  font-size: 16px;
}

.accept-btn {
  width: 100%;
  margin-top: 10px;
  background: #ffeef2;
  color: #fb7299;
  border: 1px solid #fb7299;
  padding: 8px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.accept-btn:hover {
  background: #fb7299;
  color: white;
}

.side-search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background-color: #f9f9f9;
}

.side-search-input:focus {
  border-color: #fb7299;
  background-color: white;
}
/* 修改：下拉選單樣式 */
.styled-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  color: #444;
  outline: none;
  cursor: pointer;
}

.search-input-wrapper {
  width: 100%;
  display: flex;
  justify-content: center; /* 水平置中 */
  padding: 2px; /* 給一點點呼吸空間 */
}

.side-search-input {
  width: 100%; /* 確保填滿容器 */
  /* 其他樣式維持妳原本的 ... */
}

/* 讓 checkbox 看起來更精緻 */
.checkbox-container {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.checkbox-container input {
  cursor: pointer;
  accent-color: #fb7299; /* 讓打勾勾變成妳最愛的粉紅色！ */
}
</style>