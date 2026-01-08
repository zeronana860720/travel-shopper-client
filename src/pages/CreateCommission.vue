<template>
  <div class="commission-page-layout">
    <div class="form-section">
      <div class="commission-card">
        <h2 class="form-title">發佈新委託</h2>
<!--        <p class="form-subtitle">填寫您想要尋找的日本商品資訊</p>-->

        <form @submit.prevent="handleSubmit">
<!--          submit.prevent
              @submit -> 監聽表單提交事件
              .prevent 阻止表單的預設行為(不會重新整理頁面!)
-->
          <div class="form-group">
            <label>委託商品名稱</label>
            <input type="text" v-model="form.itemName" placeholder="例如:限定版皮卡丘娃娃" required>
<!--            v-model -> 雙向綁定-->
          </div>
          <div class="form-group">
            <label>商品分類</label>
            <select v-model="form.category" class="custom-select" required>
              <option value="" disabled selected>請選擇商品分類</option>
              <option value="玩具公仔">玩具公仔</option>
              <option value="動漫周邊">動漫周邊</option>
              <option value="服飾配件">服飾配件</option>
              <option value="美妝保養">美妝保養</option>
              <option value="食品零食">食品零食</option>
              <option value="文具雜貨">文具雜貨</option>
              <option value="電子產品">電子產品</option>
              <option value="其他">其他</option>
            </select>
          </div>

          <div class="form-group">
            <label>商品原價</label>
            <select v-model="form.currency" class="currency-select">
              <option value="JPY">JPY</option>
              <option value="TWD">TWD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="KRW">KRW</option>
            </select>
            <input type="number" v-model="form.price"  class="price" placeholder="請輸入預計價格" required>
          </div>
          <div v-if="form.price && form.currency !== 'TWD'" class="converted-price">
            ≈ NT$ {{ convertedPrice}}
          </div>
          <div class="form-group">
            <label>購買數量</label>
            <div class="quantity-control">
              <button type="button" class="quantity-btn minus-btn" @click="decreaseQty">−</button>
              <input type="number" v-model.number="form.quantity" class="quantity-input" min="1" readonly>
              <button type="button" class="quantity-btn plus-btn" @click="addQty">+</button>
            </div>
          </div>

          <div class="form-group">
            <label>參考購買地點</label>
            <input ref="locationInputRef" type="text" v-model="form.location" placeholder="搜尋地點,例如:東京澀谷 Pokemon Center" required>
          </div>
          <div class="form-group">
            <label>商品描述</label>
            <textarea
                v-model="form.description"
                class="custom-textarea"
                maxlength="200"
                rows="4"
                placeholder="請詳細描述商品特徵、顏色、尺寸等資訊"
                required
            ></textarea>
            <small class="char-count">{{ form.description.length }} / 200 字</small>
          </div>

          <div class="form-group">
            <label>商品參考圖片</label>
            <div class="upload-container">
              <input type="file" accept="image/*" @change="handleImageUpload" ref="fileInputRef" style="display: none">
              <div v-if="!imagePreview" class="upload-placeholder" @click="() => fileInputRef?.click()">
                <span class="plus-icon">+</span>
