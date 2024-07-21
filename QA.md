# Fuclaude部署问题FAQ

## Q: Fuclaude部署后右下角一直弹出问题,如何解决?

### 问题描述

在部署Fuclaude后,页面右下角持续弹出问题提示,影响正常使用。

### 解决方案

以使用1Panel部署并使用OpenResty进行反向代理为例,可以通过以下步骤解决:

1. 编辑OpenResty的配置文件:
   ```
   /opt/1panel/apps/openresty/openresty/www/sites/xxx.xxxx.xxx/proxy/root.conf
   ```

2. 在配置文件中添加以下内容:
   ```nginx
   sub_filter '</head>' '<script>document.addEventListener("DOMContentLoaded", function() { const cookieSettingsDiv = document.querySelector("div[data-theme=\\"claude\\"][data-mode=\\"dark\\"]"); if (cookieSettingsDiv) { cookieSettingsDiv.remove(); } });</script></head>';
   sub_filter_once on;
   sub_filter_types *;
   ```

3. 保存文件并重启OpenResty服务。

### 原理解释

具体来说:

1. **内容替换**: `sub_filter '' '';` 这行配置用于替换响应中的特定内容。在这里,它被设置为空字符串替换空字符串,实际上不会进行任何替换。这个设置的目的是激活Nginx的sub_filter模块。

2. **单次替换**: `sub_filter_once on;` 指示Nginx只对每个响应进行一次替换操作。这可以提高性能,特别是在处理大型响应时。

3. **适用于所有MIME类型**: `sub_filter_types *;` 允许对所有MIME类型的响应进行内容替换。默认情况下,sub_filter只适用于text/html类型。

这些设置的组合效果是:
- 激活了Nginx的内容替换功能
- 确保了所有类型的响应都经过处理
- 防止了可能导致右下角弹出问题的特定内容或脚本被错误地注入或修改

通过这种配置,我们可以确保Fuclaude的前端内容被正确地传递给客户端,而不会被反向代理意外修改或注入导致问题的代码。

### 注意事项

- 在修改Nginx配置时,请确保备份原始配置文件。
- 更改配置后,一定要重启Nginx服务以使更改生效。
