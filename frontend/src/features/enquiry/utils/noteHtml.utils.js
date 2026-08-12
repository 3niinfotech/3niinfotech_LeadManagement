const ALLOWED = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'SPAN']);

export function stripHtml(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent?.trim() || '';
}

export function sanitizeNoteHtml(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child;
        if (!ALLOWED.has(el.tagName)) {
          const text = document.createTextNode(el.textContent || '');
          el.replaceWith(text);
          return;
        }
        [...el.attributes].forEach((attr) => {
          if (attr.name === 'data-mention-id' || attr.name === 'class') return;
          el.removeAttribute(attr.name);
        });
        if (el.tagName === 'SPAN') {
          el.className = 'crm-mention';
        }
        walk(el);
      }
    });
  };
  walk(doc.body);
  return doc.body.innerHTML.trim();
}

export function execFormat(command, value = null) {
  document.execCommand(command, false, value);
}
