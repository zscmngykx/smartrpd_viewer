// src/js/sidebar.js

// 创建侧边栏元素
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
document.body.appendChild(sidebar);

// 监听 Annotate 按钮点击
document.addEventListener('DOMContentLoaded', () => {
  const annotateBtn = document.querySelector('.smart-btn.annotate');
  if (!annotateBtn) return;

  annotateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.remove('hidden');
  });
});

// 点击空白处关闭
document.addEventListener('click', (e) => {
  const annotateBtn = document.querySelector('.smart-btn.annotate');
  if (!sidebar.contains(e.target) && e.target !== annotateBtn) {
    sidebar.classList.add('hidden');
  }
});

// CANCEL 按钮关闭
sidebar.querySelector('#cancelBtn').addEventListener('click', () => {
  sidebar.classList.add('hidden');
});
