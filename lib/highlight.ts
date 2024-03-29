import { captureException } from '@sentry/nextjs';

import { Highlight } from 'lib/model/highlight';

const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

/**
 * @param html - The unhighlighted message HTML.
 * @param highlights - An array of XPath selections to highlight.
 * @return The highlighted message HTML.
 */
export default function highlightHTML(
  html: string,
  highlights: Highlight[]
): string {
  if (!canUseDOM || !highlights.length || !html) return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  highlights.forEach((highlight) => {
    try {
      let { startOffset, endOffset } = highlight;
      let { singleNodeValue: start } = doc.evaluate(
        `.${highlight.start}`,
        doc.body,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE
      );
      let { singleNodeValue: end } = doc.evaluate(
        `.${highlight.end}`,
        doc.body,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE
      );
      // We're missing a start/end node because the user tried to highlight over
      // an existing highlight and thus the `xpathFromNode` function returned an
      // `xpath` without the `<mark>` tag included. Thus, `doc.evaluate` couldn't
      // find the node that the `xpath` pointed to (because the `xpath` is wrong).
      if (!start || !end) return;
      while (!(start instanceof Text)) {
        start = start.childNodes[startOffset];
        startOffset = 0;
      }
      const endIsText = end instanceof Text;
      while (!(end instanceof Text)) {
        end = end.childNodes[endOffset - 1];
        endOffset = end.childNodes.length;
      }
      if (!endIsText) endOffset = end.length;
      if (start === end) {
        const afterStart = start.splitText(startOffset);
        afterStart.splitText(endOffset - startOffset);
        const mark = doc.createElement('mark');
        mark.dataset.highlight = highlight.id.toString();
        if (highlight.deleted) mark.dataset.deleted = '';
        mark.innerHTML = afterStart.nodeValue || '';
        afterStart.parentNode?.insertBefore(mark, afterStart);
        afterStart.parentNode?.removeChild(afterStart);
        return;
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
        mark.dataset.highlight = highlight.id.toString();
        if (highlight.deleted) mark.dataset.deleted = '';
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
      const afterStart = start.splitText(startOffset);
      const mark = doc.createElement('mark');
      mark.dataset.highlight = highlight.id.toString();
      if (highlight.deleted) mark.dataset.deleted = '';
      mark.innerHTML = afterStart.nodeValue || '';
      afterStart.parentNode?.insertBefore(mark, afterStart);
      afterStart.parentNode?.removeChild(afterStart);
      // Highlight the end text node.
      const afterEnd = end.splitText(endOffset);
      const mk = doc.createElement('mark');
      mk.dataset.highlight = highlight.id.toString();
      if (highlight.deleted) mk.dataset.deleted = '';
      mk.innerHTML = end.nodeValue || '';
      end.parentNode?.insertBefore(mk, afterEnd);
      end.parentNode?.removeChild(end);
    } catch (e) {
      captureException(e);
    }
  });
  // Return the highlighted HTML.
  return doc.body.innerHTML;
}
