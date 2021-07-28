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
    console.log('XPath:', xpath);
    const { singleNodeValue: start } = doc.evaluate(
      `.${xpath.start}`,
      doc.body,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE
    );
    console.log('Start Node:', start);
    const { singleNodeValue: end } = doc.evaluate(
      `.${xpath.end}`,
      doc.body,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE
    );
    console.log('End Node:', end);
    if (!start || !end) return console.warn('No start and/or end nodes.');
    if (!(start instanceof Text)) return console.warn('Start not text node.');
    if (!(end instanceof Text)) return console.warn('End not text node.');
    if (start === end) {
      const afterStart = start.splitText(xpath.startOffset);
      afterStart.splitText(xpath.endOffset - xpath.startOffset);
      const mark = doc.createElement('mark');
      mark.innerHTML = afterStart.nodeValue || '';
      console.log('Highlighting:', afterStart);
      afterStart.parentNode?.insertBefore(mark, afterStart);
      afterStart.parentNode?.removeChild(afterStart);
      return console.log('No highlight traversion necessary.');
    }
    // Highlight everything in between.
    let next: Node = start;
    while (!next.nextSibling && next.parentNode) next = next.parentNode;
    next = next.nextSibling as Node;
    while (true) {
      while (next.firstChild) next = next.firstChild;
      if (next === end) break;
      console.log('Highlighting:', next);
      const mark = doc.createElement('mark');
      mark.innerHTML =
        next instanceof Element ? next.outerHTML : next.nodeValue || '';
      next.parentNode?.insertBefore(mark, next);
      next.parentNode?.removeChild(next);
      next = mark;
      while (!next.nextSibling && next.parentNode) next = next.parentNode;
      next = next.nextSibling as Node;
      console.log('Next:', next);
    }
    // Highlight the start text node.
    const afterStart = start.splitText(xpath.startOffset);
    const mark = doc.createElement('mark');
    mark.innerHTML = afterStart.nodeValue || '';
    afterStart.parentNode?.insertBefore(mark, afterStart);
    afterStart.parentNode?.removeChild(afterStart);
    // Highlight the end text node.
    const afterEnd = end.splitText(xpath.endOffset);
    const mk = doc.createElement('mark');
    mk.innerHTML = end.nodeValue || '';
    end.parentNode?.insertBefore(mk, afterEnd);
    end.parentNode?.removeChild(end);
  });
  // Return the highlighted HTML.
  return doc.body.innerHTML;
}
