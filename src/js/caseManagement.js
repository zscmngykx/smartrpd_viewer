import { lol } from '../crypt.js';


function getLoggedInUser() {
    const user = localStorage.getItem("loggedInUser");
    return user ? JSON.parse(user) : null;
}

let currentSortColumn = null;
let currentSortOrder = 'asc';
let currentCases = [];

let currentThumbnails = [];
let currentImageIndex = 0;
window.selectedCaseId = null;
// 获取用户的病例列表
async function fetchCases() {
    const loggedInUser = getLoggedInUser();
    if (!loggedInUser) {
        console.error("User not logged in.");
        return null;
    }

    const requestBody = JSON.stringify([
        { machine_id: "3a0df9c37b50873c63cebecd7bed73152a5ef616", uuid: loggedInUser.uuid },
        { uuid: loggedInUser.uuid }
    ]);

    try {
        const response = await fetch('https://live.api.smartrpdai.com/api/smartrpd/case/user/findall/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (err) {
        console.error("❌ Failed to fetch cases:", err);
        return null;
    }
}

// 渲染病例表格
function populateTable(cases) {
    const tbody = document.querySelector('.table-body-wrapper .case-table tbody');
    tbody.innerHTML = "";

    if (!cases || cases.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>No cases found</td></tr>";
        return;
    }

    cases.forEach(caseItem => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="width: 20%;">${caseItem.case_id || "N/A"}</td>
            <td style="width: 20%;">${formatDateTime(caseItem.creation_date)}</td>
            <td style="width: 20%;">${formatDateTime(caseItem.expected_date)}</td>
            <td style="width: 20%;">${caseItem.username || "N/A"}</td>
            <td style="width: 20%;">${caseItem.status || "N/A"}</td>
        `;

        // 绑定点击：触发 handleRowClick 并设置高亮
        row.addEventListener("click", () => {
            handleRowClick(caseItem.id);

            // 清除其他行的 active 状态
            const allRows = tbody.querySelectorAll("tr");
            allRows.forEach(r => r.classList.remove("active"));

            // 当前行加上 active
            row.classList.add("active");
        });

        tbody.appendChild(row);
    });
}


// 点击某一行时获取病例详情
async function handleRowClick(caseId) {
    window.selectedCaseId = caseId;
    console.log("🔹 Selected case ID:", caseId);
    const loggedInUser = getLoggedInUser();
    if (!loggedInUser || !caseId) return;

    const requestBody = JSON.stringify([
        {
            machine_id: "3a0df9c37b50873c63cebecd7bed73152a5ef616",
            uuid: loggedInUser.uuid,
            caseIntID: caseId
        }
    ]);

    try {
        const response = await fetch(`https://live.api.smartrpdai.com/api/smartrpd/case/get/${caseId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: requestBody
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const detail = await response.json();
        displayCaseDetails(detail);
        console.log("🟢 Selected case info:", detail);
        await fetchThumbnails(caseId);
    } catch (err) {
        console.error("❌ Failed to get case detail:", err);
    }
    if (window.innerWidth <= 768) {
        document.querySelector(".container")?.classList.add("show-details");
      }
      
}

// 显示基本信息
function displayCaseDetails(data) {
    document.getElementById("selected-case").textContent = data.case_id || "N/A";
    document.getElementById("created-by").textContent = data.username || "N/A";
    document.getElementById("date-created").textContent = formatDateTime(data.creation_date);
    document.getElementById("last-edited").textContent = formatDateTime(data.last_updated);
}

// 日期格式化
function formatDateTime(timestamp) {
    return timestamp ? new Date(timestamp * 1000).toLocaleString() : "N/A";
}

// 排序逻辑
function sortCases(cases, key, order = 'asc') {
    return [...cases].sort((a, b) => {
        let valA = a[key] || "", valB = b[key] || "";
        if (key.includes('date')) {
            valA = new Date(valA * 1000);
            valB = new Date(valB * 1000);
        } else {
            valA = valA.toString().toLowerCase();
            valB = valB.toString().toLowerCase();
        }
        return (valA < valB ? -1 : valA > valB ? 1 : 0) * (order === 'asc' ? 1 : -1);
    });
}

// 缩略图切换
function updateThumbnail() {
    const image = document.getElementById("caseImage");
    const counter = document.getElementById("imageCounter");

    if (currentThumbnails.length === 0) {
        image.src = "../../assets/default.png";
        image.alt = "No images available";
        image.style.backgroundColor = "#ccc";
        counter.textContent = "IMAGE 0 OF 0";
        return;
    }

    image.src = "data:image/png;base64," + currentThumbnails[currentImageIndex];
    image.alt = `Case Thumbnail ${currentImageIndex + 1}`;
    counter.textContent = `IMAGE ${currentImageIndex + 1} OF ${currentThumbnails.length}`;
    image.style.backgroundColor = "";
}

// 判断2D图像逻辑（白底 + 宽高比）
function classifyThumbnails(images) {
    const is2D = (base64) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const w = img.width;
                const h = img.height;

                // ✅ 如果 height ≥ width 或 width/height 比例 < 1.3，可能是 2D 图
                const is2D = h >= w || w / h < 1.3;
                resolve({ base64, is2D });
            };
            img.onerror = () => resolve({ base64, is2D: false });
            img.src = "data:image/png;base64," + base64;
        });
    };

    return Promise.all(images.map(img => is2D(img))).then(results => {
        const twoD = results.filter(r => r.is2D).map(r => r.base64);
        const threeD = results.filter(r => !r.is2D).map(r => r.base64);
        return [...twoD, ...threeD];
    });
}

