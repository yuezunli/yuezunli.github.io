async function loadHTML(id, file) {
  const response = await fetch(file);

  const html = await response.text();

  const container = document.getElementById(id);

  container.innerHTML = html;

  // 重新执行 script
  container.querySelectorAll("script").forEach((oldScript) => {
    const newScript = document.createElement("script");

    // 复制属性
    Array.from(oldScript.attributes).forEach((attr) => {
      newScript.setAttribute(attr.name, attr.value);
    });

    // 复制内容
    newScript.text = oldScript.text;

    // 替换
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}

/*
==========================================
  LOAD COMPONENTS
==========================================
*/

loadHTML("site-footer", "components/footer.html");
