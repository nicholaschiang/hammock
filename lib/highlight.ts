import { XPath } from 'lib/xpath';

const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

/**
 * @param html - The unhighlighted message HTML.
 * @param xpaths - An array of XPath selections to highlight.
 * @return The highlighted message HTML.
 */
export default function highlight(html: string, xpaths: XPath[]): string {
  if (!canUseDOM || !xpaths.length || !html) return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  xpaths.forEach((xpath) => {
    const { singleNodeValue: start } = doc.evaluate(
      `.${xpath.start}`,
      doc.body,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE
    );
    const { singleNodeValue: end } = doc.evaluate(
      `.${xpath.end}`,
      doc.body,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE
    );
    // We're missing a start/end node because the user tried to highlight over
    // an existing highlight and thus the `xpathFromNode` function returned an
    // `xpath` without the `<mark>` tag included. Thus, `doc.evaluate` couldn't
    // find the node that the `xpath` pointed to (because the `xpath` is wrong).
    if (!start || !end) return console.warn('No start and/or end nodes.');
    if (!(start instanceof Text)) return console.warn('Start not text node.');
    if (!(end instanceof Text)) return console.warn('End not text node.');
    if (start === end) {
      const afterStart = start.splitText(xpath.startOffset);
      afterStart.splitText(xpath.endOffset - xpath.startOffset);
      const mark = doc.createElement('mark');
      mark.dataset.xpath = xpath.id;
      if (xpath.deleted) mark.dataset.deleted = '';
      mark.innerHTML = afterStart.nodeValue || '';
      afterStart.parentNode?.insertBefore(mark, afterStart);
      afterStart.parentNode?.removeChild(afterStart);
      return console.log('No highlight traversion necessary.');
    }
    // Highlight everything in between.
    let next: Node = start;
    while (!next.nextSibling && next.parentNode) next = next.parentNode;
    next = next.nextSibling as Node;
    while (true) {
      // Keep going down until we get to a node without any children.
      while (next.firstChild) next = next.firstChild;
      // If we've reached the end text node, we're done.
      if (next === end) break;
      // Otherwise, highlight this node.
      const mark = doc.createElement('mark');
      mark.dataset.xpath = xpath.id;
      if (xpath.deleted) mark.dataset.deleted = '';
      mark.innerHTML =
        next instanceof Element ? next.outerHTML : next.nodeValue || '';
      next.parentNode?.insertBefore(mark, next);
      next.parentNode?.removeChild(next);
      next = mark;
      // Keep going up until we get to a node with a next sibling.
      while (!next.nextSibling && next.parentNode) next = next.parentNode;
      // Highlight the next node.
      next = next.nextSibling as Node;
    }
    // Highlight the start text node.
    const afterStart = start.splitText(xpath.startOffset);
    const mark = doc.createElement('mark');
    mark.dataset.xpath = xpath.id;
    if (xpath.deleted) mark.dataset.deleted = '';
    mark.innerHTML = afterStart.nodeValue || '';
    afterStart.parentNode?.insertBefore(mark, afterStart);
    afterStart.parentNode?.removeChild(afterStart);
    // Highlight the end text node.
    const afterEnd = end.splitText(xpath.endOffset);
    const mk = doc.createElement('mark');
    mk.dataset.xpath = xpath.id;
    if (xpath.deleted) mk.dataset.deleted = '';
    mk.innerHTML = end.nodeValue || '';
    end.parentNode?.insertBefore(mk, afterEnd);
    end.parentNode?.removeChild(end);
  });
  // Return the highlighted HTML.
  return doc.body.innerHTML;
}
