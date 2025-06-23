document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const encryptedId = urlParams.get('id') || 'N/A';
  document.getElementById('decrypted-id').textContent = encryptedId;

  const composedImg = localStorage.getItem(`annotateBackground_${encryptedId}`);
  const previewArea = document.getElementById('image-preview-area');
  previewArea.innerHTML = '';

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
