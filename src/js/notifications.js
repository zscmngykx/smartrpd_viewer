(function () {
  const MACHINE_ID = "3a0df9c37b50873c63cebecd7bed73152a5ef616";

  /* ==== DOM ==== */
  const notifBtn   = document.getElementById("notificationBtn");
  const notifPopup = document.getElementById("notificationPopup");
  const notifList  = document.getElementById("notificationList");
  const markAllBtn = document.getElementById("markAllBtn");

  /* ==== 登录信息 ==== */
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user || !user.uuid) return;
  const USERNAME = user.username || (user.email ? user.email.split("@")[0] : "");

  /* ==== 弹窗开关 ==== */
  notifBtn.addEventListener("click", () => {
    notifPopup.classList.toggle("hidden");
    if (!notifPopup.classList.contains("hidden")) loadNotifications();
  });
  document.addEventListener("click", e => {
    if (!notifPopup.contains(e.target) && e.target !== notifBtn)
      notifPopup.classList.add("hidden");
  });

  /* ==== 加载通知 ==== */
  async function loadNotifications() {
    notifList.innerHTML = "<div style='padding:12px'>Loading…</div>";
    try {
      /* A. 取全部 case */
      const caseRes = await fetch(
        "https://live.api.smartrpdai.com/api/smartrpd/case/user/findall/get",
        {
          method : "POST",
          headers: { "Content-Type": "application/json" },
          body   : JSON.stringify([
            { machine_id: MACHINE_ID, uuid: user.uuid },
            { uuid: user.uuid }
          ])
        }
      );
      if (!caseRes.ok) throw new Error("case fetch");
      const caseArr = await caseRes.json();
      if (!Array.isArray(caseArr)) throw new Error("case list not array");

      /* ★ 1. 取 id 后去重 */
      const caseIDs = [...new Set(caseArr.map(c => c.id))];

      /* B. 逐 case 拉取 alert */
      const allAlerts = [];
      for (const cid of caseIDs) {
        const aRes = await fetch(
          "https://live.api.smartrpdai.com/api/smartrpd/alerts/getallbytouser",
          {
            method : "POST",
            headers: { "Content-Type": "application/json" },
            body   : JSON.stringify([
              { machine_id: MACHINE_ID, uuid: user.uuid, caseIntID: cid },
              { to_user: USERNAME }
            ])
          }
        );
        if (aRes.ok) {
          const list = await aRes.json();
          if (Array.isArray(list)) allAlerts.push(...list);
        }
      }

      /* ★ 2. 按 alert.id 再去重，然后渲染 */
      const uniqueAlerts = [...new Map(allAlerts.map(a => [a.id, a])).values()];
      render(uniqueAlerts);
    } catch (e) {
      notifList.innerHTML =
        "<div style='padding:16px;color:red;'>加载失败</div>";
      console.error(e);
    }
  }

  /* ==== 渲染 ==== */
  function render(arr) {
    notifList.innerHTML = "";
    if (!arr.length) {
      notifList.innerHTML = "<div style='padding:16px;'>No notifications.</div>";
      return;
    }
    arr.forEach(a => {
      const div = document.createElement("div");
      div.className = "notification-item" + (a.read_status ? "" : " unread");
      div.innerHTML = `
        <div>
          ${a.read_status ? "" : '<span class="blue-dot"></span>'}
          <strong>${a.from_user}</strong> updated 
          <strong>Case ${a.case_int_id}</strong> to 
          <strong>${a.new_status}</strong>
          ${a.alert_message ? `, “${a.alert_message}”` : ""}
        </div>
        <div class="notification-time">${pretty(a.create_date)}</div>`;
      notifList.appendChild(div);
    });
  }

  const pretty = t =>
    !t
      ? ""
      : ((d = Math.floor((Date.now() - new Date(t)) / 60000)) =>
          d < 1 ? "just now" :
          d < 60 ? `${d} min ago` :
          d < 1440 ? `${(d/60)|0} h ago` :
          new Date(t).toLocaleDateString())();

  /* ==== 一键已读 ==== */
  markAllBtn.addEventListener("click", async () => {
    await fetch(
      "https://live.api.smartrpdai.com/api/smartrpd/alerts/setreadstatus",
      {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify([
          { uuid: user.uuid },
          { to_user: USERNAME, all: true }
        ])
      }
    );
    loadNotifications();
  });
})();
