// 创建样式
const style = document.createElement('style');
style.textContent = `
  #sidebarContainer {
    position: absolute;
    top: 0;
    right: -180px; /* ✅ 向右再移出 20px，避免重叠 */
    bottom: 0;
    width: 160px;
    background: rgba(255, 255, 255, 0.9);
    color: #000;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    border-left: 2px solid #ddd;
    z-index: 10;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
    border-top-right-radius: 16px;
    border-bottom-right-radius: 16px;
    border-top-left-radius: 16px;
    border-bottom-left-radius: 16px;
  }

  #sidebarContainer.hidden {
    display: none;
  }

  #sidebarContainer button {
    margin: 5px 0;
    width: 120px;
  }

  #sidebarContainer .color {
    width: 32px;
    height: 32px;
    margin: 3px;
    border: 1px solid #000;
    cursor: pointer;
  }
`;
document.head.appendChild(style);


// 创建 sidebar DOM
const sidebar = document.createElement('div');
sidebar.id = 'sidebarContainer';
sidebar.classList.add('hidden');
sidebar.innerHTML = `
  <button id="cancelBtn">CANCEL</button>
  <button id="saveBtn">SAVE</button>
  <div>Currently Drawing</div>
  <button id="brushBtn">🖌️ Brush</button>
  <button id="eraserBtn">🧹 Eraser</button>
  <button id="undoBtn">⎌ Undo</button>
  <button id="redoBtn">⎌ Redo</button>
  <input type="range" id="sizeSlider" min="1" max="50" value="10">
  <div class="colors">
    <div class="color" style="background: #00ff00;" data-color="#00ff00"></div>
    <div class="color" style="background: #ff00ff;" data-color="#ff00ff"></div>
    <div class="color" style="background: #ff00ff;" data-color="#ff00ff"></div>
    <div class="color" style="background: #00ffff;" data-color="#00ffff"></div>
  </div>
`;

// ⏺️ 插入 sidebar 到 .twod-group（容错重试机制）
function ensureSidebarIn2D() {
  const container = document.querySelector('.twod-group');
  if (container && !container.contains(sidebar)) {
    container.appendChild(sidebar);
    console.log('✅ Sidebar 已插入到 .twod-group');
  }
}

// 开始观察 DOM 变化（例如 sidebar 被误删）
const observer = new MutationObserver(() => {
  ensureSidebarIn2D();
});
observer.observe(document.body, { childList: true, subtree: true });

// ⏺️ 全局点击委托逻辑
document.addEventListener('click', (e) => {
  const annotateBtn = document.querySelector('.smart-btn.annotate');
  const target = e.target;

  const isInAnnotate = annotateBtn && (target === annotateBtn || annotateBtn.contains(target));
  const isInSidebar = target.closest && target.closest('#sidebarContainer') !== null;

  if (isInAnnotate) {
    console.log('🟢 点击 Annotate 按钮或子元素');
    e.stopPropagation();
    ensureSidebarIn2D(); // 保障 sidebar 存在
    sidebar.classList.toggle('hidden');
    console.log('Sidebar 当前状态:', sidebar.classList.contains('hidden') ? '隐藏' : '显示');
    return;
  }

  // ✅ 关键修复：阻止 sidebar 被点时触发全局清空逻辑
  if (isInSidebar) {
    console.log('🟡 点击 Sidebar 内部，阻止传播并保持显示');
    e.stopPropagation();      // ✅ 阻止事件继续冒泡
    e.preventDefault();       // ✅ 可选，防止表单元素等默认行为
    return;
  }

  // 空白处关闭 sidebar
  if (!sidebar.classList.contains('hidden')) {
    console.log('🔴 点击空白处，关闭 Sidebar');
    sidebar.classList.add('hidden');
  }
}, true); // ✅ 使用捕获阶段确保先执行



// Cancel 按钮点击隐藏
sidebar.querySelector('#cancelBtn').addEventListener('click', () => {
  console.log('🟠 点击 CANCEL');
  sidebar.classList.add('hidden');
});
