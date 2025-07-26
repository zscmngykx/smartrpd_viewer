(function () {
  const MACHINE_ID = "3a0df9c37b50873c63cebecd7bed73152a5ef616";

  const notifBtn   = document.getElementById("notificationBtn");
  const notifPopup = document.getElementById("notificationPopup");
  const notifList  = document.getElementById("notificationList");
  const markAllBtn = document.getElementById("markAllBtn");

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user || !user.uuid) return;
  const USERNAME = user.username || (user.email ? user.email.split("@")[0] : "");

  notifBtn.addEventListener("click", () => {
    notifPopup.classList.toggle("hidden");
    if (!notifPopup.classList.contains("hidden")) loadNotifications();
  });
  document.addEventListener("click", e => {
    if (!notifPopup.contains(e.target) && e.target !== notifBtn)
      notifPopup.classList.add("hidden");
  });

  async function loadNotifications() {
    notifList.innerHTML = "<div style='padding:12px'>Loading…</div>";
    try {
      // A. 先拿当前用户的所有 case
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
      if (!caseRes.ok) throw new Error("case fetch failed");
      const caseArr = await caseRes.json();
      if (!Array.isArray(caseArr)) throw new Error("case list not array");

      // A.1 建 id->name 映射，统一用字符串 key
      const caseNameMap = {};
      caseArr.forEach(c => { caseNameMap[String(c.id)] = c.case_id; });

      // A.2 去重 case id
      const caseIDs = [...new Set(caseArr.map(c => c.id))];

      // B. per case 拉取 alerts
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

      // C. 去重（按 alert.id）
      const uniqueAlerts = [...new Map(allAlerts.map(a => [a.id, a])).values()];

      // D. 对缺名字的 case 再兜底查一次
      const missingIds = [...new Set(
        uniqueAlerts.filter(a => !caseNameMap[String(a.case_int_id)])
                    .map(a => a.case_int_id)
      )];

      await Promise.all(missingIds.map(async cid => {
        try {
          const r = await fetch(
            `https://live.api.smartrpdai.com/api/smartrpd/case/get/${cid}`,
            {
              method : "POST",
              headers: { "Content-Type": "application/json" },
              body   : JSON.stringify([
                { machine_id: MACHINE_ID, uuid: user.uuid, caseIntID: cid }
              ])
            }
          );
          if (r.ok) {
            const d = await r.json();
            if (d && d.case_id) caseNameMap[String(cid)] = d.case_id;
          }
        } catch (_) {}
      }));

      // E. 渲染
      render(uniqueAlerts, caseNameMap);
    } catch (e) {
      notifList.innerHTML =
        "<div style='padding:16px;color:red;'>加载失败</div>";
      console.error(e);
    }
  }

  function render(list, nameMap) {
    notifList.innerHTML = "";
    if (!Array.isArray(list) || !list.length) {
      notifList.innerHTML = "<div style='padding:16px;'>No notifications.</div>";
      return;
    }

    // 新的在上
    list.sort((a, b) => b.id - a.id);

    list.forEach(a => {
      const hasStatus  = a.new_status !== undefined && a.new_status !== null && a.new_status !== "";
      const caseName   = nameMap[String(a.case_int_id)] || `Case ${a.case_int_id}`;
      const msgPart    = a.alert_message ? `, with message “${a.alert_message}”` : "";
      let line;

      if (hasStatus) {
        line = `<strong>${a.from_user}</strong> has updated the status of <strong>${caseName}</strong> to <strong>${a.new_status}</strong>${msgPart}`;
      } else {
        line = `<strong>${a.from_user}</strong> has invited you to <strong>${caseName}</strong>${msgPart}`;
      }

      const div = document.createElement("div");
      div.className = "notification-item" + (a.read_status ? "" : " unread");
      div.innerHTML = `
        <div>
          ${a.read_status ? "" : '<span class="blue-dot"></span>'}
          ${line}
        </div>
        <div class="notification-time">${pretty(a.create_date)}</div>
      `;
      notifList.appendChild(div);
    });
  }

  const pretty = t => {
    if (!t) return "";
    const diffMin = Math.floor((Date.now() - new Date(t)) / 60000);
    if (diffMin < 1)  return "just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffH = diffMin / 60 | 0;
    if (diffH < 24)  return `${diffH} h ago`;
    return new Date(t).toLocaleDateString();
  };

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
