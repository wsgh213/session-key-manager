// 全局变量
const API_URL = 'http://localhost:8080/api/v1'; // 直接在这里设置API_URL
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
                        <button onclick="handleShare(${sk.id}, ${sk.status})" ${sk.status ? '' : 'disabled'}>分享</button>
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
    modal.className = 'modal delete-confirm-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3 class="modal-title">确认删除</h3>
            <p>您确定要删除这个Session Key吗？此操作不可撤销。</p>
            <div class="modal-buttons">
                <button class="btn btn-danger" onclick="confirmDeleteSessionKey(${id})">确认</button>
                <button class="btn btn-secondary" onclick="closeModal()">取消</button>
            </div>
        </div>
    `;
    modal.onclick = closeModal;
    modal.querySelector('.modal-content').onclick = (e) => e.stopPropagation();
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
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="isolated-challenge-content">
            <h3>隔离跳转</h3>
            <div>
                <label for="unique-name">唯一值:</label>
                <input type="text" id="unique-name" placeholder="请输入unique_name">
            </div>
            <div class="isolated-challenge-buttons">
                <button onclick="executeIsolatedChallenge(${sessionKeyId})">确定</button>
                <button onclick="closeModal()">取消</button>
            </div>
        </div>
    `;
    modal.onclick = closeModal;
    modal.querySelector('.isolated-challenge-content').onclick = (e) => e.stopPropagation();
    document.body.appendChild(modal);
}

/**
 * 将日期时间转换为秒数
 * @param {string} dateString - 日期时间字符串
 * @returns {number} - 从现在到指定日期时间的秒数
 */
function dateToSeconds(dateString) {
    const selectedDate = new Date(dateString);
    const now = new Date();
    return Math.floor((selectedDate - now) / 1000);
}

/**
 * 处理分享
 * @param {number} sessionKeyId - Session Key ID
 * @param {boolean} isActive - Session Key是否激活
 */
