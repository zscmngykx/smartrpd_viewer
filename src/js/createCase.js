// 顶部引入模块
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.querySelector('.create-case');
  const modal = document.getElementById('caseModal');
  const closeBtn = document.getElementById('closeCaseModal');

  // 打开弹窗
  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      modal.classList.add('show');
      modal.classList.remove('hidden');
    });
  }

  // 关闭弹窗
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('show');
      modal.classList.add('hidden');
    });
  }

  // 点击遮罩关闭
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
      modal.classList.add('hidden');
    }
  });

  // STL 上传与渲染逻辑
  const jawUploadBtn = document.getElementById('addJawModelBtn');
  const jawUploadInput = document.getElementById('jawUploadInput');
  const jawContainer = document.getElementById('uploadedJawModels');

  if (!jawUploadBtn || !jawUploadInput || !jawContainer) {
    console.warn("STL 上传区域缺少必要元素");
    return;
  }

  jawUploadBtn.addEventListener('click', () => {
    jawUploadInput.click();
  });

  jawUploadInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const loader = new STLLoader();
      const geometry = loader.parse(e.target.result);
      const material = new THREE.MeshNormalMaterial();
      const mesh = new THREE.Mesh(geometry, material);

      const scene = new THREE.Scene();
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(1, 1, 1).normalize();
      scene.add(light);
      scene.add(mesh);

      geometry.computeBoundingBox();
      const center = geometry.boundingBox.getCenter(new THREE.Vector3());
      mesh.position.sub(center);

      const width = 100;
      const height = 100;
      const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
      camera.position.z = 100;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setClearColor(0xffffff);

      renderer.render(scene, camera);
      const imgData = renderer.domElement.toDataURL();

      // 替换视图
      jawContainer.innerHTML = '';

      const wrapper = document.createElement('div');
      wrapper.className = 'uploaded-model';

      const img = document.createElement('img');
      img.src = imgData;
      img.style.width = '100px';

      const remove = document.createElement('div');
      remove.className = 'remove-model';
      remove.textContent = '×';
      remove.onclick = () => {
        // 恢复上传按钮
        jawContainer.innerHTML = '';
        const newBtn = jawUploadBtn.cloneNode(true);
        newBtn.addEventListener('click', () => jawUploadInput.click());
        jawContainer.appendChild(newBtn);
      };

      wrapper.appendChild(img);
      wrapper.appendChild(remove);
      jawContainer.appendChild(wrapper);

      // ✅ 最关键：重置 input，让同一个文件再次触发 change
      jawUploadInput.value = '';

    } catch (err) {
      console.error("STL 解析失败：", err);
    }
  };

  reader.readAsArrayBuffer(file);
  });
});
