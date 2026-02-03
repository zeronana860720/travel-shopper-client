<template>
  <div class="history-page">

    <div class="page-header">
      <h2 class="page-title">委託歷史紀錄查詢</h2>
      <p class="sub-title">查詢委託的變更歷程與詳細異動</p>
    </div>

    <div class="search-card">
      <div class="search-grid">
        <div class="input-group">
          <label>紀錄編號</label>
          <input
              type="text"
              class="styled-input disabled"
              disabled
              placeholder="系統自動產生"
          />
        </div>

        <div class="input-group">
          <label>委託編號 <span class="required">*</span></label>
          <input
              type="text"
              class="styled-input"
              v-model="searchParams.commissionId"
              placeholder="請輸入委託編號 (例如: C-2026...)"
              @keyup.enter="handleSearch"
          />
        </div>

        <div class="btn-group">
          <button class="search-btn" @click="handleSearch" :disabled="isLoading">
            <span v-if="isLoading" class="loading-icon">⏳</span>
            {{ isLoading ? '查詢中...' : '查詢紀錄' }}
          </button>
          <button class="clear-btn" @click="handleClear">清除條件</button>
        </div>
      </div>
    </div>

    <div class="result-card">
      <div class="section-header">
        <h3 class="section-title">查詢結果</h3>
        <span class="result-count" v-if="historyList.length > 0">共 {{ historyList.length }} 筆資料</span>
      </div>

      <div class="table-container">
        <table class="modern-table">
          <colgroup>
            <col style="width: 80px"> <col style="width: 120px"> <col style="width: 100px"> <col style="width: 100px"> <col style="width: 160px"> <col style="width: 30%">   <col style="width: 30%">   </colgroup>
          <thead>
          <tr>
            <th>歷史 ID</th>
            <th>委託編號</th>
            <th>操作行為</th>
            <th>變更者</th>
            <th>變更時間</th>
            <th>舊資料 (Old)</th>
            <th>新資料 (New)</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="item in historyList" :key="item.historyid">
            <td class="text-center">#{{ item?.historyid }}</td>
            <td class="text-bold">{{ item?.commissionid }}</td>
            <td>
                <span class="action-tag" :class="getActionClass(item?.action)">
                  {{ item?.action }}
                </span>
            </td>
            <td>{{ item?.changedby }}</td>
            <td class="time-cell">{{ item?.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A' }}</td>
            <td class="json-cell old-val">{{ formatJson(item?.oldData) }}</td>
            <td class="json-cell new-val">{{ formatJson(item?.newData) }}</td>
          </tr>

          <tr v-if="historyList.length === 0">
            <td colspan="7" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">🔍</span>
                <p v-if="!isLoading">請輸入委託編號並點擊查詢 ( ﾟ∀ﾟ)</p>
                <p v-else>正在努力翻找紀錄中...</p>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name='History'>
import { ref } from 'vue';
import axios from 'axios';

// 1. 定義搜尋條件
const searchParams = ref({
  historyId: '',
  commissionId: ''
});

// 2. 定義表格資料與載入狀態
const historyList = ref<any[]>([]);
const isLoading = ref(false);

const formatJson = (data: any) => {
  if (!data) return '-';
  try {
    const obj = typeof data === 'string' ? JSON.parse(data) : data;
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return data;
  }
};

// 輔助樣式：根據動作給不同顏色
const getActionClass = (action: string) => {
  if (!action) return 'default';
  const act = action.toUpperCase();
  if (act.includes('CREATE') || act.includes('建立')) return 'create';
  if (act.includes('UPDATE') || act.includes('修改')) return 'update';
  if (act.includes('DELETE') || act.includes('刪除')) return 'delete';
  return 'default';
};

// 3. 查詢函數
const handleSearch = async () => {
  const code = searchParams.value.commissionId.trim();

  if (!code) {
    alert("請輸入委託編號 (Service Code) 唷！");
    return;
  }

  isLoading.value = true;
  try {
    // 記得確認你的 Port 是 5275 還是其他
    const response = await axios.get(`http://localhost:5275/admin/History/${code}`);

    if (response.data && response.data.success) {
      historyList.value = response.data.data;
    } else {
      historyList.value = [];
      alert(response.data.message || "查無資料");
    }
  } catch (error: any) {
    console.error("查詢失敗:", error);
    const errorMsg = error.response?.data?.message || "系統連線錯誤";
    alert(`查詢失敗：${errorMsg}`);
  } finally {
    isLoading.value = false;
  }
};

// 4. 清除函數
const handleClear = () => {
  searchParams.value.commissionId = '';
  historyList.value = [];
};
</script>

<style scoped>
.history-page {
  max-width: 1200px;
  margin: 100px auto 40px; /* 留出 Navbar 空間 */
  padding: 0 20px;
  font-family: 'PingFang TC', 'Microsoft JhengHei', sans-serif;
}

/* --- 標題區 --- */
.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 800;
  letter-spacing: 1px;
}

.sub-title {
  color: #999;
  font-size: 14px;
}

/* --- 搜尋卡片 --- */
.search-card {
  background: white;
  border-radius: 16px;
  padding: 24px 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  margin-bottom: 30px;
  border: 1px solid #f0f0f0;
}

.search-grid {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}

.input-group {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 200px;
}

.input-group label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 600;
}

