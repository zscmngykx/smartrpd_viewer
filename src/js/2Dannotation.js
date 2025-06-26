document.addEventListener('DOMContentLoaded', () => {
  // ✅ 获取加密 ID
  const urlParams = new URLSearchParams(window.location.search);
  const encryptedId = urlParams.get('id') || 'N/A';

  // ✅ 更新页面中展示的 ID
  const span = document.getElementById("decrypted-id");
  if (span) {
    span.textContent = decryptedId;
  }


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

    img.onload = () => {
      // 设置容器样式
      previewArea.style.position = 'relative';

      // 插入底图
      img.style.position = 'absolute';
      img.style.top = '0';
      img.style.left = '0';
      img.style.zIndex = '1';
      previewArea.appendChild(img);

      // 创建 Canvas 元素
      const canvasEl = document.createElement('canvas');
      canvasEl.id = 'fabric-canvas';
      canvasEl.width = img.width;
      canvasEl.height = img.height;
      canvasEl.style.position = 'absolute';
      canvasEl.style.top = '0';
      canvasEl.style.left = '0';
      canvasEl.style.zIndex = '2';
      previewArea.appendChild(canvasEl);

      // 初始化 Fabric 画布
      const canvas = new fabric.Canvas('fabric-canvas');
      window.myCanvas = canvas;

      // 默认开启画笔
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = document.getElementById('colorPicker').value;
      canvas.freeDrawingBrush.width = parseInt(document.getElementById('sizeSlider').value, 10);

      // 绑定画笔按钮
      document.getElementById('brushBtn').addEventListener('click', () => {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = document.getElementById('colorPicker').value;
        canvas.freeDrawingBrush.width = parseInt(document.getElementById('sizeSlider').value, 10);
      });

      // 绑定钢笔按钮（同画笔）
      document.getElementById('penBtn').addEventListener('click', () => {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      });

      // 绑定橡皮擦按钮
      document.getElementById('eraserBtn').addEventListener('click', () => {
        canvas.isDrawingMode = false;
        canvas.on('mouse:down', function(opt) {
          const target = opt.target;
          if (target) {
            canvas.remove(target);
          }
        });
      });

      // 绑定文本按钮
      document.getElementById('textBtn').addEventListener('click', () => {
        canvas.isDrawingMode = false;
        const text = new fabric.IText('Text here', {
          left: 100,
          top: 100,
          fill: document.getElementById('colorPicker').value,
          fontSize: 20
        });
        canvas.add(text).setActiveObject(text);
      });

      // 绑定清空按钮
      document.getElementById('clearBtn').addEventListener('click', () => {
        canvas.clear();
      });

      // 绑定撤销按钮（可选扩展）
      document.getElementById('undoBtn').addEventListener('click', () => {
        const objs = canvas._objects;
        if (objs.length > 0) {
          canvas.remove(objs[objs.length - 1]);
        }
      });

      // 重做（可自行维护栈）
      document.getElementById('redoBtn').addEventListener('click', () => {
        alert('Redo 需手动扩展栈记录');
      });

      // 改变画笔颜色
      document.getElementById('colorPicker').addEventListener('input', (e) => {
        canvas.freeDrawingBrush.color = e.target.value;
      });

      // 改变画笔粗细
      document.getElementById('sizeSlider').addEventListener('input', (e) => {
        canvas.freeDrawingBrush.width = parseInt(e.target.value, 10);
      });

    };
  } else {
    const placeholder = document.createElement('p');
    placeholder.textContent = '⚠️ 未能从 localStorage 加载合成图像，请先在 3D 页面生成图像。';
    placeholder.style.color = 'red';
    previewArea.appendChild(placeholder);
  }
});