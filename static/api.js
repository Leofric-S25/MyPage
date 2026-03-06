/**
 * 豫択曦的云端指挥部 - API 通讯模块
 * 处理与 Cloudflare Workers 后端的 D1 数据库交互
 */

// 1. 基础配置：确保指向你部署的 Worker 域名
const API_BASE_URL = 'https://mypage.onexp.workers.dev/api';

// 2. Token 持久化管理
const auth = {
    setToken(token) {
        localStorage.setItem('admin_token', token);
    },
    getToken() {
        return localStorage.getItem('admin_token');
    },
    clearToken() {
        localStorage.removeItem('admin_token');
    }
};

/**
 * 核心请求封装
 * @param {string} endpoint - API 路径 (如 /links)
 * @param {object} options - Fetch 配置
 */
async function fetchAPI(endpoint, options = {}) {
    const token = auth.getToken();
    
    // 合并 Headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // 如果有 Token，自动注入 Authorization Header
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        // 处理 401 Unauthorized (Token 过期或错误)
        if (response.status === 401) {
            auth.clearToken();
            throw new Error('会话已过期，请重新登录');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `请求失败: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error(`[API Error] ${endpoint}:`, error);
        throw error;
    }
}

// 3. 业务逻辑接口封装

// --- 身份验证 ---
const apiLogin = (password) => fetchAPI('/login', {
    method: 'POST',
    body: JSON.stringify({ password })
});

// --- 分组管理 (Groups) ---
const apiGetGroups = () => fetchAPI('/groups');
const apiCreateGroup = (data) => fetchAPI('/groups', { method: 'POST', body: JSON.stringify(data) });
const apiUpdateGroup = (id, data) => fetchAPI(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) });
const apiDeleteGroup = (id) => fetchAPI(`/groups/${id}`, { method: 'DELETE' });

// --- 链接管理 (Links) ---
const apiGetLinks = () => fetchAPI('/links');
const apiCreateLink = (data) => fetchAPI('/links', { method: 'POST', body: JSON.stringify(data) });
const apiUpdateLink = (id, data) => fetchAPI(`/links/${id}`, { method: 'PUT', body: JSON.stringify(data) });
const apiDeleteLink = (id) => fetchAPI(`/links/${id}`, { method: 'DELETE' });

// --- 扩展功能：获取网页元数据 (用于自动填充名称/图标) ---
const apiFetchWebInfo = (url) => fetchAPI('/fetch-info', {
    method: 'POST',
    body: JSON.stringify({ url })
});

// 导出到全局作用域供 app.js 使用
window.api = {
    login: apiLogin,
    getGroups: apiGetGroups,
    createGroup: apiCreateGroup,
    updateGroup: apiUpdateGroup,
    deleteGroup: apiDeleteGroup,
    getLinks: apiGetLinks,
    createLink: apiCreateLink,
    updateLink: apiUpdateLink,
    deleteLink: apiDeleteLink,
    fetchWebInfo: apiFetchWebInfo,
    auth
};
