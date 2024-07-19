// 全局变量
let API_URL = localStorage.getItem('API_URL') || 'http://localhost:8080/api/v1';
let BASE_URL = localStorage.getItem('BASE_URL') || 'https://demo.fuclaude.com';
let AUTH_TOKEN = localStorage.getItem('AUTH_TOKEN') || '';

/**
 * 显示通知
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型 ('error' 或 'success')
 */
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        border-radius: 5px;
        background-color: ${type === 'error' ? '#ff4444' : '#3498db'};
        color: white;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    `;
    document.body.appendChild(notification);

    // 淡入效果
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);

    // 5秒后淡出并移除
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

/**
 * 显示错误通知
 * @param {string} message - 错误消息
 */
function showError(message) {
    showNotification(message, 'error');
}

/**
 * 显示成功通知
 * @param {string} message - 成功消息
 */
function showSuccess(message) {
    showNotification(message, 'success');
}

/**
 * 发送API请求
 * @param {string} method - HTTP方法
 * @param {string} url - API端点
 * @param {object} [data=null] - 请求体数据
 * @returns {Promise} - API响应
 */
async function apiRequest(method, url, data = null) {
    try {
        const headers = { 
            'Content-Type': 'application/json'
        };
        
        if (AUTH_TOKEN) {
            headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
        }

        const response = await axios({
            method,
            url: `${API_URL}${url}`,
            data,
            headers: headers
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.error || '请求失败');
        } else {
            throw error;
        }
    }
}

/**
 * 路由函数
 * @param {string} route - 路由名称
 */
function navigate(route) {
    const content = document.getElementById('content');
    content.innerHTML = '';

    switch(route) {
        case 'session-keys':
            renderSessionKeyManager();
            break;
        default:
            renderSessionKeyManager();
    }
}

/**
 * 截断文本
 * @param {string} text - 原始文本
 * @param {number} [maxLength=20] - 最大长度
 * @returns {string} - 截断后的文本
 */
function truncateText(text, maxLength = 20) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

/**
 * 渲染Session Key管理界面
 */
async function renderSessionKeyManager() {
    const container = document.createElement('div');
    
    // 创建标题和设置按钮
    const header = document.createElement('div');
    header.className = 'header';
    
    const title = document.createElement('h2');
    title.textContent = 'Session Key 管理';
    header.appendChild(title);

    const settingsButton = document.createElement('button');
    settingsButton.innerHTML = '<i class="fas fa-cog"></i>';
    settingsButton.className = 'settings-button';
    settingsButton.onclick = openSettings;
    header.appendChild(settingsButton);

    container.appendChild(header);

    // 创建新建Key的表单
    const form = document.createElement('form');
    form.className = 'form';
    form.innerHTML = `
        <input type="text" id="new-key" placeholder="新的Key" required>
        <input type="text" id="new-code" placeholder="新的Code" required>
        <button type="submit">创建新的Key</button>
    `;
    form.addEventListener('submit', handleCreateSessionKey);
    container.appendChild(form);

    // 创建Session Key列表表格
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Key</th>
                <th>Code</th>
                <th>状态</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody id="session-keys-body"></tbody>
    `;
    container.appendChild(table);

    document.getElementById('content').appendChild(container);

    await fetchSessionKeys();
}

/**
 * 获取并显示Session Keys
 */
async function fetchSessionKeys() {
    try {
        const response = await apiRequest('get', '/sessionkeys');
        const tbody = document.getElementById('session-keys-body');
        tbody.innerHTML = '';
        response.forEach(sk => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="ID">${sk.id}</td>
                <td data-label="Key" title="${sk.key}">${truncateText(sk.key)}</td>
                <td data-label="Code" title="${sk.code}">${truncateText(sk.code)}</td>
                <td data-label="状态">${sk.status ? '激活' : '未激活'}</td>
                <td data-label="操作">
                    <div class="action-buttons">
                        <button onclick="handleToggleStatus(${sk.id}, ${!sk.status})">${sk.status ? '停用' : '激活'}</button>
                        <button onclick="handleDeleteSessionKey(${sk.id})">删除</button>
                        <button onclick="handleJump(${sk.id}, ${sk.status})" ${sk.status ? '' : 'disabled'}>跳转</button>
                        <button onclick="handleIsolatedChallenge(${sk.id}, ${sk.status})" ${sk.status ? '' : 'disabled'}>隔离跳转</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        showError('获取 Session Keys 失败：' + error.message);
    }
}

/**
 * 清空输入框
 */
function clearInput(){
    document.getElementById('new-key').value = "";
    document.getElementById('new-code').value = "";
}

/**
 * 处理创建新的Session Key
 * @param {Event} e - 表单提交事件
 */
async function handleCreateSessionKey(e) {
    e.preventDefault();
    const key = document.getElementById('new-key').value;
    const code = document.getElementById('new-code').value;

    try {
        await apiRequest('post', '/sessionkeys', { key, code, status: true });
        showSuccess('Session Key 创建成功');
        clearInput();
        await fetchSessionKeys();
    } catch (error) {
        showError('创建 Session Key 失败：' + error.message);
        clearInput();
    }
}

/**
 * 处理切换Session Key状态
 * @param {number} id - Session Key ID
 * @param {boolean} newStatus - 新状态
 */
async function handleToggleStatus(id, newStatus) {
    try {
        await apiRequest('put', `/sessionkeys/${id}`, { status: newStatus });
        showSuccess('Session Key 状态更新成功');
        await fetchSessionKeys();
    } catch (error) {
        showError('更新 Session Key 状态失败：' + error.message);
    }
}

/**
 * 处理删除Session Key
 * @param {number} id - Session Key ID
 */
function handleDeleteSessionKey(id) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>确认删除</h3>
            <p>您确定要删除这个Session Key吗？此操作不可撤销。</p>
            <div class="modal-buttons">
                <button onclick="confirmDeleteSessionKey(${id})">确认</button>
                <button onclick="closeModal()">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

/**
 * 确认删除Session Key
 * @param {number} id - Session Key ID
 */
async function confirmDeleteSessionKey(id) {
    try {
        await apiRequest('delete', `/sessionkeys/${id}`);
        showSuccess('Session Key 删除成功');
        closeModal();
        await fetchSessionKeys();
    } catch (error) {
        showError('删除 Session Key 失败：' + error.message);
    }
}

/**
 * 关闭模态框
 */
function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.parentNode.removeChild(modal);
    }
}
/**
 * 处理跳转
 * @param {number} sessionKeyId - Session Key ID
 * @param {boolean} isActive - Session Key是否激活
 */
