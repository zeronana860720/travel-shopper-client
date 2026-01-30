import { defineStore } from 'pinia';
import axios from 'axios';

interface StoreItem {
    storeId: number;
    storeName: string;
    status: number;
    storeImage?: string;
    createdAt: string;
    reviewFailCount: number;
    storeDescription: string;
}

export const useStoreStore = defineStore('store', {
    state: () => ({
        stores: [] as StoreItem[],
        loading: false
    }),

    actions: {
        // 抓我的賣場
        async fetchMyStores() {
            this.loading = true;
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://127.0.0.1:5275/api/createstore/my/mystore', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                this.stores = response.data;
            } catch (error) {
                console.error('抓取賣場失敗:', error);
            } finally {
                this.loading = false;
            }
        },

        // 建立賣場
        // 1. 修改接收的型別為 FormData
        async createStore(formData: FormData) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.post('http://127.0.0.1:5275/api/createstore/my/store', formData, {
                    headers: {
                        Authorization: `Bearer ${token}`
                        // 2. 把 'Content-Type' 那一行刪掉，讓瀏覽器自動處理就好囉！✧
                    }
                });

                await this.fetchMyStores();
                return response.data;
            } catch (error: any) {
                throw error.response?.data || { message: '建立失敗' };
            }
        }
    }
});