.required {
  color: #fb7299;
  margin-left: 4px;
}

/* 參考 .styled-input */
.styled-input {
  padding: 10px 16px;
  border: 2px solid #eee;
  border-radius: 12px;
  font-size: 15px;
  color: #333;
  background: #fafafa;
  transition: all 0.3s;
  height: 46px;
}

.styled-input:focus {
  outline: none;
  border-color: #fb7299;
  background: white;
  box-shadow: 0 0 0 3px rgba(251, 114, 153, 0.1);
}

.styled-input.disabled {
  background: #f5f5f5;
  color: #bbb;
  cursor: not-allowed;
  border-color: #eee;
}

/* --- 按鈕樣式 --- */
.btn-group {
  display: flex;
  gap: 12px;
  height: 46px; /* 與 input 等高 */
}

/* 參考 .add-product-btn / .confirm-btn */
.search-btn {
  background: linear-gradient(135deg, #fb7299 0%, #ff92ae 100%);
  color: white;
  border: none;
  padding: 0 28px;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 15px;
  box-shadow: 0 4px 12px rgba(251, 114, 153, 0.3);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.search-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(251, 114, 153, 0.4);
}

.search-btn:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
  box-shadow: none;
}

/* 參考 .cancel-btn */
.clear-btn {
  background: #f0f0f0;
  color: #666;
  border: none;
  padding: 0 20px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.clear-btn:hover {
  background: #e0e0e0;
  color: #333;
}

/* --- 結果卡片 --- */
.result-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.result-count {
  font-size: 13px;
  color: #fb7299;
  background: #fff0f3;
  padding: 4px 12px;
  border-radius: 20px;
}

/* --- 表格樣式 --- */
.table-container {
  overflow-x: auto;
  flex: 1;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.modern-table th {
  text-align: left;
  padding: 14px 16px;
  background-color: #fafafa;
  color: #666;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 2px solid #eee;
  white-space: nowrap;
}

.modern-table td {
  padding: 16px;
  border-bottom: 1px solid #f7f8fa;
  font-size: 14px;
  color: #444;
  vertical-align: top;
  transition: background 0.2s;
  word-break: break-word;
}

.modern-table tr:hover td {
  background-color: #fff8fa; /* 淡淡的粉色懸停 */
}

/* 文字樣式 */
.text-center { text-align: center; color: #999; }
.text-bold { font-weight: bold; color: #333; }
.time-cell { color: #888; font-size: 13px; }

/* 動作標籤 */
.action-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
}
.action-tag.create { background: #e6f7ff; color: #00aeec; }
.action-tag.update { background: #fff7e6; color: #ff9800; }
.action-tag.delete { background: #fff1f0; color: #ff4d4f; }
.action-tag.default { background: #f5f5f5; color: #999; }

/* JSON 資料格 */
.json-cell {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  background: #fbfbfb;
  border-radius: 8px;
  padding: 10px;
  border: 1px solid #f0f0f0;
}

.json-cell.old-val { color: #666; }
.json-cell.new-val { color: #222; background: #fdfdfd; }

/* 空狀態 */
.empty-state {
  text-align: center;
  padding: 60px 0;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  color: #bbb;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}
</style>