import {defineStore} from "pinia";
import * as signalR from '@microsoft/signalr'
import { ref } from 'vue'

export const useChatStore = defineStore('chat', () => {
    // connection -> 儲存連線物件
    // isConnected -> 紀錄是否已經連線
    const connection = ref<signalR.HubConnection | null>(null)
    const isConnected = ref(false)

    // 建立 SignalR 連線
    const connect = async () => {  // ← 拿掉 userId 參數
        try {
            // 拿token-> 後端有Authorize所以一定要拿
            const token = localStorage.getItem('token')

            connection.value = new signalR.HubConnectionBuilder()
                // 步驟一：new signalR.HubConnectionBuilder()-> 設計圖
                .withUrl('http://localhost:5275/chathub', {accessTokenFactory: () => token || ''})
                // 步驟二：withUrl
                    // accessTokenFactory -> 獲取token ,把token塞進去
                    // 把token帶在身上給後端檢查
                // 步驟三：withAutomaticReconnect()
                .withAutomaticReconnect()
                // 斷線自動重連
                // 步驟四：build() -> 按照上面的設定開始製作電話機
                .build()

            // 最後把做好的電話機存給 connection.value

            connection.value.on('ReceiveMessage', (data: any) => {
                console.log('收到新訊息:', data)
            })
            // 監聽事件
            // 收到後端發出的ReceiveMessage訊號還有data的時候
            // 把它印出來

            await connection.value.start()
            console.log('SignalR 連線成功!')
            isConnected.value = true

            await connection.value.invoke('ConnectUser')  // ← 不用傳參數了
            // 呼叫後端的ConnectUser方法

        } catch (error) {
            console.error('SignalR 連線失敗:', error)
            isConnected.value = false
        }
    }


    // sendMessage方法
    // 發送訊息
    const sendMessage = async (chatRoomId: string, message: string) => {  // ← 只留兩個參數
        if (!connection.value || !isConnected.value) {
            console.error('SignalR 未連線')
            return
        }

        try {
            await connection.value.invoke('SendMessage', chatRoomId, message)  // ← 只傳兩個參數
        } catch (error) {
            console.error('發送訊息失敗:', error)
        }
    }

    // 標記已讀
    const markAsRead = async (chatRoomId: string) => {  // ← 只留一個參數
        if (!connection.value || !isConnected.value) return

        try {
            await connection.value.invoke('MarkAsRead', chatRoomId)  // ← 只傳一個參數
        } catch (error) {
            console.error('標記已讀失敗:', error)
        }
    }


    // 斷開連線
    const disconnect = async () => {
        // 1. 檢查是不是有電話機
        if (connection.value) {
            // 2. 正是掛斷電話
            await connection.value.stop()
            // 3. 重設狀態
            // 設為false-> UI上的連線中就會斷掉
            isConnected.value = false
            console.log('SignalR 已斷線')
        }
    }


    return {
        connection,
        isConnected,
        connect,
        sendMessage,
        disconnect,
        markAsRead,
    }
})