import { defineStore } from 'pinia';
import axios from 'axios';
import type { Commission } from '@/types/commission'; // 引入第一步定義的介面

export const useCommissionStore = defineStore('commission', {
    // 1. State：用來存放資料的「倉庫」
    state: () => ({
        commissions: [] as Commission[], // 初始化為空陣列，類型為第一步定義的 Commission
        loading: false,// 用來記錄是否正在載入中
        currentCommission: null as Commission | null,
        // 存放我接取的委託
        acceptedCommissions: [] as any[],
    }),

    // 2. Actions：用來執行非同步操作（如呼叫 API）的「動作」
    actions: {
        async fetchCommissions() {
            this.loading = true;
            try {
                const token = localStorage.getItem('token'); // 取得登入憑證
                const response = await axios.get('http://127.0.0.1:5275/api/Commissions', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                // 將後端傳回的資料存入倉庫
                this.commissions = response.data.data;
                console.log(this.commissions);
            } catch (error) {
                console.error('抓取委託清單失敗:', error);
            } finally {
                this.loading = false;
            }
        },
        // ✨ 新增：根據 ServiceCode 抓取單筆詳情
        async fetchCommissionDetail(serviceCode: string) {
            this.loading = true;
            try {
                const token = localStorage.getItem('token');
                // 注意：這裡的路徑最後面接的是 ServiceCode 字串
                const response = await axios.get(`http://127.0.0.1:5275/api/Commissions/${serviceCode}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data.success) {
                    // 將後端回傳的單筆資料存入 currentCommission
                    this.currentCommission = response.data.data;
                }
            } catch (error) {
                console.error('抓取委託詳情失敗:', error);
                this.currentCommission = null;
            } finally {
                this.loading = false;
            }
        },
        async acceptCommission(serviceCode: string) {
            const token = localStorage.getItem('token');
            if (!token) throw { success: false, message: '找不到登入資訊，請重新登入' };
            try {

                // 呼叫後端 API，注意路徑要對應你的 Controller [Route("Commission")]
                const response = await axios.post(
                    `http://127.0.0.1:5275/Commission/${serviceCode}/accept`,
                    {}, // 這是 body，因為我們沒傳資料所以傳空物件
                    {
                        headers: {
                            Authorization: `Bearer ${token}` // 記得 Bearer 後面有個空格唷！
                        }
                    }
                );
                return response.data;
            } catch (error: any) {
                // 如果後端回傳 BadRequest，要把錯誤訊息丟回去給組件
                throw error.response?.data || { success: false, message: '系統錯誤' };
            }
        },
        // ✨ 新增：抓取使用者自己的管理清單 (對應後端 api/Manage/Commission)
        async fetchUserManageCommissions() {
            this.loading = true;
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://127.0.0.1:5275/api/Manage/Commission', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                // 將抓到的管理清單存入 state (可以直接複用 commissions 或另開一個 state)
                this.commissions = response.data;
            } catch (error) {
                console.error('抓取管理清單失敗:', error);
            } finally {
                this.loading = false;
            }
        },
        async addCommission(formData: any) {
            try {
                // 1. 從 LocalStorage 抓取 Token (這是因為後端有 [Authorize])
                const token = localStorage.getItem('token');

                // 2. 建立 FormData 物件
                const fd = new FormData();

                // 3. 手動將所有資料塞進 FormData (名稱要對齊後端的 DTO 唷！)
                fd.append('Title', formData.itemName);
                fd.append('Description', formData.description);
                fd.append('Price', formData.price.toString());
                fd.append('Quantity', formData.quantity.toString());
                fd.append('Category', formData.category);
                fd.append('Deadline', formData.endDate);
                fd.append('Location', formData.location);
                fd.append('Currency', formData.currency);

                // 地圖欄位 (對應後端的小寫加底線命名)
                if (formData.google_place_id) fd.append('google_place_id', formData.google_place_id);
                if (formData.formatted_address) fd.append('formatted_address', formData.formatted_address);
                if (formData.latitude) fd.append('latitude', formData.latitude.toString());
                if (formData.longitude) fd.append('longitude', formData.longitude.toString());

                // 圖片檔案 (最重要的部分！)
                if (formData.rawImageFile) {
                    fd.append('Image', formData.rawImageFile);
                }

                // 4. 發送 POST 請求
                const response = await axios.post('http://127.0.0.1:5275/Commission/Create', fd, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                });

                return response.data;
            } catch (error) {
                console.error('發佈失敗：', error);
                throw error;
            }
        },
        // ✨ 新增：抓取「我接取的委託」清單（賣家模式用）
        async fetchMyAcceptCommissions() {
            this.loading = true;
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://127.0.0.1:5275/api/Manage/Commission/MyAccept', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                // 將後端回傳的 DTO 列表存入 state
                this.acceptedCommissions = response.data;
                console.log('委託訂單資訊', this.acceptedCommissions);
            } catch (error) {
                console.error('抓取委託訂單失敗', error);
            } finally {
                this.loading = false;
            }
        },
        // 新增：上傳收據功能
        async uploadReceipt(serviceCode: string) {
            try{
                const token = localStorage.getItem('token');
                const response = await axios.post(`http://127.0.0.1:5275/Commission/${serviceCode}/receipt`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }
            catch (error) {
                console.error(error);
            }
        },
        // ✨ 新增：刪除委託 Actions
        async deleteCommission(serviceCode: string) {
            try {
                const token = localStorage.getItem('token');
                // 1. 發送 DELETE 請求
                const response = await axios.delete(`http://127.0.0.1:5275/Commission/${serviceCode}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data.success) {
                    // 2. 刪除成功後，重新抓取清單來刷新畫面 (同時確保餘額等資訊同步)
                    await this.fetchUserManageCommissions();
                    return { success: true, message: response.data.message };
                }
            } catch (error: any) {
                console.error('刪除委託失敗:', error);
                throw error.response?.data || { success: false, message: '刪除失敗，請稍後再試' };
            }
        }
    }
});