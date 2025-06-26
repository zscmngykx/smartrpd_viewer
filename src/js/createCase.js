// 顶部引入模块
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

  // ✅ 全局状态变量（必须提前声明）
  let existingUsers = [];  // 当前案例已有的共享用户
  let addedUsers = [];     // 用户后续添加的新用户
  let selectedUser = null; // 当前选中的待添加用户（搜索结果）

document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.querySelector('.create-case');
  const modal = document.getElementById('caseModal');
  const closeBtn = document.getElementById('closeCaseModal');

 
  const jawUploadInput = document.getElementById('jawUploadInput');
  const jawContainer = document.getElementById('uploadedJawModels');

  const refUploadBtn = document.getElementById('addRefImageBtn');
  const refUploadInput = document.getElementById('refImageInput');
  const refContainer = document.getElementById('uploadedReferenceImages');

  const caseNameInput = document.getElementById('caseName');
  const requestDateInput = document.getElementById('requestDate');
  const cancelBtn = document.querySelector('.cancel-btn');
  const startBtn = document.querySelector('.start-btn');
  const inviteBtn = document.querySelector('.invite-btn');
  const userAccessModal = document.getElementById('userAccessModal');
  const closeUserAccessModal = document.getElementById('closeUserAccessModal');
  const cancelInviteBtn = document.getElementById('cancelInviteBtn');
  const userSearchInput = document.getElementById('userSearchInput');



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
  if (jawUploadInput && jawContainer) {
    jawContainer.querySelectorAll('.upload-placeholder').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTarget = btn;
        jawUploadInput.click();
      });
    });

    jawUploadInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file || !activeTarget) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const loader = new STLLoader();
          const geometry = loader.parse(e.target.result);
          const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(197 / 255, 173 / 255, 137 / 255),
            opacity: 1
          });

          const mesh = new THREE.Mesh(geometry, material);

          const scene = new THREE.Scene();
          const ambientLight = new THREE.AmbientLight(0xffffff, 1);
          scene.add(ambientLight);

          const lights = [
            new THREE.DirectionalLight(0xffffff, 1),
            new THREE.DirectionalLight(0xffffff, 1),
            new THREE.DirectionalLight(0xffffff, 1),
            new THREE.DirectionalLight(0xffffff, 1)
          ];

          lights[0].position.set(0, 0, 1);
          lights[1].position.set(0, 0, -1);
          lights[2].position.set(-1, 0, 0);
          lights[3].position.set(1, 0, 0);

          lights.forEach(light => scene.add(light));
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
          wrapper.dataset.jaw = activeTarget.dataset.jaw;

          const img = document.createElement('img');
          img.src = imgData;
          img.style.width = '100px';

          const remove = document.createElement('div');
          remove.className = 'remove-model';
          remove.textContent = '×';
          remove.onclick = () => {
            const placeholder = document.createElement('div');
            placeholder.className = 'upload-placeholder';
            placeholder.dataset.jaw = wrapper.dataset.jaw;
            placeholder.innerHTML = '<span class="plus-icon">＋</span>';
            placeholder.addEventListener('click', () => {
              activeTarget = placeholder;
              jawUploadInput.click();
            });
            wrapper.replaceWith(placeholder);
          };

          wrapper.appendChild(img);
          wrapper.appendChild(remove);
          wrapper.file = file;
          activeTarget.replaceWith(wrapper);

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

  if (startBtn) {
  startBtn.addEventListener('click', () => {
    const caseName = caseNameInput?.value?.trim();

    if (!caseName) {
      alert('Please enter case name.');
      return;
    }

    const loggedInUser = getLoggedInUser();
    if (!loggedInUser || !loggedInUser.uuid) {
      alert('User not logged in.');
      return;
    }

    const machine_id = "3a0df9c37b50873c63cebecd7bed73152a5ef616";
    const uuid = loggedInUser.uuid;
    const hasUpper = !!jawContainer.querySelector('.uploaded-model[data-jaw="upper"]');
    const hasLower = !!jawContainer.querySelector('.uploaded-model[data-jaw="lower"]');

    const payload = [
      {
        machine_id,
        uuid
      },
      {
        case_id: caseName,
        upper_insertion_angle_x: 0,
        upper_insertion_angle_y: 0,
        upper_insertion_angle_z: 0,
        lower_insertion_angle_x: 0,
        lower_insertion_angle_y: 0,
        lower_insertion_angle_z: 0,
        process_upper: hasUpper ? 1 : 0,
        process_lower: hasLower ? 1 : 0
      }
    ];

    fetch("https://live.api.smartrpdai.com/api/smartrpd/case", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
        return res.json();
      })
      .then(async data => {
        console.log('✅ Case uploaded successfully:', data);

        const case_id = caseName;

        // ⚠️ 获取 caseIntID（通过 case/findall/get 接口）
        const caseIntID = data.id;

        // 📤 上传 Upper STL（如有）
        if (hasUpper) {
          const upperEl = jawContainer.querySelector('.uploaded-model[data-jaw="upper"]');
          await uploadSTL('upper_jaw', upperEl, machine_id, uuid, case_id, caseIntID);
        }

        // 📤 上传 Lower STL（如有）
        if (hasLower) {
          const lowerEl = jawContainer.querySelector('.uploaded-model[data-jaw="lower"]');
          await uploadSTL('lower_jaw', lowerEl, machine_id, uuid, case_id, caseIntID);
        }

        // 📤 遍历上传 Reference 图片（暂时禁用）
        // const refImages = refContainer.querySelectorAll('img');
        // for (let i = 0; i < refImages.length; i++) {
        //   const base64 = refImages[i].src;
        //   const filename = `ref_image_${i + 1}.png`;
        //   await uploadReferenceImage(machine_id, uuid, case_id, caseIntID, filename, base64);
        // }

        alert('Case created and STL uploaded!');
        window.location.reload();
      })

      .catch(err => {
        console.error('❌ Upload failed:', err);
        alert('Failed to create case.');
      });
  });
  }
  if (inviteBtn) {
    inviteBtn.addEventListener('click', async () => {
      const caseName = caseNameInput?.value?.trim();

      if (!caseName) {
        alert('Please enter case name.');
        return;
      }

      const loggedInUser = getLoggedInUser();
      if (!loggedInUser || !loggedInUser.uuid) {
        alert('User not logged in.');
        return;
      }

      const machine_id = "3a0df9c37b50873c63cebecd7bed73152a5ef616";
      const uuid = loggedInUser.uuid;
      const hasUpper = !!jawContainer.querySelector('.uploaded-model[data-jaw="upper"]');
      const hasLower = !!jawContainer.querySelector('.uploaded-model[data-jaw="lower"]');

      // ✅ Step 1: 创建 Case
      const payload = [
        {
          machine_id,
          uuid
        },
        {
          case_id: caseName,
          upper_insertion_angle_x: 0,
          upper_insertion_angle_y: 0,
          upper_insertion_angle_z: 0,
          lower_insertion_angle_x: 0,
          lower_insertion_angle_y: 0,
          lower_insertion_angle_z: 0,
          process_upper: hasUpper ? 1 : 0,
          process_lower: hasLower ? 1 : 0
        }
      ];

      let caseIntID = null;

      try {
        const res = await fetch("https://live.api.smartrpdai.com/api/smartrpd/case", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
        const data = await res.json();
        caseIntID = data.id;
        console.log("✅ Case created:", caseIntID);
      } catch (err) {
        console.error("❌ Failed to create case", err);
        alert("Failed to create case.");
        return;
      }

      // ✅ Step 2: 上传 STL（如有）
      try {
        if (hasUpper) {
          const upperEl = jawContainer.querySelector('.uploaded-model[data-jaw="upper"]');
          await uploadSTL('upper_jaw', upperEl, machine_id, uuid, caseName, caseIntID);
        }
        if (hasLower) {
          const lowerEl = jawContainer.querySelector('.uploaded-model[data-jaw="lower"]');
          await uploadSTL('lower_jaw', lowerEl, machine_id, uuid, caseName, caseIntID);
        }
      } catch (err) {
        console.error("❌ STL Upload failed", err);
      }

      // ✅ Step 3: 打开邀请弹窗
      userAccessModal.classList.remove('hidden');
      userAccessModal.classList.add('show');
      caseNameDisplay.textContent = caseName;

      window._inviteContext = {
        caseName,
        caseIntID,
        uuid,
        machine_id
      };

      // ✅ Step 4: 获取当前 Case 所有成员（用正确字段 caseIntID + case_int_id）
      try {
        const rolePayload = [
          { machine_id, uuid, caseIntID },
          { case_int_id: caseIntID }
        ];

        console.log("📤 Role request payload:", rolePayload);

        const roleRes = await fetch("https://live.api.smartrpdai.com/api/smartrpd/role/all/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rolePayload)
        });

        const text = await roleRes.text();
        console.log("📥 Role API response:", text);

        if (!roleRes.ok) throw new Error(`Role fetch failed: ${roleRes.status}`);
        const roleData = JSON.parse(text);
        existingUsers = roleData;
        renderSharedUserList();
      } catch (err) {
        console.error("❌ Failed to fetch roles", err);
        sharedUserList.innerHTML = '<li>Failed to load users.</li>';
      }

      // ✅ Step 5: 初始化 UI 状态
      addedUsers = [];
      selectedUser = null;
      userSearchInput.value = '';
      userSearchResults.innerHTML = '';
      addUserBtn.disabled = true;
    });
  }
  if (closeUserAccessModal) {
    closeUserAccessModal.addEventListener('click', () => {
      userAccessModal.classList.add('hidden');
      userAccessModal.classList.remove('show');
    });
  }

  // ⛔ CANCEL 按钮：只清空搜索框，不关闭弹窗，不清空列表
  if (cancelInviteBtn) {
    cancelInviteBtn.addEventListener('click', () => {
      userSearchInput.value = '';
    });
  }
  

});

