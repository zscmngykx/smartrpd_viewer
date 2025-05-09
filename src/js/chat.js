// 引入加密解密函数
import { lol } from '../crypt.js';

// 获取 DOM 元素
const chatBox = document.getElementById('chat-box');
const textInput = document.getElementById('textInput');
const sendBtn = document.getElementById('sendBtn');
const uploadBtn = document.getElementById('uploadBtn');
const imageInput = document.getElementById('imageInput');

let messages = [];
let pendingImageBase64 = null;

// 从 URL 获取加密 caseId
const encryptedCaseId = new URLSearchParams(window.location.search).get('id');
console.log('🔐 Encrypted caseId from URL:', encryptedCaseId);

if (!encryptedCaseId) {
    alert('Missing case ID');
    throw new Error('Missing case ID');
}

const caseId = lol(encryptedCaseId);
console.log('🔓 Decrypted caseId:', caseId);

if (!caseId) {
    alert('Invalid case ID');
    throw new Error('Invalid case ID');
}

// 🔍 通过 base64 前缀推测图片 MIME 类型
function detectImageMime(base64) {
    const signature = base64.substring(0, 5);
    if (signature.startsWith('/9j/')) return 'image/jpeg';
    if (signature.startsWith('iVBOR')) return 'image/png';
    if (signature.startsWith('R0lG')) return 'image/gif';
    if (signature.startsWith('UklGR')) return 'image/webp';
    return 'image/jpeg'; // 默认回退
}

// 获取后端笔记
async function fetchNotes() {
    console.log(`📡 Fetching notes for caseId: ${caseId}`);
    try {
        const response = await fetch(`https://live.api.smartrpdai.com/api/smartrpd/notes/get/${caseId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        if (response.ok) {
            const notes = await response.json();
            notes.reverse(); 
            messages = notes.map(note => {
                const isImage = !!note.image_base64;
                const mimeType = isImage ? detectImageMime(note.image_base64) : null;
                const content = isImage
                    ? `<img src="data:${mimeType};base64,${note.image_base64}" alt="Note Image" class="uploaded-image" />`
                    : note.content;
                return {
                    content,
                    author: note.author_username,
                    timestamp: new Date(note.created_at).toLocaleString(),
                };
            });
            displayMessages();
        } else {
            console.error('❌ Failed to fetch notes:', await response.text());
        }
    } catch (err) {
        console.error('❌ Error fetching notes:', err);
    }
}

// 显示消息
function displayMessages() {
    chatBox.innerHTML = '';
    messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');

        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        contentElement.innerHTML = msg.content;
        messageElement.appendChild(contentElement);

        const timestampElement = document.createElement('div');
        timestampElement.classList.add('timestamp');
        timestampElement.textContent = msg.timestamp;
        messageElement.appendChild(timestampElement);

        const authorElement = document.createElement('div');
        authorElement.classList.add('author');
        authorElement.textContent = msg.author;
        messageElement.appendChild(authorElement);

        chatBox.appendChild(messageElement);
    });

    // ✅ 等图片加载完再 scroll 到底
    const images = chatBox.querySelectorAll('img');
    if (images.length > 0) {
        const lastImg = images[images.length - 1];
        lastImg.onload = () => {
            chatBox.scrollTop = chatBox.scrollHeight;
        };
    } else {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}


// 创建笔记（提交给后端）
async function createNote(content, imageBase64 = null) {
    console.log('📝 Creating note:', content || '[Image only]');
    try {
        const response = await fetch('https://live.api.smartrpdai.com/api/smartrpd/notes/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                case_int_id: caseId,
                author_username: 'faid',
                content: content || null,
                image_base64: imageBase64 || null,
            })
        });

        if (response.ok) {
            console.log('✅ Note created');
            fetchNotes();
        } else {
            console.error('❌ Failed to create note:', response.status);
        }
    } catch (err) {
        console.error('❌ Error creating note:', err);
    }
}

// 点击发送
async function handleSendMessage() {
    const message = textInput.value.trim();
    if (message || pendingImageBase64) {
        await createNote(message, pendingImageBase64);
        textInput.value = '';
        imageInput.value = '';
        pendingImageBase64 = null;
        messages = messages.filter(m => m.author !== 'Click send to upload image');
        fetchNotes();
    }
}

// 图片上传 → 只预览
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const base64 = e.target.result.split(',')[1];
            const mime = file.type || 'image/jpeg';
            pendingImageBase64 = base64;
            console.log('🖼️ 图片预览加载成功');

            // 移除已有预览图
            messages = messages.filter(m => m.author !== 'Click send to upload image');

            const previewHtml = `
                <img src="data:${mime};base64,${base64}" alt="Preview" class="uploaded-image" />
                <div style="text-align:right; margin-top:4px;">
                    <button class="cancel-preview" onclick="clearImage()">cancel</button>
                </div>
            `;

            messages.push({
                content: previewHtml,
                author: 'Click send to upload image',
                timestamp: new Date().toLocaleString(),
            });

            displayMessages();
            imageInput.value = ''; // 允许重复选择
        };
        reader.readAsDataURL(file);
    }
}

// 取消图片预览
window.clearImage = function () {
    pendingImageBase64 = null;
    messages = messages.filter(m => m.author !== 'Click send to upload image');
    displayMessages();
    imageInput.value = '';
};

// 事件绑定
sendBtn.addEventListener('click', handleSendMessage);
uploadBtn.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', handleImageUpload);
fetchNotes();

// 图片点击放大
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');

chatBox.addEventListener('click', function (e) {
    if (e.target.tagName === 'IMG') {
        modalImage.src = e.target.src;
        imageModal.style.display = 'flex';
    }
});

imageModal.addEventListener('click', function () {
    imageModal.style.display = 'none';
});
