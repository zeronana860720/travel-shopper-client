<template>
  <div class="chat-page">
    <!-- 左側：聯絡人列表 -->
    <div class="contacts-sidebar">
      <div class="sidebar-header">
        <h2>聊天列表</h2>
      </div>

      <div class="contacts-list">
        <div
            v-for="contact in contacts"
            :key="contact.chatRoomId"
            :class="['contact-item', { active: selectedContact?.chatRoomId === contact.chatRoomId }]"
            @click="selectContact(contact)"
        >
          <div class="contact-avatar">
            <img :src="contact.avatar" :alt="contact.name">
            <span v-if="contact.online" class="online-dot"></span>
          </div>

          <div class="contact-info">
            <div class="contact-header">
              <h4 class="contact-name">{{ contact.name }}</h4>
              <span class="last-time">{{ contact.lastTime }}</span>
            </div>
            <p class="last-message">{{ contact.lastMessage }}</p>
          </div>

          <span v-if="contact.unread" class="unread-badge">{{ contact.unread }}</span>
        </div>
      </div>
    </div>

    <!-- 右側:聊天視窗 -->
    <div class="chat-main">
      <div v-if="selectedContact" class="chat-container">
        <!-- 聊天標題列 -->
        <div class="chat-header">
          <div class="chat-user-info">
            <img :src="selectedContact.avatar" :alt="selectedContact.name" class="header-avatar">
            <div>
              <h3>{{ selectedContact.name }}</h3>
              <span class="status-text">{{ selectedContact.online ? '線上' : '離線' }}</span>
            </div>
          </div>
        </div>

        <!-- 聊天訊息區 -->
        <div class="messages-area" ref="messagesArea">
          <div
              v-for="message in currentMessages"
              :key="message.id"
              :class="['message-wrapper', message.isSelf ? 'self' : 'other']"
          >
            <div v-if="!message.isSelf" class="message-avatar">
              <img :src="selectedContact.avatar" :alt="selectedContact.name">
            </div>

            <div class="message-bubble">
              <p>{{ message.text }}</p>
              <span class="message-time">{{ message.time }}</span>
            </div>

            <div v-if="message.isSelf" class="message-avatar">
            </div>
          </div>
        </div>

        <!-- 輸入區 -->
        <div class="chat-input-area">
          <input
              v-model="newMessage"
              type="text"
              placeholder="輸入訊息..."
              @keyup.enter="sendMessage"
          >
          <button @click="sendMessage" class="send-btn">
            發送
          </button>
        </div>
      </div>

      <!-- 未選擇聊天時的提示 -->
      <div v-else class="empty-chat">
        <p>請選擇一個聊天對象開始對話</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '@/stores/chatStores';
import axios from 'axios';

const chatStore = useChatStore();
const API_URL = 'http://localhost:5275/api';  // 改成你的後端網址

interface Contact {
  chatRoomId: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  online: boolean;
  unread?: number;
}

interface Message {
  id: number;
  text: string;
  time: string;
  isSelf: boolean;
  senderUserId: string;
}

// 取得當前使用者 ID
const currentUserId = localStorage.getItem('userId') || '';

// 聯絡人列表
const contacts = ref<Contact[]>([]);

// 聊天記錄
// 是一個鍵值對
const messagesData = ref<Record<string, Message[]>>({});

const selectedContact = ref<Contact | null>(null);
const newMessage = ref('');

// 當前顯示的訊息
const currentMessages = computed(() => {
  if (!selectedContact.value) return [];
  return messagesData.value[selectedContact.value.chatRoomId] || [];
});

// 從後端取得聊天室列表
const fetchChatRooms = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/Chat/rooms`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('API Response:', response.data);

    // --- 修改開始 ---
    // 將後端資料轉換成前端格式
    contacts.value = response.data.map((room: any) => ({
      chatRoomId: room.chatRoomId,

      // 1. 改成抓後端算好的 "PartnerName" (對方名字)
      //    (注意：通常後端傳來的 JSON 會自動變小寫開頭，所以用 partnerName)
      name: room.partnerName || '未知使用者',

      // 2. 改成抓後端的 "PartnerAvatar" (對方頭像)
      //    邏輯：如果有頭像就用，沒有的話就給一張預設的灰人圖
      avatar: room.partnerAvatar
          ? `http://localhost:5275${room.partnerAvatar}`
          : 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
      // 要改成後端的網址圖片才不會壞掉
      lastMessage: '',
      lastTime: new Date(room.createdAt).toLocaleDateString(), // 順便幫你補上顯示時間
      online: false,
      unread: 0
    }));
    console.log(contacts.value);
    // --- 修改結束 ---
  } catch (error) {
    console.error('取得聊天室列表失敗:', error);
  }
};

