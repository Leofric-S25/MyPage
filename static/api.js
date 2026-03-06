// --- 核心配置与 API ---
const API_BASE_URL = 'https://mypage.onexp.workers.dev/api';
let token = null;

// Token 管理
const setToken = (newToken) => { token = newToken; localStorage.setItem('admin_token', token); };
const getToken = () => token || localStorage.getItem('admin_token');

async function fetchAPI(endpoint, options = {}) {
    const t = getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (t) headers['Authorization'] = `Bearer ${t}`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '请求失败');
    }
    return response.json();
}

// --- 页面渲染逻辑 (关键修改) ---

let allGroups = [];
let allLinks = [];

// 初始化加载
async function init() {
    try {
        const [groups, links] = await Promise.all([
            fetchAPI('/groups'),
            fetchAPI('/links')
        ]);
        allGroups = groups;
        allLinks = links;
        
        renderGroupNav(groups);
        renderLinks(links);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// 1. 渲染水平分组导航
function renderGroupNav(groups) {
    const nav = document.getElementById('groupNav');
    if (!nav) return;
    
    const items = groups.map(g => `
        <div class="nav-item opacity-40 hover:opacity-100 transition cursor-pointer" 
             onclick="filterByGroup(${g.id}, this)">
            ${g.name}
        </div>
    `).join('');
    
    nav.innerHTML = `<div class="nav-item active" onclick="renderLinks(allLinks, this)">ALL</div>` + items;
}

// 2. 渲染极简链接卡片
function renderLinks(links, element) {
    // 处理导航激活状态
    if (element) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active', 'opacity-100'));
        element.classList.add('active', 'opacity-100');
    }

    const container = document.getElementById('navigation');
    if (!container) return;

    if (links.length === 0) {
        container.innerHTML = `<div class="col-span-full py-20 text-center opacity-20 mono text-xs uppercase tracking-widest">No data in this sector</div>`;
        return;
    }

    container.innerHTML = links.map(link => `
        <div class="link-card card-hover flex flex-col justify-between group relative">
            <div>
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[9px] mono opacity-30 uppercase tracking-widest">
                        ${getGroupName(link.group_id)}
                    </span>
                    ${getToken() ? `
                        <div class="opacity-0 group-hover:opacity-100 transition flex gap-2">
                            <button onclick="editLink(${link.id})" class="text-[10px] hover:text-white"><i class="fas fa-edit"></i></button>
                            <button onclick="handleDeleteLink(${link.id})" class="text-[10px] hover:text-red-500"><i class="fas fa-trash"></i></button>
                        </div>
                    ` : ''}
                </div>
                <a href="${link.url}" target="_blank" class="block">
                    <h3 class="link-title">${link.name}</h3>
                    <p class="link-desc">${link.description || 'Secure link to external resource'}</p>
                </a>
            </div>
            <div class="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                 <span class="text-[9px] mono opacity-20">EST. 2026</span>
                 <i class="fas fa-external-link-alt text-[10px] opacity-10 group-hover:opacity-100 transition"></i>
            </div>
        </div>
    `).join('');
}

// 辅助：获取分组名称
function getGroupName(id) {
    const g = allGroups.find(g => g.id === id);
    return g ? g.name : 'MISC';
}

// 筛选逻辑
function filterByGroup(groupId, element) {
    const filtered = allLinks.filter(l => l.group_id === groupId);
    renderLinks(filtered, element);
}

// --- 交互功能 ---

// 搜索功能适配
function handleSearch(event) {
    event.preventDefault();
    const query = document.getElementById('searchInput').value.toLowerCase();
    const engine = document.getElementById('searchEngine').value;
    
    if (!query) return;

    // 如果在站内搜索
    const filtered = allLinks.filter(l => 
        l.name.toLowerCase().includes(query) || 
        (l.description && l.description.toLowerCase().includes(query))
    );
    
    if (filtered.length > 0) {
        renderLinks(filtered);
    } else {
        // 如果没搜到，跳转外部引擎
        const engines = {
            google: `https://www.google.com/search?q=${query}`,
            bing: `https://www.bing.com/search?q=${query}`,
            baidu: `https://www.baidu.com/s?wd=${query}`
        };
        window.open(engines[engine], '_blank');
    }
}

// 管理员登录处理
async function handleLogin(event) {
    event.preventDefault();
    const password = document.getElementById('adminPassword').value;
    try {
        const data = await fetchAPI('/login', {
            method: 'POST',
            body: JSON.stringify({ password })
        });
        setToken(data.token);
        showToast('AUTHORIZATION SUCCESS', 'success');
        closeAdminModal();
        init(); // 重新加载以显示编辑按钮
    } catch (error) {
        showToast('ACCESS DENIED', 'error');
    }
}

// 模态框控制适配
function openAdminModal() { document.getElementById('adminModal').classList.add('active'); }
function closeAdminModal() { document.getElementById('adminModal').classList.remove('active'); }

// Toast 提示增强
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `glass px-6 py-3 rounded-lg text-xs mono tracking-widest mb-2 border-l-2 ${type === 'error' ? 'border-red-500' : 'border-green-500'} animate-fade-in`;
    toast.textContent = `> ${message.toUpperCase()}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// 启动
document.addEventListener('DOMContentLoaded', init);