<!--                <span class="plus-text"></span>-->
              </div>
              <div v-else class="image-preview-wrapper">
                <img :src="getImageUrl(cachedData.avatar)" class="preview-img" alt="nnn">
                <button type="button" class="remove-btn" @click="removeImage">✕</button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>委託結束日期</label>
            <input type="date" v-model="form.endDate" :min="today" required>
            <small class="hint">期間內若無人接取委託,系統將自動刪除此需求。</small>
          </div>

          <button type="submit" class="submit-btn">確認送出委託</button>
        </form>
      </div>
    </div>

    <!--    地圖區域-->
    <div class="map-section">
      <div id="map" ref="mapDivRef"></div>

      <div v-if="selectedPlace" class="map-overlay-info">
        <div class="info-header">
          <img class="pin-icon" :src="getImageUrl(cachedData.avatar )" alt="nnn">
          <strong>參考地點</strong>
        </div>
        <div class="place-name">{{ selectedPlace.name }}</div>
        <div class="place-address">{{ selectedPlace.address }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 引入需要的功能
import {ref as vueRef, onMounted, computed} from 'vue';
// as vueRef -> googleMap 也有ref怕命名搞混
// 路由器
import { useRouter } from 'vue-router';
import { useCommissionStore } from '@/stores/commission';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import axios from "axios";
// setOptions -> 設定金鑰...
// importLibrary -> 動態載入googleMap的各項功能

// 匯率
const exchangeRate = vueRef({
  JPY:0.201,
  TWD:1,
  USD:32.5,
  EUR:35.2,
  KRW:0.024,
})

const convertedPrice = computed(()=>{
  if (!form.value.price || !form.value.currency) return 0;
  const rate = exchangeRate.value[form.value.currency as keyof typeof exchangeRate.value];
  return (form.value.price * rate).toFixed(2);
  // 計算到小數點第二位
})

const fileInputRef = vueRef<HTMLInputElement | null>(null);

const router = useRouter(); // 路由器實例
const commissionStore = useCommissionStore(); // commissionStore實例
const today = new Date().toISOString().split('T')[0];
// 轉換成ISO格式 -> "2026-01-05T01:10:00.000Z"
// .split('T')[0]; -> 用T分割字串

// 建立一個響應式物件 -> 填資料要用的
const form = vueRef({
  itemName: '',
  price: null,
  location: '',
  endDate: '',
  quantity:1, // 預設數量1
  description: '',
  category:'',
  currency:'JPY'
});

const addQty = ()=>{
  form.value.quantity++;
}
const decreaseQty = ()=>{
  if (form.value.quantity >= 1) {
    form.value.quantity--;
  }
}
// 建立一個響應式物件
const avatar = vueRef('')


// 先從cachedData 顯示舊圖片
const cachedData = {
  avatar:localStorage.getItem('userAvatar')
}


const  getImageUrl = (path: string|null) => {
  if(!path) return 'https://i.imgur.com/6VBx3io.png';
  // 沒有圖給預設圖
  // 如果是 blob: 開頭（剛裁切完的暫時預覽）或是 data: 開頭（Base64），直接回傳
  if (path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  return `http://localhost:5275${path}`;
}


// --- 圖片預覽與上傳邏輯 ---
const imagePreview = vueRef<string | null>(null);
// 儲存圖片url
// <string | null>(null);  -> ts型別宣告,可以是字串或null
const selectedFile = vueRef<File | null>(null);
// 儲存檔案
// <File | null>(null); -> File或是null
// File -> 檔名,大小,類型

const handleImageUpload = (event: Event) => {
  // event:Event -> 接收事件物件 ,選取時觸發
  const target = event.target as HTMLInputElement;
  // 告訴ts這是一個html input
  // 這樣才可以使用target.files 屬性
  if (target.files && target.files[0]) {
    // target.files -> 檔案列表（可能可以多選）
    // target.files[0]->第一個
    const file = target.files[0];
    // 丟給上面的建立的響應式數據
    selectedFile.value = file;
    imagePreview.value = URL.createObjectURL(file);
    // 丟給上面的建立的響應式數據
  }
};

const removeImage = () => {
  imagePreview.value = null;
  selectedFile.value = null;
};

// --- 地圖變數 ---
const locationInputRef = vueRef<HTMLInputElement | null>(null);
// 搜尋匡裡面的字
const mapDivRef = vueRef<HTMLDivElement | null>(null);
// 響應式地圖容器 -> 可以是Div或是null

// 用來儲存使用者選擇的地點
const selectedPlace = vueRef<{
  name: string; // 地點名稱
  address: string;  // 完整地址
  lat: number;  // 緯度
  lng: number; // 經度
  placeId: string; // 這個地點在Google Maps的唯一ID
} | null>(null);

let map: any = null;
// 儲存Google地圖物件
// any -> 地圖型別複雜
// 用let 因為等一下要重新賦值
let marker: any = null;
// marker -> 紅色標點

/*
* 為啥不用ref?
* 因為這兩個是 Google Maps 的物件,不需要 Vue 的響應式
* 不會在 template 裡直接顯示它們
* 只是用來操作地圖(移動中心點、放標記等)
* */

onMounted(async () => {
  // google地圖載入需要時間 -> async 非同步處理
  try {
    // 1. 設定 API 金鑰
    setOptions({
      key:import.meta.env.VITE_GOOGLE_MAP_API_KEY,
      // 金鑰
      v: "weekly"
      // weekly -> 使用每週更新最新版
    });

    // 2. 動態載入需要的函式庫

    // 動態載入 更快,需要時才載入
    // 從裡面拿出Map類別 -> 解構賦值
    // 建立地圖物件
    const { Map } = await importLibrary("maps") as any;

    // 用來標記地點
    const { AdvancedMarkerElement } = await importLibrary("marker") as any;

    // 實現自動建議功能
    const { Autocomplete } = await importLibrary("places") as any;

    // 3. 初始化地圖

    // 第一個參數->mapDivRef-> 指定要放在哪個html元素
    map = new Map(mapDivRef.value, {
      center: { lat: 35.681236, lng: 139.767125 },
      zoom: 20, //縮放等級
      mapId: "DEMO_MAP_ID", // Google識別碼
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    // 4. 初始化 Autocomplete (地點搜尋)
    const autocomplete = new Autocomplete(locationInputRef.value, {
      // 第一個參數locationInputRef,綁定到input框框
      fields: ["geometry", "name", "formatted_address", "place_id"],
      // [地理資訊經緯度,地點名稱,格式化地址,地點id唯一的]
      types: ["establishment", "geocode"]
      // 設定搜尋的類型
      // establishment-> 商家景點建築物
      // geocode地址街道
    });

    // 5. 監聽搜尋結果
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      // autocomplete->拿剛剛取得的資訊
      console.log(place);
      if (!place.geometry || !place.geometry.location) {
        console.warn("找不到該地點的地理資訊");
        return;
      }

      map.setCenter(place.geometry.location);
      // 把地圖中心點移到選中的地方
      // place.geometry.location地點經緯度
      map.setZoom(17);

      if (marker) {
        marker.map = null;
      }
      // 如果本來有標記先刪掉


      marker = new AdvancedMarkerElement({
        map: map,
        position: place.geometry.location,
        // 設定標記的位置
        title: place.name
      });

      selectedPlace.value = {
        name: place.name || '',
        address: place.formatted_address || '',
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        placeId: place.place_id || ''
      };
      // 儲存選中的地點的資訊 -> 給後端用的

      form.value.location = place.name || '';
      // 丟到參考地點那個div -> 搜尋form.location
    });

  } catch (err) {
    console.error("地圖載入失敗:", err);
    alert("地圖載入失敗");
  }
  try {
      const token = localStorage.getItem('token');
      const res  = await axios.get('/api/Auth/profile',{
        headers: { Authorization: `Bearer ${token}` }
      })
    cachedData.avatar = res.data.avatar;
  }
  catch (error) {

  }
});

// test

const handleSubmit = () => {
  commissionStore.addCommission({
    ...form.value,
    // 展開運算符
    /*
    * itemName: form.value.itemName,
      price: form.value.price,
      location: form.value.location,
      endDate: form.value.endDate,
    * */
    image: imagePreview.value,
    latitude: selectedPlace.value?.lat || null,
    longitude: selectedPlace.value?.lng || null,
    formatted_address: selectedPlace.value?.address || null,
    google_place_id: selectedPlace.value?.placeId || null
  });
  // 把這一整個大物件傳入addCommission
  alert('委託發佈成功!');
  router.push('/commissions');
};
</script>

<style scoped>
*{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  margin: 0;
  padding: 0;
  overflow: hidden; /* 防止多餘滾動條 */
}

.commission-page-layout {
  display: flex;
  height: calc(100vh - 84px);
  width: 100%;
  background-color: #f0f2f5;
  font-family: 'PingFang TC', 'Microsoft JhengHei', sans-serif;
  overflow: hidden;
}

.form-section {
  flex: 0 0 45%;
  padding: 25px 30px;
  overflow-y: auto;
  background-color: #f9f9f9;
  border-right: 1px solid #e0e0e0;
  box-shadow: 4px 0 15px rgba(0,0,0,0.05);
}

.commission-card {
  background: #ffffff;
  padding: 28px 25px;
  border-radius: 24px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.1);
  border: 1px solid rgba(255,255,255,0.8);
}

.form-title {
  color: #1a1a1a;
  font-size: 26px;
  font-weight: 800;
  margin-bottom: 8px;
  text-align: center;
  letter-spacing: 1.5px;
}

.form-subtitle {
  color: #7f8c8d;
  text-align: center;
  margin-bottom: 28px;
  font-size: 14px;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 20px;
  position: relative;
}

.form-group label {
  display: block;
  font-weight: 700;
  margin-bottom: 8px;
  color: #34495e;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  color: #2c3e50;
  background-color: #fff;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-sizing: border-box;
}

.form-group input:focus {
  border-color: #fb7299;
  box-shadow: 0 0 0 4px rgba(251, 114, 153, 0.15);
  outline: none;
}

.hint {
  display: block;
  margin-top: 6px;
  color: #fb7299;
  font-size: 12px;
  font-style: italic;
  line-height: 1.4;
}

.upload-container {
  width: 70px;
  height: 70px;
  border: 3px dashed #cbd5e0;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.4s ease;
  background-color: #fcfcfc;
}

.upload-container:hover {
  border-color: #fb7299;
  background-color: #fff5f7;
  transform: translateY(-3px);
}

.plus-icon {
  font-size: 50px;
  place-items: center;
  color: #a0aec0;
  margin-bottom: 6px;
}

.upload-placeholder span:last-child {
  font-size: 13px;
  color: #718096;
}

.image-preview-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 14px;
  cursor: pointer;
  backdrop-filter: blur(5px);
  transition: all 0.3s;
}

