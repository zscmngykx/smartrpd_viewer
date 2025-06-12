// 顶部引入模块
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.querySelector('.create-case');
  const modal = document.getElementById('caseModal');
  const closeBtn = document.getElementById('closeCaseModal');

  const jawUploadBtn = document.getElementById('addJawModelBtn');
  const jawUploadInput = document.getElementById('jawUploadInput');
  const jawContainer = document.getElementById('uploadedJawModels');

  const refUploadBtn = document.getElementById('addRefImageBtn');
  const refUploadInput = document.getElementById('refImageInput');
  const refContainer = document.getElementById('uploadedReferenceImages');

  const caseNameInput = document.getElementById('caseName');
  const requestDateInput = document.getElementById('requestDate');
  const cancelBtn = document.querySelector('.cancel-btn');

  let activeTarget = null;
  const uploadLimit = 2;

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

  /*** 👇 STL 上传逻辑（左边，最多两个） ***/
  if (jawUploadBtn && jawUploadInput && jawContainer) {
    jawUploadBtn.addEventListener('click', () => {
      activeTarget = jawUploadBtn;
      jawUploadInput.click();
    });

    function createUploadBtn() {
      const newBtn = jawUploadBtn.cloneNode(true);
      newBtn.id = ''; // 防止重复 ID
      newBtn.addEventListener('click', () => {
        activeTarget = newBtn;
        jawUploadInput.click();
      });
      return newBtn;
    }

    jawUploadInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file || !activeTarget) return;

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

          const wrapper = document.createElement('div');
          wrapper.className = 'uploaded-model';

          const img = document.createElement('img');
          img.src = imgData;
          img.style.width = '100px';

          const remove = document.createElement('div');
          remove.className = 'remove-model';
          remove.textContent = '×';
          remove.onclick = () => {
            wrapper.replaceWith(createUploadBtn());
          };

          wrapper.appendChild(img);
          wrapper.appendChild(remove);
          activeTarget.replaceWith(wrapper);

          const currentUploadBtns = jawContainer.querySelectorAll('.upload-placeholder');
          if (jawContainer.querySelectorAll('.uploaded-model').length + currentUploadBtns.length < uploadLimit) {
            const newBtn = createUploadBtn();
            jawContainer.appendChild(newBtn);
          }

          jawUploadInput.value = '';
        } catch (err) {
          console.error("STL 解析失败：", err);
        }
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /*** 👇 PNG/JPG 图片上传逻辑（右边，无限上传） ***/
  if (refUploadBtn && refUploadInput && refContainer) {
    refUploadBtn.addEventListener('click', () => {
      refUploadInput.click();
    });

    refUploadInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file || !file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        const wrapper = document.createElement('div');
        wrapper.className = 'uploaded-model';

        const img = document.createElement('img');
        img.src = e.target.result;

        const remove = document.createElement('div');
        remove.className = 'remove-model';
        remove.textContent = '×';
        remove.onclick = () => wrapper.remove();

        wrapper.appendChild(img);
        wrapper.appendChild(remove);

        refContainer.insertBefore(wrapper, refUploadBtn.nextSibling);
      };

      reader.readAsDataURL(file);
    });
  }

  /*** 👇 取消按钮清空状态逻辑 ***/
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      // 清空输入框
      caseNameInput.value = '';
      requestDateInput.value = '';

      // 清空 STL 上传区
      jawContainer.innerHTML = '';
      const resetJawBtn = jawUploadBtn.cloneNode(true);
      resetJawBtn.id = 'addJawModelBtn';
      resetJawBtn.addEventListener('click', () => {
        activeTarget = resetJawBtn;
        jawUploadInput.click();
      });
      jawContainer.appendChild(resetJawBtn);

      // 清空图片上传区
      refContainer.innerHTML = '';
      const resetRefBtn = refUploadBtn.cloneNode(true);
      resetRefBtn.id = 'addRefImageBtn';
      resetRefBtn.addEventListener('click', () => {
        refUploadInput.click();
      });
      refContainer.appendChild(resetRefBtn);
    });
  }
});
