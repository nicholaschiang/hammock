import {
  FilterXSS,
  cssFilter,
  onIgnoreTagAttr,
  onTagAttr,
  parseAttr,
  safeAttrValue,
} from 'xss';

import whiteList from 'lib/api/xss/whitelist';

function spaceIndex(str: string): number {
  const reg = /\s|\n|\t/;
  const match = reg.exec(str);
  return match ? match.index : -1;
}

/**
 * Get attributes for a tag.
 *
 * @param {String} html
 * @return {Object}
 *   - {String} html
 *   - {Boolean} closing
 */
function getAttrs(html: string): { html: string; closing: boolean } {
  const idx = spaceIndex(html);
  if (idx < 0) return { html: '', closing: html[html.length - 2] === '/' };
  html = html.slice(idx + 1, -1).trim();
  const isClosing = html[html.length - 1] === '/';
  if (isClosing) html = html.slice(0, -1).trim();
  return { html, closing: isClosing };
}

export default new FilterXSS({
  whiteList,
  stripIgnoreTag: true,
  onTag(tag: string, html: string, options): string | undefined {
    // Parse the tag normally if it isn't an opening anchor (`<a>`) tag.
    if (tag !== 'a' || options.isClosing) return;

    // Parse the existing attributes into HTML.
    const attrs = getAttrs(html);
    const attrsHtml = parseAttr(attrs.html, (name: string, value: string) => {
      // Skip attributes that we will specify (`target` and `rel`).
      if (name === 'target' || name === 'rel') return '';
      // Otherwise, perform attribute sanitization as normal.
      // See: https://git.io/J35a9
      const isWhiteAttr = !!whiteList[tag]?.includes(name);
      const attr = onTagAttr(tag, name, value, isWhiteAttr);
      if (attr !== undefined && attr !== null) return attr;
      if (isWhiteAttr) {
        const val = safeAttrValue(tag, name, value, cssFilter);
        if (val) return `${name}="${val}"`;
        return name;
      }
      return onIgnoreTagAttr(tag, name, value, isWhiteAttr) || '';
    });

    // Build the sanitized HTML tag (and add our required attributes).
    let sanitized = `<${tag} target="_blank" rel="noopener noreferrer"`;
    if (attrsHtml) sanitized += ` ${attrsHtml}`;
    if (attrs.closing) sanitized += ' /';
    return `${sanitized}>`;
  },
});