.remove-btn:hover {
  background: #fb7299;
  transform: scale(1.1);
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #fb7299 0%, #ff92ae 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 15px;
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
  margin-top: 15px;
  box-shadow: 0 8px 25px rgba(251, 114, 153, 0.35);
  transition: all 0.3s ease;
  letter-spacing: 2px;
}

.submit-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(251, 114, 153, 0.45);
}

/* 🌟 地圖區域 - 加上可愛粉紅框 */
.map-section {
  flex: 1;
  position: relative;
  border: 4px solid #fb7299;
  border-left: none;
  background: linear-gradient(135deg, rgba(251, 114, 153, 0.03) 0%, rgba(255, 146, 174, 0.03) 100%);
  box-shadow: inset 0 0 20px rgba(251, 114, 153, 0.08);
}

#map {
  width: 100%;
  height: 100%;
  border-radius: 0;
}

/* 🎀 超可愛版地點資訊卡片 */
.map-overlay-info {
  position: absolute;
  top: 25px;
  left: 25px;
  background: linear-gradient(135deg, #ffffff 0%, #fff5f7 100%);
  padding: 22px 30px;
  border-radius: 10px;
  box-shadow:
      0 15px 50px rgba(251, 114, 153, 0.35),
      0 5px 20px rgba(251, 114, 153, 0.2);
  z-index: 10;
  max-width: 360px;
  border: 2px solid #fb7299;
  backdrop-filter: blur(12px);
  transition: all 0.2s cubic-bezier(1,0,0,.99);
  animation: slideIn 0.5s ease-out;
}

/* 🎈 進場動畫 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.map-overlay-info:hover {
  transform: translateY(-4px) scale(1.03);
  box-shadow:
      0 20px 60px rgba(251, 114, 153, 0.45),
      0 8px 30px rgba(251, 114, 153, 0.3);
}

.info-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(251, 114, 153, 0.2);
}

.pin-icon {
  width: 50px;
  height: 50px;
  border: 1px solid #fb7299;  /* 人頭外框*/
  border-radius: 50%;
  object-fit: cover;
  font-size: 24px;
  animation: bounce 1.5s infinite cubic-bezier(0,.96,.54,.98);
  transition: all 0.3s ease;
}
.pin-icon:hover {

  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);  /* 發光效果 */
  transform: scale(1.4);  /* 放大 10% */
}

