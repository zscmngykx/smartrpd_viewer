document.addEventListener('DOMContentLoaded', () => {
  // ✅ 获取加密 ID
  const urlParams = new URLSearchParams(window.location.search);
  const encryptedId = urlParams.get('id') || 'N/A';

  // ✅ 更新页面中展示的 ID
  document.getElementById('decrypted-id').textContent = encryptedId;

  // ✅ 构造 localStorage 的 key
  const storageKey = `annotateBackground_${encryptedId}`;

  // ✅ 获取图像容器并清空（防止多次渲染）
  const previewArea = document.getElementById('image-preview-area');
  previewArea.innerHTML = '';

  // ✅ 从 localStorage 加载图像
  const composedImg = localStorage.getItem(storageKey);

  if (composedImg) {
    const img = new Image();
    img.src = composedImg;
    img.alt = '合成后的牙图';
    previewArea.appendChild(img);
  } else {
    const placeholder = document.createElement('p');
    placeholder.textContent = '⚠️ 未能从 localStorage 加载合成图像，请先在 3D 页面生成图像。';
    placeholder.style.color = 'red';
    previewArea.appendChild(placeholder);
  }
});
