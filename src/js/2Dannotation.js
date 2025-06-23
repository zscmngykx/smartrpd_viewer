document.addEventListener('DOMContentLoaded', () => {
      // 获取 URL 中的 ID 参数
      const urlParams = new URLSearchParams(window.location.search);
      const encryptedId = urlParams.get('id') || 'N/A';
      document.getElementById('decrypted-id').textContent = encryptedId;

      // 从 localStorage 获取合成的背景图
      const composedImg = localStorage.getItem('annotateBackground');
      if (composedImg) {
        const img = new Image();
        img.src = composedImg;
        img.alt = '合成后的牙图';
        document.getElementById('image-preview-area').appendChild(img);
      } else {
        const placeholder = document.createElement('p');
        placeholder.textContent = '⚠️ 未能从 localStorage 加载合成图像，请先在 3D 页面生成图像。';
        placeholder.style.color = 'red';
        document.getElementById('image-preview-area').appendChild(placeholder);
      }
    });