// 获取缩略图
async function fetchThumbnails(caseId) {
    const loggedInUser = getLoggedInUser();
    if (!loggedInUser) return;

    const requestBody = JSON.stringify([
        {
            machine_id: "3a0df9c37b50873c63cebecd7bed73152a5ef616",
            uuid: loggedInUser.uuid,
            caseIntID: caseId
        },
        {
            case_id: caseId
        }
    ]);

    try {
        const res = await fetch("https://live.api.smartrpdai.com/api/smartrpd/thumbnails/get", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: requestBody
        });

        if (!res.ok) {
            console.warn("⚠️ No images found or request failed:", res.status);
            currentThumbnails = [];
            currentImageIndex = 0;
            updateThumbnail();
            return;
        }

        const data = await res.json();
        const rawImages = data.map(img => img.data).filter(Boolean);
        currentThumbnails = await classifyThumbnails(rawImages);
        currentImageIndex = 0;
        updateThumbnail();
    } catch (err) {
        console.error("❌ Failed to fetch thumbnails:", err);
        currentThumbnails = [];
        currentImageIndex = 0;
        updateThumbnail();
    }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', async () => {
    updateThumbnail();
    const cases = await fetchCases();

    if (cases) {
        currentCases = cases;
        populateTable(cases);

        // 排序逻辑绑定
        document.querySelectorAll(".sortable").forEach(th => {
            th.addEventListener("click", () => {
                const sortKey = th.dataset.sort;
                currentSortOrder = currentSortColumn === sortKey && currentSortOrder === 'asc' ? 'desc' : 'asc';
                currentSortColumn = sortKey;

                const sorted = sortCases(currentCases, sortKey, currentSortOrder);
                populateTable(sorted);

                document.querySelectorAll(".sortable").forEach(el => el.classList.remove("active-asc", "active-desc"));
                th.classList.add(currentSortOrder === 'asc' ? 'active-asc' : 'active-desc');
            });
        });

        // 缩略图切换按钮绑定
        document.getElementById("prevBtn").addEventListener("click", () => {
            if (currentThumbnails.length > 0) {
                currentImageIndex = (currentImageIndex - 1 + currentThumbnails.length) % currentThumbnails.length;
                updateThumbnail();
            }
        });

        document.getElementById("nextBtn").addEventListener("click", () => {
            if (currentThumbnails.length > 0) {
                currentImageIndex = (currentImageIndex + 1) % currentThumbnails.length;
                updateThumbnail();
            }
        });
    }

    // ✅ START CASE 按钮绑定逻辑（使用 class 绑定方案 B）
    const startBtn = document.querySelector(".start-case-button");
    if (startBtn) {
        startBtn.addEventListener("click", () => {
            const caseId = window.selectedCaseId;
            console.log("🔹 Selected case ID:", caseId);

            if (!caseId) {
                alert("⚠️ Please select a case first.");
                return;
            }

            const encryptedId = lol(caseId);

            // 判断是否是 GitHub Pages
            const isGitHubPages = window.location.hostname.includes("github.io");
            // 如果是 GitHub Pages，就加上 repo name，其他情况如 localhost 则不加
            const basePath = isGitHubPages ? `/${window.location.pathname.split("/")[1]}` : "";
            
            const targetURL = `${window.location.origin}${basePath}/src/pages/ThreeDViewer.html?id=${encryptedId}`;
            window.open(targetURL, "_blank");
            
        });
    }
});

