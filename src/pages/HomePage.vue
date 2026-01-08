<template>
  <div class="home-page">
    <!-- 🌟 Hero Banner - 熱門商品&促銷輪播 -->
    <section class="hero-banner-section">
      <div class="banner-container">
        <!-- 主輪播區 -->
        <div class="banner-slider">
          <div class="banner-track" :style="{ transform: `translateX(-${currentBannerIndex * 100}%)` }">
            <div
                v-for="(banner, index) in banners"
                :key="index"
                class="banner-slide"
            >
              <div class="banner-content">
                <div class="banner-text">
                  <h1 class="banner-title">{{ banner.title }}</h1>
                  <p class="banner-subtitle">{{ banner.subtitle }}</p>
                  <button class="banner-btn">{{ banner.buttonText }}</button>
                </div>
                <div class="banner-image">
                  <img :src="banner.image" :alt="banner.title">
                </div>
              </div>
            </div>
          </div>

          <!-- 輪播控制點 -->
          <div class="banner-dots">
            <button
                v-for="(_, index) in banners"
                :key="index"
                class="dot"
                :class="{ active: index === currentBannerIndex }"
                @click="currentBannerIndex = index"
            />
          </div>

          <!-- 前後按鈕 -->
          <button class="banner-arrow left" @click="prevBanner">‹</button>
          <button class="banner-arrow right" @click="nextBanner">›</button>
        </div>
      </div>
    </section>

    <!-- 📍 熱門地區區域 -->
    <section class="regions-section">
      <div class="section-wrapper">
        <div class="section-header">
          <h2 class="section-title">熱門地區</h2>
          <span class="subtitle-text">選擇地區,探索當地熱門商品</span>
        </div>

        <div class="regions-grid">
          <button
              v-for="region in popularRegions"
              :key="region.id"
              class="region-btn"
              @click="searchByRegion(region.name)"
          >
            <span class="region-icon">📍</span>
            <span class="region-name">{{ region.name }}</span>
            <span class="region-count">{{ region.count }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- 🛍️ 商品列表區域 -->
    <section class="products-list-section">
      <div class="section-wrapper">
        <div class="section-header">
          <h2 class="section-title">精選商品</h2>
          <span class="subtitle-text">熱銷中的優質商品</span>
        </div>

        <!-- 商品網格 -->
        <div class="products-grid">
          <div
              v-for="item in productStore.products.slice(0, 12)"
              :key="item.id"
              class="product-card"
              @click="goToDetail(item.id)"
          >
            <div class="card-img-box">
              <img :src="item.image" :alt="item.name" class="product-img">
              <span class="img-tag">JP</span>
              <div class="hot-badge">熱銷中</div>
            </div>

            <div class="card-info">
              <h3 class="product-name">{{ item.name }}</h3>
              <div class="price-section">
                <span class="product-price">NT$ {{ item.price }}</span>
              </div>
              <div class="rating-section">
                <span class="stars">⭐⭐⭐⭐⭐</span>
                <span class="rating-count">{{ Math.floor(Math.random() * 200) + 50 }}+ 已購</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 查看全部按鈕 -->
        <div class="view-all-container">
          <router-link to="/products" class="view-all-btn">
            查看全部商品 →
          </router-link>
        </div>
      </div>
    </section>

    <!-- 📂 分類按鈕區域 -->
    <section class="categories-section">
      <div class="section-wrapper">
        <div class="section-header">
          <h2 class="section-title">商品分類</h2>
          <span class="subtitle-text">快速找到你想要的商品</span>
        </div>

        <div class="categories-grid">
          <button
              v-for="category in productCategories"
              :key="category.id"
              class="category-btn"
              @click="filterByCategory(category.name)"
          >
            <span class="category-icon">{{ category.icon }}</span>
            <span class="category-name">{{ category.name }}</span>
            <span class="category-count">{{ category.count }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- 💡 特色區域 -->
    <section class="features-section">
      <div class="section-wrapper">
        <div class="features-grid">
          <div class="feature-card">
            <span class="feature-icon">🚚</span>
            <h3>快速配送</h3>
            <p>7-14 天送達台灣</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">💯</span>
            <h3>正品保證</h3>
            <p>100% 日本原裝進口</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">🛡️</span>
            <h3>安全交易</h3>
            <p>買家賣家雙重保護</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useProductStore } from '@/stores/product'
import { useRouter } from 'vue-router'

const productStore = useProductStore()
const router = useRouter()

// Hero Banner 輪播
const currentBannerIndex = ref(0)
const banners = [
  {
    title: '🔥 新用戶首購優惠',
    subtitle: '日本代購商品享 9 折優惠',
    buttonText: '立即購買',
    image: 'https://via.placeholder.com/400x250/ff6b6b/ffffff?text=New+User'
  },
  {
    title: '⭐ 本週精選',
    subtitle: '東京熱銷商品推薦',
    buttonText: '查看精選',
    image: 'https://via.placeholder.com/400x250/fb7299/ffffff?text=Featured'
  },
  {
    title: '🎁 限時活動',
    subtitle: '滿 1000 元送 100 元折扣券',
    buttonText: '領取優惠',
    image: 'https://via.placeholder.com/400x250/ff92ae/ffffff?text=Limited+Time'
  }
]

const nextBanner = () => {
  currentBannerIndex.value = (currentBannerIndex.value + 1) % banners.length
}

const prevBanner = () => {
  currentBannerIndex.value = (currentBannerIndex.value - 1 + banners.length) % banners.length
}

// 自動輪播
setInterval(() => {
  nextBanner()
}, 5000)

// 熱門地區
const popularRegions = [
  { id: 1, name: '東京', count: 234 },
  { id: 2, name: '大阪', count: 189 },
  { id: 3, name: '京都', count: 156 },
  { id: 4, name: '澀谷', count: 203 },
  { id: 5, name: '新宿', count: 198 },
  { id: 6, name: '橫濱', count: 142 }
]

// 商品分類
const productCategories = [
  { id: 1, name: '周邊', icon: '🎮', count: 245 },
  { id: 2, name: '伴手禮', icon: '🍰', count: 189 },
  { id: 3, name: '美妝', icon: '💄', count: 312 },
  { id: 4, name: '服飾', icon: '👕', count: 267 },
  { id: 5, name: '電子產品', icon: '📱', count: 156 },
  { id: 6, name: '食品', icon: '🍫', count: 198 }
]

// 按地區搜尋
const searchByRegion = (regionName: string) => {
  router.push({
    path: '/products',
    query: { region: regionName }
  })
}

// 按分類篩選
const filterByCategory = (categoryName: string) => {
  router.push({
    path: '/products',
    query: { category: categoryName }
  })
}

// 進入商品詳情
const goToDetail = (id: number) => {
  router.push(`/product/${id}`)
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.home-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 🌟 Hero Banner 區域 */
.hero-banner-section {
  width: 100%;
  background: white;
  padding: 20px 0;
}

.banner-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.banner-slider {
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.banner-track {
  display: flex;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
}

.banner-slide {
  min-width: 100%;
  display: flex;
  height: 100%;
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 40px;
  background: linear-gradient(135deg, #ff6b6b 0%, #fb7299 100%);
  color: white;
}

.banner-text {
  flex: 1;
  max-width: 500px;
}

.banner-title {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.banner-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20px;
  line-height: 1.5;
}

.banner-btn {
  background: white;
  color: #fb7299;
  padding: 12px 32px;
  border: none;
  border-radius: 25px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.banner-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.banner-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.banner-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 輪播控制 */
.banner-dots {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s;
}

.dot.active {
  background: white;
  width: 24px;
  border-radius: 5px;
}

.banner-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
  color: white;
  border: none;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.banner-arrow:hover {
  background: rgba(255, 255, 255, 0.5);
}

.banner-arrow.left {
  left: 15px;
}

.banner-arrow.right {
  right: 15px;
}

/* 📍 熱門地區區域 */
.regions-section {
  padding: 40px 20px;
  background-color: white;
  border-bottom: 8px solid #f5f5f5;
}

.section-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 10px;
}

.section-title {
  color: #333;
  font-size: 24px;
  font-weight: 800;
  border-left: 5px solid #fb7299;
  padding-left: 15px;
}

.subtitle-text {
  color: #999;
  font-size: 13px;
}

.regions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.region-btn {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
}

  .region-btn:hover {
    border-color: #fb7299;
    background-color: #fff5f7;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(251, 114, 153, 0.12);
  }

  .region-icon {
    font-size: 24px;
  }

  .region-name {
    color: #333;
    font-weight: 700;
    font-size: 14px;
  }

  .region-count {
    color: #fb7299;
    font-size: 11px;
    font-weight: bold;
  }

  /* 🛍️ 商品列表區域 */
  .products-list-section {
    padding: 50px 20px;
    background-color: #f5f5f5;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 40px;
  }

  /* 商品卡片 */
  .product-card {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
    cursor: pointer;
    border: 1px solid #e8e8e8;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
    border-color: #fb7299;
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
    display: block;
    transition: transform 0.3s ease;
  }

  .product-card:hover .product-img {
    transform: scale(1.05);
  }

  .img-tag {
    position: absolute;
    top: 6px;
    right: 6px;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 2px 5px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: bold;
  }

  .hot-badge {
    position: absolute;
    top: 6px;
    left: 6px;
    background: linear-gradient(90deg, #ff6b6b 0%, #fb7299 100%);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 800;
    box-shadow: 0 2px 4px rgba(251, 114, 153, 0.4);
  }

  .card-info {
    padding: 12px;
  }

  .product-name {
    font-size: 14px;
    color: #333;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 36px;
    line-height: 1.4;
  }

  .price-section {
    margin-bottom: 8px;
  }

  .product-price {
    color: #ff6b6b;
    font-size: 16px;
    font-weight: 800;
  }

  .rating-section {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
  }

  .stars {
    color: #ffc41d;
    letter-spacing: 1px;
  }

  .rating-count {
    color: #999;
  }

  /* 查看全部按鈕 */
  .view-all-container {
    display: flex;
    justify-content: center;
    margin-top: 30px;
  }

  .view-all-btn {
    background: linear-gradient(135deg, #ff6b6b 0%, #fb7299 100%);
    color: white;
    padding: 14px 40px;
    border-radius: 25px;
    text-decoration: none;
    font-size: 16px;
    font-weight: 700;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(251, 114, 153, 0.3);
    display: inline-block;
  }

  .view-all-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(251, 114, 153, 0.4);
  }

  /* 📂 分類按鈕區域 */
  .categories-section {
    padding: 50px 20px;
    background-color: white;
  }

  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }

  .category-btn {
    background: linear-gradient(135deg, rgba(251, 114, 153, 0.05) 0%, rgba(255, 146, 174, 0.05) 100%);
    border: 2px solid #f0f0f0;
    border-radius: 12px;
    padding: 24px 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 14px;
  }

  .category-btn:hover {
    border-color: #fb7299;
    background: linear-gradient(135deg, rgba(251, 114, 153, 0.15) 0%, rgba(255, 146, 174, 0.15) 100%);
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(251, 114, 153, 0.2);
  }

  .category-icon {
    font-size: 32px;
  }

  .category-name {
    color: #333;
    font-weight: 700;
    font-size: 16px;
  }

  .category-count {
    color: #fb7299;
    font-size: 12px;
    font-weight: bold;
  }

  /* 💡 特色區域 */
  .features-section {
    padding: 50px 20px;
    background-color: #fafafa;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .feature-card {
    text-align: center;
    padding: 25px 20px;
    border-radius: 8px;
    background: white;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(251, 114, 153, 0.1);
  }

  .feature-icon {
    font-size: 40px;
    display: block;
    margin-bottom: 12px;
  }

  .feature-card h3 {
    color: #333;
    font-size: 16px;
    margin-bottom: 6px;
    font-weight: 700;
  }

  .feature-card p {
    color: #999;
    font-size: 13px;
  }

  /* 響應式設計 */
  @media (max-width: 1024px) {
    .banner-content {
      flex-direction: column;
      text-align: center;
      padding: 30px 20px;
    }

    .banner-title {
      font-size: 28px;
    }

    .banner-text {
      max-width: 100%;
    }

    .products-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 768px) {
    .banner-slider {
      height: 250px;
    }

    .banner-content {
      padding: 20px;
    }

    .banner-title {
      font-size: 22px;
    }

    .banner-subtitle {
      font-size: 14px;
    }

    .banner-btn {
      padding: 10px 24px;
      font-size: 14px;
    }

    .banner-image {
      display: none;
    }

    .products-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .regions-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .categories-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .features-grid {
      grid-template-columns: 1fr;
    }

    .section-title {
      font-size: 20px;
    }

    .card-img-box {
      height: 140px;
    }
  }

  @media (max-width: 480px) {
    .banner-slider {
      height: 200px;
    }

    .banner-title {
      font-size: 18px;
    }

    .banner-subtitle {
      font-size: 12px;
    }

    .products-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .regions-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .categories-grid {
      grid-template-columns: 1fr;
    }

    .section-title {
      font-size: 18px;
    }
  }
</style>