function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem('loggedInUser'));
  } catch (err) {
    console.warn('无法解析 loggedInUser', err);
    return null;
  }
}

async function uploadSTL(jawType, wrapperEl, machine_id, uuid, case_id, caseIntID) {
  if (!wrapperEl || !wrapperEl.file) {
    console.warn(`⚠️ No STL file found for ${jawType}`);
    return;
  }

  const file = wrapperEl.file;
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = async function (e) {
      try {
        const arrayBuffer = e.target.result;
        const uint8Array = new Uint8Array(arrayBuffer);
        const binaryStr = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
        const base64 = btoa(binaryStr);

        const payload = [
          {
            machine_id,
            uuid,
            caseIntID
          },
          {
            case_id,
            type: jawType, // "upper_jaw" or "lower_jaw"
            data: base64,
            filename: file.name || `${jawType}.stl`
          }
        ];

        // ✅ 使用 /stl/raw 替代 /stl
        const res = await fetch("https://live.api.smartrpdai.com/api/smartrpd/stl/raw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          console.error(`❌ Failed to upload ${jawType}`, res.status);
        } else {
          console.log(`✅ Uploaded ${jawType} STL`);
        }

        resolve();
      } catch (err) {
        console.error(`❌ Error uploading ${jawType}:`, err);
        resolve();
      }
    };

    reader.readAsArrayBuffer(file);
  });
}


