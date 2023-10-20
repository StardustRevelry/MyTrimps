// 不同语言对应的翻译文件的位置或url
const i18n_urls = {
  "en": "loc/en.json",
  "zh": "loc/zh_cn.json"
};
// 不同语言代码
const langCodeMap = {
  0: "zh",
  1: "en"
}

let i18n_data = {};

// 定义一个变量，存储当前选择的语言，默认为英文
let current_lang = langCodeMap[game.options.menu.i18n.enabled];
let i18n_inited = false;
// console.log(current_lang,game.options.menu.i18n);

// 定义一个函数，用来根据当前选择的语言加载翻译文件，并替换网站中的文本
function translate() {
  // 获取当前选择的语言对应的翻译文件的URL
  const i18n_url = i18n_urls[current_lang];
  // 发送异步请求获取翻译文件
  fetch(i18n_url)
    .then(function(response) {
      // 如果请求成功，返回响应内容
      return response.text();
    })
    .then(function(data) {
      // 如果响应内容存在，解析为JSON对象
      i18n_data = JSON.parse(data);
      console.log(i18n_data);
      // 遍历网站中的所有元素
      const elements = document.querySelectorAll("*");
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (!element.hasAttribute("data-i18n")) continue;
        // 如果当前元素有data-i18n属性, 则根据data-i18n属性的值替换当前元素的文本内容
        const i18n_key = element.getAttribute("data-i18n");
        // 获取内容的键和替换方法
        const [key, method] = i18n_key.split(':');
        let ob; // Mutation observer

        if (!i18n_data.hasOwnProperty(key)) continue; // 忽略没有翻译的文本

        /**如果翻译文件中有对应的值，则替换当前元素的文本内容
         * 替换方法:
         * null - 直接替换
         * multi - 该元素的文本有多个对应值，需要监听变化
         * re - 该元素的文本为动态值，需要监听变化，并使用正则表达式替换
         */
        if (method ==='multi') {
          // console.log(key)
          element.textContent = i18n_data[key][element.textContent];
          // 如果已经初始化了，就不需要监听了
          if (i18n_inited) continue;
          ob = new MutationObserver(function (mutations) {
            // 获取新的文本
            const node = mutations[0].addedNodes[0];
            const newText = node?.textContent;
            const key = node.parentNode?.getAttribute("data-i18n").split(":")[0];
            // 若翻译不为空则使用翻译文本，否则不替换
            node.textContent = i18n_data?.[key]?.[newText] === '' || i18n_data[key]?.[newText] === undefined ?
              node.textContent : i18n_data?.[key]?.[newText];
          });
          ob.observe(element, {
            attributes: false,
            characterData: true,
            childList: true,
          });
        }
        else if (method ==='re') {
          // console.log(key)
          element.textContent = element.textContent.replace(new RegExp(i18n_data[key][0], 'g'), i18n_data[key][1]);
          if (i18n_inited) continue;
          ob = new MutationObserver(function (mutations) {
            // 获取新的文本
            const node = mutations[0].addedNodes[0];
            const newText = node?.textContent;
            const key = node.parentNode?.getAttribute("data-i18n").split(":")[0];
            // 替换文本
            if (i18n_data[key] instanceof Array)
              node.textContent = newText.replace(new RegExp(i18n_data[key][0], 'g'), i18n_data[key][1])
          });
          ob.observe(element, {
            attributes: false,
            characterData: true,
            childList: true,
          })
        }
        else if (method === undefined) {
          if (element.childNodes.length === 1) {
            element.textContent = i18n_data[key] === '' || i18n_data[key] === undefined ? element.textContent : i18n_data[key];
          }
          else {
            const i18n_texts = i18n_data[key] instanceof Array ? i18n_data[key] : [i18n_data[key]];
            let text_index = 0;
            for (const item in element.childNodes){
              // 判断是否是文本节点
              if (element.childNodes[item].nodeType === 3){
                element.childNodes[item].replaceWith(i18n_texts[text_index]);
                text_index ++;
                if (text_index>=i18n_texts.length) break
              }
            }
          }
        }
      }
      // 初始化成功
      i18n_inited = true;
    })
    .catch(function(error) {
      // 如果请求失败，打印错误信息
      console.error(error);
    });
}

// 切换语言
function handleLangChange(code) {
  const lang = langCodeMap[code];
  if (lang === current_lang) return;
  if (i18n_urls.hasOwnProperty(lang)) {
    current_lang = lang;
    translate();
  }
}

// 首次调用
translate();