async function handleJump(sessionKeyId, isActive) {
    if (!isActive) {
        showError('无法跳转：Session Key 未激活');
        return;
    }

    try {
        const response = await apiRequest('post', '/auth/oauth_token', {
            session_key_id: sessionKeyId,
            base_url: BASE_URL
        });
        
        console.log('Response:', response);

        if (response && response.login_url) {
            window.open(response.login_url, '_blank');
        } else {
            throw new Error('响应中没有包含 login_url');
        }
    } catch (error) {
        console.error('Jump error:', error);
        showError('跳转失败：' + (error.message || '未知错误'));
    }
}

/**
 * 处理隔离跳转
 * @param {number} sessionKeyId - Session Key ID
 * @param {boolean} isActive - Session Key是否激活
 */
async function handleIsolatedChallenge(sessionKeyId, isActive) {
    if (!isActive) {
        showError('无法进行隔离跳转：Session Key 未激活');
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'isolated-challenge-modal';
    modal.innerHTML = `
        <div class="isolated-challenge-content">
            <h3>隔离跳转</h3>
            <div>
                <label for="unique-name">唯一值:</label>
                <input type="text" id="unique-name" placeholder="请输入unique_name">
            </div>
            <div class="isolated-challenge-buttons">
                <button onclick="executeIsolatedChallenge(${sessionKeyId})">确定</button>
                <button onclick="closeIsolatedChallengeModal()">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

/**
 * 关闭隔离跳转模态框
 */
function closeIsolatedChallengeModal() {
    const modal = document.getElementById('isolated-challenge-modal');
    if (modal) {
        modal.parentNode.removeChild(modal);
    }
}

/**
 * 执行隔离跳转
 * @param {number} sessionKeyId - Session Key ID
 */
async function executeIsolatedChallenge(sessionKeyId) {
    const uniqueName = document.getElementById('unique-name').value;
    if (uniqueName.trim() === '') {
        showError('unique_name 不能为空');
        return;
    }

    try {
        const response = await apiRequest('post', '/auth/oauth_token', {
            session_key_id: sessionKeyId,
            base_url: BASE_URL,
            unique_name: uniqueName
        });
        
        console.log('Isolated Challenge Response:', response);

        if (response && response.login_url) {
            window.open(response.login_url, '_blank');
            closeIsolatedChallengeModal();
        } else {
            throw new Error('响应中没有包含 login_url');
        }
    } catch (error) {
        console.error('Isolated Challenge error:', error);
        showError('隔离跳转失败：' + (error.message || '未知错误'));
    }
}

/**
 * 打开设置模态框
 */
function openSettings() {
    const settingsHtml = `
        <div id="settings-modal">
            <div class="settings-content">
                <h3>设置</h3>
                <div>
                    <label for="api-url">API URL:</label>
                    <input type="text" id="api-url" value="${API_URL}">
                </div>
                <div>
                    <label for="base-url">BASE URL:</label>
                    <input type="text" id="base-url" value="${BASE_URL}">
                </div>
                <div>
                    <label for="auth-token">Authorization Token:</label>
                    <input type="text" id="auth-token" value="${AUTH_TOKEN}">
                </div>
                <div class="settings-buttons">
                    <button onclick="saveSettings()">保存</button>
                    <button onclick="closeSettings()">取消</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', settingsHtml);
}

/**
 * 保存设置
 */
function saveSettings() {
    const newApiUrl = document.getElementById('api-url').value;
    const newBaseUrl = document.getElementById('base-url').value;
    const newAuthToken = document.getElementById('auth-token').value;

    if (newApiUrl && newBaseUrl) {
        API_URL = newApiUrl;
        BASE_URL = newBaseUrl;
        AUTH_TOKEN = newAuthToken;
        localStorage.setItem('API_URL', API_URL);
        localStorage.setItem('BASE_URL', BASE_URL);
        localStorage.setItem('AUTH_TOKEN', AUTH_TOKEN);
        showSuccess('设置已保存');
        closeSettings();
        fetchSessionKeys(); // 刷新数据
    } else {
        showError('请填写所有字段');
    }
}

/**
 * 关闭设置模态框
 */
function closeSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.parentNode.removeChild(modal);
    }
}

// 初始路由
navigate('session-keys');