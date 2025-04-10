function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  window.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById("annotation-chat");
    const chatIcon = document.getElementById("chat-icon");
  
    if (!chatBox || !chatIcon) return;
  
    if (isMobileDevice()) {
      chatBox.style.display = "none";
      chatIcon.style.display = "block";
  
      chatIcon.addEventListener("click", () => {
        const isActive = chatBox.classList.toggle("active");
        chatBox.style.display = isActive ? "flex" : "none";
      });
  
      // 点击空白处关闭
      document.addEventListener("click", (e) => {
        const isInside = chatBox.contains(e.target) || chatIcon.contains(e.target);
        if (!isInside && chatBox.classList.contains("active")) {
          chatBox.classList.remove("active");
          chatBox.style.display = "none";
        }
      });
    }
  });
  