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
        async createStore(formData: FormData) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.post('http://127.0.0.1:5275/api/createstore/my/store', formData, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                await this.fetchMyStores();
                return response.data;
            } catch (error: any) {
                throw error.response?.data || { message: '建立失敗' };
            }
        },

        // 送出賣場審核
        async submitStoreForReview(storeId: number) {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    return Promise.reject({ message: '請先登入' });
                }

                const response = await axios.post(
                    `http://127.0.0.1:5275/api/createstore/${storeId}/submit`,
                    {},
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                await this.fetchMyStores();
                return response.data;
            } catch (error: any) {
                throw error.response?.data || { message: '送出審核失敗' };
            }
        },

        // ✨ 新增:建立商品
        // ✨ 新增:建立商品
        async createProduct(storeId: number, productData: any) {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    return Promise.reject({ message: '請先登入' });
                }

                const formData = new FormData();

                // 基本資料
                formData.append('ProductName', productData.productName);
                formData.append('Price', productData.price.toString());
                formData.append('Quantity', productData.quantity.toString());
                formData.append('Description', productData.description);
                formData.append('EndDate', productData.endDate);

                // Category
                if (productData.category) {
                    formData.append('Category', productData.category);
                }

                // 圖片檔案
                if (productData.imageFile) {
                    formData.append('Image', productData.imageFile);
                }

                // 地點資料
                if (productData.google_place_id) {
                    formData.append('GooglePlaceId', productData.google_place_id);
                    formData.append('LocationName', productData.location || '');
                    formData.append('FormattedAddress', productData.formatted_address || '');
                    formData.append('Latitude', productData.latitude.toString());
                    formData.append('Longitude', productData.longitude.toString());
                }

                // ✓ 改:改成跟其他方法一樣用 createstore
                const response = await axios.post(
                    `http://127.0.0.1:5275/api/createstore/${storeId}/products`,
                    //                              ^^^^^^^^^^^ 改成 createstore
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                return response.data;
            } catch (error: any) {
                throw error.response?.data || { message: '新增商品失敗' };
            }
        },

        // 取得賣場商品列表
        async fetchStoreProducts(storeId: number) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `http://127.0.0.1:5275/api/createstore/${storeId}/products`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                console.log(response.data);
                return response.data;
            } catch (error: any) {
                throw error.response?.data || { message: '取得商品失敗' };
            }
        },
        // 取得所有待審核商品 (管理員用)
        async fetchPendingProducts() {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    return Promise.reject({ message: '請先登入' });
                }

                const response = await axios.get(
                    'http://127.0.0.1:5275/api/review/products/newpending',
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                return response.data;
            } catch (error: any) {
                throw error.response?.data || { message: '取得待審核商品失敗' };
            }
        },
        // 取得所有待審核賣場
        async fetchPendingStores() {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    return Promise.reject({ message: '請先登入' });
                }

                const response = await axios.get(
                    'http://127.0.0.1:5275/api/review/storepending',
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                return response.data;
            } catch (error: any) {
                throw error.response?.data || { message: '取得待審核賣場失敗' };
            }
        },

        // 審核通過商品
        async approveProduct(productId: number) {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    return Promise.reject({ message: '請先登入' });
                }

                const response = await axios.post(
                    `http://127.0.0.1:5275/api/review/products/${productId}/approveproduct`,
                    {},
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                return response.data;
            } catch (error: any) {
                throw error.response?.data || { message: '審核通過失敗' };
            }
        },
        // 退回商品
        async rejectProduct(productId: number, reason: string) {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    return Promise.reject({ message: '請先登入' });
                }

                const response = await axios.post(
                    `http://127.0.0.1:5275/api/review/products/${productId}/rejectproduct`,
                    { comment: reason },  // ← 後端期望的欄位名是 comment
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                return response.data;
            } catch (error: any) {
                throw error.response?.data || { message: '退回商品失敗' };
            }
        }








    }
});