function handleShare(sessionKeyId, isActive) {
    if (!isActive) {
        showError('无法分享：Session Key 未激活');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>选择分享类型</h3>
            <div class="share-options">
                <button onclick="handleNormalShare(${sessionKeyId})">普通分享</button>
                <button onclick="handleIsolatedShare(${sessionKeyId})">隔离分享</button>
            </div>
        </div>
    `;
    modal.onclick = closeModal;
    modal.querySelector('.modal-content').onclick = (e) => e.stopPropagation();
    document.body.appendChild(modal);
}

/**
 * 处理普通分享
 * @param {number} sessionKeyId - Session Key ID
 */
function handleNormalShare(sessionKeyId) {
    closeModal();
    showExpirationModal(sessionKeyId, 'normal');
}

/**
 * 处理隔离分享
 * @param {number} sessionKeyId - Session Key ID
 */
function handleIsolatedShare(sessionKeyId) {
    closeModal();
    showExpirationModal(sessionKeyId, 'isolated');
}


/**
 * 显示过期时间设置模态框
 * @param {number} sessionKeyId - Session Key ID
 * @param {string} shareType - 分享类型
 */
function showExpirationModal(sessionKeyId, shareType) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>设置过期时间</h3>
            <div class="expiration-setting">
                <label for="expiration-datetime">过期时间：</label>
                <input type="datetime-local" id="expiration-datetime">
            </div>
            <div class="modal-buttons">
                <button onclick="generateShareLink(${sessionKeyId}, '${shareType}')">确定</button>
                <button onclick="generateShareLink(${sessionKeyId}, '${shareType}', true)">不设置过期时间</button>
                <button onclick="closeModal()">取消</button>
            </div>
        </div>
    `;
    modal.onclick = closeModal;
    modal.querySelector('.modal-content').onclick = (e) => e.stopPropagation();
    document.body.appendChild(modal);
}

/**
 * 显示隔离分享模态框
 * @param {number} sessionKeyId - Session Key ID
 */
function showIsolatedShareModal(sessionKeyId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>隔离分享</h3>
            <div>
                <label for="unique-name">唯一值:</label>
                <input type="text" id="unique-name" placeholder="请输入unique_name">
            </div>
            <div class="expiration-setting">
                <label for="isolated-expiration-datetime">过期时间：</label>
                <input type="datetime-local" id="isolated-expiration-datetime">
            </div>
            <div class="modal-buttons">
                <button onclick="handleIsolatedShareSubmit(${sessionKeyId})">确定</button>
                <button onclick="closeModal()">取消</button>
            </div>
        </div>
    `;
    modal.onclick = closeModal;
    modal.querySelector('.modal-content').onclick = (e) => e.stopPropagation();
    document.body.appendChild(modal);
}

/**
 * 处理隔离分享提交
 * @param {number} sessionKeyId - Session Key ID
 */
function handleIsolatedShareSubmit(sessionKeyId) {
    const uniqueName = document.getElementById('unique-name').value.trim();
    const expirationDatetime = document.getElementById('isolated-expiration-datetime').value;
    let expirationSeconds = 0;

    if (expirationDatetime) {
        expirationSeconds = dateToSeconds(expirationDatetime);
    }

    if (uniqueName) {
        closeModal();
        generateShareLink(sessionKeyId, 'isolated', false, uniqueName, expirationSeconds);
    } else {
        showError('请输入有效的唯一名称');
    }
}

/**
 * 显示过期时间设置模态框
 * @param {number} sessionKeyId - Session Key ID
 * @param {string} shareType - 分享类型
 */
function showExpirationModal(sessionKeyId, shareType) {
    const modal = document.createElement('div');
    modal.className = 'modal fade-in';
    modal.innerHTML = `
        <div class="modal-content expiration-modal">
            <h3 class="modal-title">${shareType === 'isolated' ? '隔离分享' : '设置过期时间'}</h3>
            ${shareType === 'isolated' ? `
            <div class="isolated-share-input">
                <label for="unique-name">唯一值:</label>
                <input type="text" id="unique-name" placeholder="请输入unique_name">
            </div>
            ` : ''}
            <div class="expiration-options">
                <div class="expiration-option">
                    <input type="radio" id="no-expiration" name="expiration-type" value="no-expiration" checked>
                    <label for="no-expiration">永不过期</label>
                </div>
                <div class="expiration-option">
                    <input type="radio" id="custom-expiration" name="expiration-type" value="custom-expiration">
                    <label for="custom-expiration">自定义过期时间</label>
                </div>
            </div>
            <div id="custom-expiration-inputs" class="custom-expiration-inputs hidden">
                <input type="datetime-local" id="expiration-datetime">
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="generateShareLink(${sessionKeyId}, '${shareType}')">确定</button>
                <button class="btn btn-secondary" onclick="closeModal()">取消</button>
            </div>
        </div>
    `;
    modal.onclick = closeModal;
    modal.querySelector('.modal-content').onclick = (e) => e.stopPropagation();
    document.body.appendChild(modal);

    // 添加事件监听器以显示/隐藏自定义过期时间输入
    const customExpirationInputs = document.getElementById('custom-expiration-inputs');
    document.querySelectorAll('input[name="expiration-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'custom-expiration') {
                customExpirationInputs.classList.remove('hidden');
            } else {
                customExpirationInputs.classList.add('hidden');
            }
        });
    });

    // 设置最小日期时间为当前时间
    const datetimeInput = document.getElementById('expiration-datetime');
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    datetimeInput.min = now.toISOString().slice(0, 16);
}

/**
 * 生成分享链接
 * @param {number} sessionKeyId - Session Key ID
 * @param {string} shareType - 分享类型 ('normal' 或 'isolated')
 */
async function generateShareLink(sessionKeyId, shareType) {
    let expirationSeconds = 0;
    const expirationType = document.querySelector('input[name="expiration-type"]:checked').value;

    if (expirationType === 'custom-expiration') {
        const expirationDatetime = document.getElementById('expiration-datetime').value;
        if (expirationDatetime) {
            expirationSeconds = dateToSeconds(expirationDatetime);
        } else {
            showError('请选择有效的过期时间');
            return;
        }
    }

    let uniqueName = '';
    if (shareType === 'isolated') {
        uniqueName = document.getElementById('unique-name').value.trim();
        if (!uniqueName) {
            showError('请输入有效的唯一名称');
            return;
        }
    }

    try {
        const response = await apiRequest('post', '/auth/oauth_token', {
            session_key_id: sessionKeyId,
            base_url: BASE_URL,
            expires_in: expirationSeconds,
            ...(shareType === 'isolated' && { unique_name: uniqueName })
        });

        if (response && response.login_url) {
            showShareLinkModal(response.login_url, expirationSeconds);
        } else {
            throw new Error('响应中没有包含 login_url');
        }
    } catch (error) {
        console.error('Share link generation error:', error);
        showError('生成分享链接失败：' + (error.message || '未知错误'));
    }

    closeModal();
}

/**
 * 显示分享链接模态框
 * @param {string} shareLink - 分享链接
 * @param {number} expirationSeconds - 过期时间（秒）
 */
function showShareLinkModal(shareLink, expirationSeconds) {
    const expirationText = expirationSeconds > 0 
        ? `链接将在 ${Math.floor(expirationSeconds / 3600)} 小时 ${Math.floor((expirationSeconds % 3600) / 60)} 分钟后过期。`
        : '此链接没有设置过期时间。';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>分享链接</h3>
            <div class="share-link-container">
                <input type="text" id="share-link-input" value="${shareLink}" readonly>
                <button onclick="copyShareLink()"><i class="fas fa-copy"></i> 复制</button>
            </div>
            <p class="validity-notice">${expirationText}</p>
        </div>
    `;
    modal.onclick = closeModal;
    modal.querySelector('.modal-content').onclick = (e) => e.stopPropagation();
    document.body.appendChild(modal);
}

/**
 * 复制分享链接到剪贴板
 */
function copyShareLink() {
    const shareLinkInput = document.getElementById('share-link-input');
    
    if (navigator.clipboard && window.isSecureContext) {
        // 使用现代的 Clipboard API
        navigator.clipboard.writeText(shareLinkInput.value).then(() => {
            showSuccess('链接已复制到剪贴板');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showError('复制失败，请手动复制链接');
        });
    } else {
        // 回退到旧方法
        shareLinkInput.select();
        try {
            var successful = document.execCommand('copy');
            if (successful) {
                showSuccess('链接已复制到剪贴板');
            } else {
                showError('复制失败，请手动复制链接');
            }
        } catch (err) {
            console.error('Failed to copy: ', err);
            showError('复制失败，请手动复制链接');
        }
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
        
        if (response && response.login_url) {
            window.open(response.login_url, '_blank');
            closeModal();
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
        <div id="settings-modal" class="modal">
            <div class="settings-content">
                <h3>设置</h3>
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
                    <button onclick="closeModal()">取消</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', settingsHtml);
    const modal = document.getElementById('settings-modal');
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
}

/**
 * 保存设置
 */
function saveSettings() {
    const newBaseUrl = document.getElementById('base-url').value;
    const newAuthToken = document.getElementById('auth-token').value;

    if (newBaseUrl) {
        BASE_URL = newBaseUrl;
        AUTH_TOKEN = newAuthToken;
        localStorage.setItem('BASE_URL', BASE_URL);
        localStorage.setItem('AUTH_TOKEN', AUTH_TOKEN);
        showSuccess('设置已保存');
        closeModal();
        fetchSessionKeys(); // 刷新数据
    } else {
        showError('请填写所有字段');
    }
}

// 初始路由
navigate('session-keys');