/* avatar圖示跳動動畫 */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.info-header strong {
  color: #fb7299;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 1px;
  margin: 0;
}

.place-name {
  font-size: 17px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
  line-height: 1.6;
}

.place-address {
  font-size: 13px;
  color: #7f8c8d;
  line-height: 1.5;
  font-style: italic;
}

/* 🌟 滾動條美化 */
.form-section::-webkit-scrollbar {
  width: 8px;
}

.form-section::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.form-section::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #fb7299 0%, #ff92ae 100%);
  border-radius: 10px;
}

.form-section::-webkit-scrollbar-thumb:hover {
  background: #fb7299;
}
/* 🎀 改良版數量控制器樣式 */
.quantity-control {
  display: flex;
  align-items: center;
  gap: 0;
  width: fit-content;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  background-color: #fff;
  transition: all 0.3s ease;
}

.quantity-control:hover {
  border-color: #fb7299;
  box-shadow: 0 0 0 4px rgba(251, 114, 153, 0.15);
}

.quantity-btn {
  width: 40px;  /* ✨ 從 45px 改成 40px */
  height: 40px;  /* ✨ 從 45px 改成 40px */
  border: none;  /* ✨ 移除所有邊框 */
  background: linear-gradient(135deg, #fb7299 0%, #ff92ae 100%);
  color: white;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-btn:hover {
  background: linear-gradient(135deg, #ff92ae 0%, #fb7299 100%);
  transform: scale(1.05);
}

.quantity-btn:active {
  transform: scale(0.95);
}

/* ✨ 完全移除中間分隔線 */
.minus-btn {
  /* 不需要 border-right 了 */
}

.plus-btn {
  /* 不需要 border-left 了 */
}

.quantity-input {
  width: 100px !important;
  height: 40px;  /* ✨ 從 45px 改成 40px */
  text-align: center;
  border: none !important;  /* ✨ 移除邊框 */
  outline: none !important;  /* ✨ 移除 focus 時的藍框 */
  font-size: 17px;
  font-weight: 700;
  color: #2c3e50;
  background-color: #fff;
  padding: 0;
  cursor: default;
}

/* 移除數字輸入框的上下箭頭 */
.price::-webkit-inner-spin-button,
.price::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.quantity-input::-webkit-inner-spin-button,
.quantity-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.quantity-input {
  -moz-appearance: textfield;
}

/* ✨ 移除 focus 時的任何外框 */
.quantity-input:focus {
  outline: none;
  border: none;
}
/* 🎀 自訂下拉選單樣式 */
.custom-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  color: #2c3e50;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  /* 移除預設箭頭 */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  /* 自訂箭頭 */
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fb7299' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 20px;
  padding-right: 40px;
}

.custom-select:hover {
  border-color: #fb7299;
  box-shadow: 0 0 0 4px rgba(251, 114, 153, 0.15);
}

.custom-select:focus {
  border-color: #fb7299;
  box-shadow: 0 0 0 4px rgba(251, 114, 153, 0.15);
  outline: none;
}

.custom-select option {
  padding: 10px;
  font-size: 14px;
}

/* 🎀 多行文字輸入框樣式 */
.custom-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 14px;
  color: #2c3e50;
  background-color: #fff;
  font-family: 'PingFang TC', 'Microsoft JhengHei', sans-serif;
  resize: vertical;  /* 只能垂直調整大小 */
  min-height: 100px;
  max-height: 300px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  line-height: 1.6;
}

.custom-textarea:hover {
  border-color: #fb7299;
  box-shadow: 0 0 0 4px rgba(251, 114, 153, 0.15);
}

.custom-textarea:focus {
  border-color: #fb7299;
  box-shadow: 0 0 0 4px rgba(251, 114, 153, 0.15);
  outline: none;
}

.custom-textarea::placeholder {
  color: #a0aec0;
  font-style: italic;
}

/* 🎀 字數統計樣式 */
.char-count {
  display: block;
  margin-top: 6px;
  color: #7f8c8d;
  font-size: 12px;
  text-align: right;
  font-style: italic;
}
/* 🎀 價格輸入組合樣式 */
.price-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* 🎀 幣別下拉選單 */
.currency-select {
  width: 120px;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  color: #2c3e50;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fb7299' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 18px;
  padding-right: 35px;
}

.currency-select:hover {
  border-color: #fb7299;
  box-shadow: 0 0 0 4px rgba(251, 114, 153, 0.15);
}

.currency-select:focus {
  border-color: #fb7299;
  box-shadow: 0 0 0 4px rgba(251, 114, 153, 0.15);
  outline: none;
}

/* 🎀 價格輸入框 */
.price-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  color: #2c3e50;
  background-color: #fff;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.price-input:hover {
  border-color: #fb7299;
  box-shadow: 0 0 0 4px rgba(251, 114, 153, 0.15);
}

.price-input:focus {
  border-color: #fb7299;
  box-shadow: 0 0 0 4px rgba(251, 114, 153, 0.15);
  outline: none;
}


.price-input {
  -moz-appearance: textfield;
}

/* 🎀 換算後台幣價格樣式 */
.converted-price {
  margin-top: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #fff5f7 0%, #ffe8f0 100%);
  border-left: 3px solid #fb7299;
  border-radius: 8px;
  color: #fb7299;
  font-size: 14px;
  font-weight: 700;
  text-align: right;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


</style>
