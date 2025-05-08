// ==UserScript==
// @name         Cursor学生认证 - China选项添加工具
// @namespace    https://github.com/worryzyy/cursor-student-free-one-year
// @version      0.0.1
// @description  为Cursor学生认证页面添加China选项，优化认证流程
// @author       weilei
// @match        https://*.sheerid.com/*
// @match        https://www.cursor.com/cn/student*
// @match        https://www.cursor.com/cn/student-verified*
// @match        https://cursor.com/cn/student*
// @match        https://services.sheerid.com/verify/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

/**
 * Cursor学生认证助手
 * 该脚本用于在Cursor学生认证流程中添加China选项
 */
(function () {
  'use strict';

  // ============= 配置参数 =============
  const CONFIG = {
    targetProgramId: '681044b7729fba7beccd3565',
    countryCode: 'CN',
    countryTags: ["HEI", "qualifying_hs", "qualifying_ps"],
    logPrefix: '🚀 Cursor助手:',
    successColor: '#00ff00',
    backgroundColor: '#000000'
  };

  // ============= 工具函数 =============

  // 日志系统
  const Logger = {
    info: (message) => console.log(`${CONFIG.logPrefix} ${message}`),
    error: (message, error) => console.error(`${CONFIG.logPrefix} 错误: ${message}`, error),
    success: (message) => console.log(`%c${CONFIG.logPrefix} ${message}`, 'color: green; font-weight: bold;')
  };

  // 显示ASCII艺术字成功标识
  const UI = {
    showSuccessBanner: () => {
      const successArt = [
        "  _____  _    _  _____  _____  ______  _____   _____ ",
        " / ____|| |  | |/ ____|/ ____||  ____||  __ \\ / ____|",
        "| (___  | |  | | |    | |    | |__   | |__) | (___  ",
        " \\___ \\ | |  | | |    | |    |  __|  |  _  / \\___ \\ ",
        " ____) || |__| | |____| |____| |____ | | \\ \\ ____) |",
        "|_____/  \\____/ \\_____|\\_____|______||_|  \\_\\_____/ ",
        "                                                     ",
        " ===== CURSOR学生认证China选项添加成功! =====        ",
        "                                                     "
      ];

      console.log("%c" + successArt.join("\n"),
        `color: ${CONFIG.successColor}; font-weight: bold; background-color: ${CONFIG.backgroundColor}; padding: 5px;`);
    }
  };

  // URL检测工具
  const URLMatcher = {
    isThemeRequest: (url) => {
      return (
        url.includes(`/rest/v2/program/${CONFIG.targetProgramId}/theme`) ||
        url.includes('theme?locale=') ||
        (url.includes('/rest/v2/program/') && url.includes('/theme'))
      );
    }
  };

  // 数据处理工具
  const DataProcessor = {
    addChinaToCountries: (data) => {
      if (!data?.config?.countries) return data;

      // 已经包含中国则不再添加
      if (data.config.countries.includes(CONFIG.countryCode)) return data;

      // 在瑞士(CH)之后添加中国(CN)，符合字母排序
      const chIndex = data.config.countries.indexOf('CH');
      if (chIndex !== -1) {
        data.config.countries.splice(chIndex + 1, 0, CONFIG.countryCode);
      } else {
        data.config.countries.push(CONFIG.countryCode);
      }

      // 添加中国对应的标签
      if (data.config.orgSearchCountryTags) {
        data.config.orgSearchCountryTags[CONFIG.countryCode] = CONFIG.countryTags;
      }

      Logger.success(`已成功将${CONFIG.countryCode}添加到国家列表`);
      UI.showSuccessBanner();

      return data;
    }
  };

  // ============= 网络请求拦截器 =============

  // Fetch请求拦截器
  const FetchInterceptor = {
    install: () => {
      const originalFetch = window.fetch;

      window.fetch = async function (url, options) {
        const response = await originalFetch(url, options);

        if (!URLMatcher.isThemeRequest(url)) return response;

        try {
          const clonedResponse = response.clone();
          const responseBody = await clonedResponse.json();
          const modifiedBody = DataProcessor.addChinaToCountries(responseBody);

          return new Response(JSON.stringify(modifiedBody), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        } catch (error) {
          Logger.error('处理Fetch响应时出错', error);
          return response;
        }
      };

      Logger.info('Fetch拦截器已安装');
    }
  };

  // XMLHttpRequest拦截器
  const XHRInterceptor = {
    install: () => {
      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSend = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.open = function (method, url, ...args) {
        this._interceptedUrl = url;
        return originalOpen.apply(this, [method, url, ...args]);
      };

      XMLHttpRequest.prototype.send = function (body) {
        if (!this._interceptedUrl || !URLMatcher.isThemeRequest(this._interceptedUrl)) {
          return originalSend.apply(this, [body]);
        }

        const xhr = this;
        const originalOnReadyStateChange = xhr.onreadystatechange;

        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4 && xhr.status === 200) {
            try {
              const responseBody = JSON.parse(xhr.responseText);
              const modifiedBody = DataProcessor.addChinaToCountries(responseBody);

              Object.defineProperty(xhr, 'responseText', {
                get: function () {
                  return JSON.stringify(modifiedBody);
                }
              });
            } catch (error) {
              Logger.error('处理XHR响应时出错', error);
            }
          }

          if (originalOnReadyStateChange) {
            originalOnReadyStateChange.apply(xhr);
          }
        };

        return originalSend.apply(this, [body]);
      };

      Logger.info('XHR拦截器已安装');
    }
  };

  // ============= 应用初始化 =============

  // 启动应用
  const App = {
    init: () => {
      Logger.info('正在初始化...');
      FetchInterceptor.install();
      XHRInterceptor.install();
      Logger.info('Cursor China选项添加脚本已成功加载');
    }
  };

  // 执行初始化
  App.init();

})();