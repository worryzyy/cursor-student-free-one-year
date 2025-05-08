// ==UserScript==
// @name         Cursor 学生认证添加China选项
// @namespace    https://github.com/worryzyy/cursor-student-free-one-year
// @version      0.1
// @description  添加CN代码
// @author       weilei
// @match        https://my.sheerid.com/*
// @match        https://*.sheerid.com/*
// @match        https://www.cursor.com/cn/student*
// @match        https://www.cursor.com/cn/student-verified*
// @match        https://cursor.com/cn/student*
// @match        https://services.sheerid.com/verify/*
// ==/UserScript==

(function () {
  'use strict';

  const originalFetch = window.fetch;
  window.fetch = async function (url, options) {
    const response = await originalFetch(url, options);

    if (url.includes('/rest/v2/program/681044b7729fba7beccd3565/theme') ||
      url.includes('theme?locale=') ||
      url.includes('/rest/v2/program/') && url.includes('/theme')) {
      try {
        const clonedResponse = response.clone();
        const responseBody = await clonedResponse.json();

        if (responseBody && responseBody.config && Array.isArray(responseBody.config.countries)) {
          if (!responseBody.config.countries.includes('CN')) {

            const chIndex = responseBody.config.countries.indexOf('CH');
            if (chIndex !== -1) {
              responseBody.config.countries.splice(chIndex + 1, 0, 'CN');
            } else {
              responseBody.config.countries.push('CN');
            }

            if (responseBody.config.orgSearchCountryTags) {
              responseBody.config.orgSearchCountryTags['CN'] = ["HEI", "qualifying_hs", "qualifying_ps"];
            }

          }

          return new Response(JSON.stringify(responseBody), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        }
      } catch (e) {
        return response;
      }
    }
    return response;
  };

  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url;
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (body) {
    const xhr = this;

    if (xhr._url && (xhr._url.includes('/rest/v2/program/681044b7729fba7beccd3565/theme') ||
      xhr._url.includes('theme?locale=') ||
      xhr._url.includes('/rest/v2/program/') && xhr._url.includes('/theme'))) {
      const originalOnReadyStateChange = xhr.onreadystatechange;
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
          try {
            const responseBody = JSON.parse(xhr.responseText);

            if (responseBody && responseBody.config && Array.isArray(responseBody.config.countries)) {
              if (!responseBody.config.countries.includes('CN')) {
                const chIndex = responseBody.config.countries.indexOf('CH');
                if (chIndex !== -1) {
                  responseBody.config.countries.splice(chIndex + 1, 0, 'CN');
                } else {
                  responseBody.config.countries.push('CN');
                }

                if (responseBody.config.orgSearchCountryTags) {
                  responseBody.config.orgSearchCountryTags['CN'] = ["HEI", "qualifying_hs", "qualifying_ps"];
                }

              }

              Object.defineProperty(xhr, 'responseText', {
                get: function () {
                  return JSON.stringify(responseBody);
                }
              });
            }
          } catch (e) {
            console.error('oooooo:', e);
          }
        }

        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.apply(xhr);
        }
      };
    }

    return originalXHRSend.apply(this, [body]);
  };

  console.log('xixixixi');
})();