// 從後端取得聊天記錄
const fetchMessages = async (chatRoomId: string) => {
  try {
    const token = localStorage.getItem('token');
    // 1. 搬運請求-> 透過房間ID獲取聊天記錄
    const response = await axios.get(`${API_URL}/Chat/messages/${chatRoomId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(response.data);
    // 2. 重新包裝
    // 轉換成前端方便用的
    messagesData.value[chatRoomId] = response.data.map((msg: any) => ({
      id: msg.id,
      text: msg.message,
      time: new Date(msg.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
      isSelf: msg.senderUserId === currentUserId,
      senderUserId: msg.senderUserId // 擴充用-> 未來群組聊天使用
    }));
  } catch (error) {
    console.error('取得訊息失敗:', error);
  }
};

// 選擇聯絡人
const selectContact = async (contact: Contact) => {
  // 1. 選中當前是誰
  // 這一行一執行右邊就會變成聊天內容區了
  selectedContact.value = contact
  // 已讀歸零(前端視覺效果而已)
  contact.unread = 0;

  // 載入聊天記錄
  await fetchMessages(contact.chatRoomId);
  // 也要告訴後端已讀
  await chatStore.markAsRead(contact.chatRoomId);
};

// 發送訊息
// 發送訊息
const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedContact.value) return;

  const chatRoomId = selectedContact.value.chatRoomId;
  const messageText = newMessage.value;

  // 【刪除原本在這裡的 tempMessage 和 push 邏輯】
  // 只保留發送到後端的部分
  try {
    await chatStore.sendMessage(chatRoomId, messageText);
    newMessage.value = ''; // 發送成功後清空輸入框
  } catch (error) {
    console.error('發送失敗:', error);
  }
};

// 處理接收到的新訊息
const handleReceiveMessage = (data: any) => {
  // 1. data是後端傳回來的原始包裹
  console.log('收到新訊息:', data);

  // 2. 重新包裝
  const newMsg: Message = {
    id: data.id,
    text: data.message,
    time: new Date(data.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    isSelf: data.senderUserId === currentUserId,
    senderUserId: data.senderUserId
  };

  // 3.找到正確的抽屜塞進去
  if (!messagesData.value[data.chatRoomId]) {
    // 如果沒有給他一個空的
    messagesData.value[data.chatRoomId] = [];
  }

  // 4. 防重複檢查,如果是自己發的後端還沒回傳可能已經顯示了,避免重複顯示
  const exists = messagesData.value[data.chatRoomId].some(m => m.id === data.id);
  if (!exists) {
    messagesData.value[data.chatRoomId].push(newMsg);
  }

  // 5. 更新左側列表最新訊息跟最新訊息時間
  const contact = contacts.value.find(c => c.chatRoomId === data.chatRoomId);
  if (contact) {
    contact.lastMessage = data.message;
    contact.lastTime = newMsg.time;

    // 6.如果當下沒在看,未讀數+1
    if (selectedContact.value?.chatRoomId !== data.chatRoomId && !newMsg.isSelf) {
      contact.unread = (contact.unread || 0) + 1;
    }
  }
};

// 頁面載入時的初始化
onMounted(async () => {
  // 1. 載入聊天室列表
  await fetchChatRooms();

  // 2. 連線 SignalR
  await chatStore.connect();

  // 3. 監聽接收訊息
  if (chatStore.connection) {
    chatStore.connection.on('ReceiveMessage', handleReceiveMessage);
  }
});

// 頁面卸載時斷線
onUnmounted(async () => {
  if (chatStore.connection) {
    chatStore.connection.off('ReceiveMessage', handleReceiveMessage);
  }
  await chatStore.disconnect();
});
</script>

<style scoped>
.chat-page {
  display: flex;
  height: calc(100vh - 60px);
  background: #f5f5f5;
}

.contacts-sidebar {
  width: 320px;
  background: white;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.sidebar-header h2 {
  font-size: 20px;
  color: #333;
  margin: 0;
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 1px solid #f5f5f5;
  position: relative;
}

.contact-item:hover {
  background: #f8f8f8;
}

.contact-item.active {
  background: #fff0f5;
  border-left: 3px solid #fb7299;
}

.contact-avatar {
  position: relative;
  margin-right: 12px;
}

.contact-avatar img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #4ade80;
  border: 2px solid white;
  border-radius: 50%;
}

.contact-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;   /* 讓姓名和預覽訊息上下排列 */
  justify-content: center;  /* 重點！這會讓文字區塊垂直置中，與頭像平行 */
  gap: 4px;                 /* 增加姓名與訊息之間的一點點小間距 */
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.contact-name {
  font-size: 17px;          /* 姓名大一點，看起來更清楚 */
  font-weight: 600;
  color: #333;
  margin: 0;
}

.last-time {
  font-size: 12px;
  color: #999;
}

.last-message {
  font-size: 13px;
  color: #666;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unread-badge {
  background: #fb7299;
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 3px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  background: white;
}

.chat-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
}

.chat-user-info h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.status-text {
  font-size: 13px;
  color: #4ade80;
}

.messages-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f8f9fa;
}

.message-wrapper {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
}

.message-wrapper.self {
  justify-content: flex-end;
}

.message-avatar img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.message-bubble {
  max-width: 60%;
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
}

.message-wrapper.other .message-bubble {
  background: white;
  border: 1px solid #eee;
  color: #333;
}

.message-wrapper.self .message-bubble {
  background: #fb7299;
  color: white;
}

.message-bubble p {
  margin: 0 0 5px 0;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
}

.chat-input-area {
  display: flex;
  padding: 15px 20px;
  border-top: 1px solid #eee;
  background: white;
  gap: 10px;
}

.chat-input-area input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #eee;
  border-radius: 25px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
}

.chat-input-area input:focus {
  border-color: #fb7299;
}

.send-btn {
  padding: 12px 28px;
  background: #fb7299;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.send-btn:hover {
  background: #e65a84;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 114, 153, 0.3);
}

.empty-chat {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 16px;
}
</style>
