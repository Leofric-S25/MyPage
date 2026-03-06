/**
 * 豫択曦的云端指挥部 - 逻辑控制中心
 */

// 1. 初始化页面数据
async function init() {
    console.log("Checking API connection...");
    const navContainer = document.getElementById('navigation');
    const groupNav = document.getElementById('groupNav');

    try {
        // 使用 api.js 中定义的全局 window.api 对象
        const groups = await window.api.getGroups();
        const links = await window.api.getLinks();

        console.log("Data Received:", { groups, links });

        // 保存到全局供筛选使用
        window.allGroups = groups;
        window.allLinks = links;

        renderGroupNav(groups);
        renderLinks(links);
        
        // 更新底部模拟状态（建议2的预留）
        updateSystemStatus();

    } catch (error) {
        console.error("Initialization Failed:", error);
        if (navContainer) {
            navContainer.innerHTML = `<div class="col-span-full text-center py-10 opacity-50 mono text-xs uppercase">
                Connection Error: ${error.message} <br> 
                Check Worker URL in api.js
            </div>`;
        }
    }
}

// 2. 渲染顶部导航
function renderGroupNav(groups) {
    const nav = document.getElementById('groupNav');
    if (!nav) return;

    const items = groups.map(g => `
        <div class="nav-item opacity-40 hover:opacity-100 transition cursor-pointer px-2" 
             onclick="filterByGroup(${g.id}, this)">
            ${g.name.toUpperCase()}
        </div>
    `).join('');

    nav.innerHTML = `<div class="nav-item active text-white" onclick="filterByGroup('all', this)">ALL_SECTORS</div>` + items;
}

// 3. 渲染链接卡片
function renderLinks(links, element) {
    const container = document.getElementById('navigation');
    if (!container) return;

    // 处理导航激活高亮
    if (element) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active', 'text-white'));
        element.classList.add('active', 'text-white');
    }

    if (!links || links.length === 0) {
        container.innerHTML = `<div class="col-span-full py-20 text-center opacity-20 mono text-[10px] tracking-widest">NO DATA IN SECTOR</div>`;
        return;
    }

    container.innerHTML = links.map(link => `
        <a href="${link.url}" target="_blank" class="glass p-6 rounded-xl border border-white/5 hover:border-white/20 transition-all group">
            <div class="flex justify-between items-start mb-4">
                <span class="text-[9px] mono opacity-30 uppercase tracking-[0.2em]">
                    ${getGroupName(link.group_id)}
                </span>
                <i class="fas fa-external-link-alt text-[9px] opacity-10 group-hover:opacity-100 transition"></i>
            </div>
            <h3 class="text-sm font-medium text-white/80 mb-2 group-hover:text-white transition">${link.name}</h3>
            <p class="text-[11px] leading-relaxed opacity-40 group-hover:opacity-60 transition line-clamp-2">
                ${link.description || 'Accessing remote node...'}
            </p>
        </a>
    `).join('');
}

// 4. 辅助功能
function getGroupName(id) {
    const g = window.allGroups ? window.allGroups.find(g => g.id === id) : null;
    return g ? g.name : 'DATA';
}

function filterByGroup(groupId, element) {
    if (groupId === 'all') {
        renderLinks(window.allLinks, element);
    } else {
        const filtered = window.allLinks.filter(l => l.group_id === groupId);
        renderLinks(filtered, element);
    }
}

function updateSystemStatus() {
    // 建议2的逻辑将在此处更新
    console.log("System Status: Terminal Ready.");
}

// 5. 模态框逻辑适配
function handleLogin(event) {
    event.preventDefault();
    const pwd = document.getElementById('adminPassword').value;
    window.api.login(pwd)
        .then(data => {
            window.api.auth.setToken(data.token);
            location.reload(); // 登录成功刷新页面
        })
        .catch(err => alert("UNAUTHORIZED: " + err.message));
}

// 监听加载
document.addEventListener('DOMContentLoaded', init);