function renderSharedUserList() {
  const container = document.getElementById('sharedUserList');

  if (!container) {
    console.warn("⚠️ Missing element: #sharedUserList");
    return;
  }

  // 清空旧内容
  container.innerHTML = '';

  // 如果没有用户，显示提示
  if (!existingUsers || existingUsers.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'No users found.';
    emptyItem.style.color = '#888';
    emptyItem.style.fontStyle = 'italic';
    container.appendChild(emptyItem);
    return;
  }

  // 遍历用户并渲染每个条目
  existingUsers.forEach(user => {
    const li = document.createElement('li');
    li.className = 'shared-user-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'user-name';
    nameSpan.textContent = `👤 ${user.username}`;

    const roleSpan = document.createElement('span');
    roleSpan.className = 'user-role';
    roleSpan.textContent = user.role;

    li.appendChild(nameSpan);
    li.appendChild(roleSpan);
    container.appendChild(li);
  });
}



// async function uploadReferenceImage(machine_id, uuid, case_id, caseIntID, filename, base64data) {
//   const payload = [
//     { machine_id, uuid, caseIntID },
//     { case_id, filenames: filename, data: base64data }
//   ];

//   const res = await fetch("https://live.api.smartrpdai.com/api/smartrpd/noticeboard/view", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload)
//   });

//   if (!res.ok) {
//     console.error(`Upload image failed for ${filename}`);
//   } else {
//     console.log(`✅ Uploaded 2D image: ${filename}`);
//   }
// }
