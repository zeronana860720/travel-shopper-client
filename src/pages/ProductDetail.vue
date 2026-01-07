<template>
  <div class="detail-container" v-if="product">
    <div class="detail-left">
      <img :src="product.image" :alt="product.name" class="main-image">
    </div>

    <div class="detail-right">
      <nav class="breadcrumb">首頁 / 日本代購 / {{ product.name }}</nav>

      <h1 class="detail-title">{{ product.name }}</h1>

      <div class="price-section">
        <span class="currency">NT$</span>
        <span class="amount">{{ product.price }}</span>
      </div>

      <div class="description-box">
        <h3>商品簡介</h3>
        <p>{{ product.description }}</p>
      </div>

      <div class="action-buttons">
        <button class="add-cart">加入購物車</button>
        <button class="buy-now" @click="buyNow">立即購買</button>
      </div>

      <button class="back-link" @click="$router.back()">〈 返回上一頁</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()

// 從 Pinia 倉庫找出 ID 相符的商品
const product = computed(() => {
  const id = Number(route.params.id)
  return productStore.products.find(p => p.id === id)
})
// 在 ProductDetail.vue 的 <script setup> 中
const buyNow = () => {
  // 帶著目前的商品 ID 跳轉
  router.push(`/checkout/${product.value.id}`)
}
</script>

<style scoped>
.detail-container {
  max-width: 1000px;
  margin: 120px auto 40px; /* 避開固定導覽列 */
  display: flex;
  gap: 50px;
  padding: 20px;
  background: white;
  border-radius: 20px;
}

.detail-left {
  flex: 1;
}

.main-image {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.detail-right {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.breadcrumb {
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
}

.detail-title {
  font-size: 28px;
  margin-bottom: 15px;
  color: #333;
}

.price-section {
  background: #fff5f7;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.currency {
  color: #fb7299;
  font-size: 18px;
}

.amount {
  color: #fb7299;
  font-size: 36px;
  font-weight: bold;
  margin-left: 5px;
}

.description-box h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #666;
}

.description-box p {
  line-height: 1.6;
  color: #555;
  margin-bottom: 40px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.add-cart, .buy-now {
  flex: 1;
  padding: 14px 15px;  /* 🎯 跟 submit-btn 一樣的 padding */
  border-radius: 15px;
  font-size: 17px;  /* 🎯 改成 17px */
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 2px;
  box-shadow: 0 8px 25px rgba(251, 114, 153, 0.25);
}

.add-cart {
  background: linear-gradient(135deg, #ffeef2 0%, #fff5f7 100%);
  color: #fb7299;
  border: 2px solid #fb7299;
}

.add-cart:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(251, 114, 153, 0.35);
  background: linear-gradient(135deg, #fff5f7 0%, #ffffff 100%);
  border-color: #ff85a2;  /* 🎯 新增:hover 時邊框顏色變淺 */
}

.buy-now {
  background: linear-gradient(135deg, #fb7299 0%, #ff92ae 100%);
  color: white;
  border: none;
}

.buy-now:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(251, 114, 153, 0.45);
}

/* 🎯 新增:按下去的效果 */
.add-cart:active, .buy-now:active {
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(251, 114, 153, 0.3);
}


.back-link {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  text-align: left;
  padding: 0;
}

.back-link:hover {
  color: #fb7299;
}
</style>