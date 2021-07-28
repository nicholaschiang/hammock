import { useEffect, useMemo, useRef, useState } from 'react';

import { Message } from 'lib/model/message';

const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

// Get the XPath node name.
function getNodeName(node: Node): string {
  switch (node.nodeName) {
    case '#text':
      return 'text()';
    case '#comment':
      return 'comment()';
    case '#cdata-section':
      return 'cdata-section()';
    default:
      return node.nodeName.toLowerCase();
  }
}

// Get the ordinal position of this node among its siblings of the same name.
function getNodePosition(node: Node): number {
  const { nodeName } = node;
  let position = 1;
  let n = node.previousSibling;
  while (n) {
    if (n.nodeName === nodeName) position += 1;
    n = n.previousSibling;
  }
  return position;
}

/**
 * @param node - The node for which to compute an XPath expression.
 * @param root - The root context for the XPath expression.
 * @return an XPath expression for the given node.
 */
export function xpathFromNode(node: Node, root: Node): string {
  let path = '/';
  let n: Node | null = node;
  while (n !== root) {
    if (!n) return '';
    // TODO: Disallow edge case where a user's highlight overlaps with an
    // existing highlight (this is the existing behavior over at Medium).
    if (n.nodeName.toLowerCase() !== 'mark')
      path = `/${getNodeName(n)}[${getNodePosition(n)}]${path}`;
    n = n.parentNode;
  }
  return path.replace(/\/$/, '');
}

interface XPath {
  start: string;
  startOffset: number;
  end: string;
  endOffset: number;
}

export interface ArticleProps {
  message?: Message;
}

// Handles highlighting and other annotations.
export default function Article({ message }: ArticleProps): JSX.Element {
  const [xpaths, setXPaths] = useState<XPath[]>([]);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    function listener(): void {
      const sel = window.getSelection() || document.getSelection();
      const range = sel?.getRangeAt(0);
      console.log('Range:', range);
      setXPaths((prev) => {
        if (!range || !ref.current) return prev;
        const { startContainer, endContainer, startOffset, endOffset } = range;
        const start = xpathFromNode(startContainer, ref.current);
        const end = xpathFromNode(endContainer, ref.current);
        return [...prev, { start, end, startOffset, endOffset }];
      });
    }
    window.addEventListener('mouseup', listener);
    return () => window.removeEventListener('mouseup', listener);
  }, []);
  const html = useMemo(() => {
    if (!canUseDOM || !xpaths.length || !message) return message?.html || '';
    const doc = new DOMParser().parseFromString(message.html, 'text/html');
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
  }, [xpaths, message]);

  return (
    <>
      {message && (
        <article ref={ref} dangerouslySetInnerHTML={{ __html: html }} />
      )}
      {!message && (
        <article>
          <p className='loading' />
          <p className='loading' />
          <p className='loading' />
        </article>
      )}
      <style jsx>{`
        p.loading {
          border-radius: 6px;
        }

        p.loading:nth-child(1) {
          height: 45px;
        }

        p.loading:nth-child(2) {
          height: 90px;
        }

        p.loading:nth-child(3) {
          height: 500px;
        }

        article :global(img) {
          max-width: 100%;
          height: auto;
          border: 1px solid var(--accents-2);
          background-color: var(--accents-1);
          display: block;
          margin: 1rem 0;
        }

        article :global(p) {
          font-size: 1rem;
          font-weight: 400;
          margin: 1rem 0;
        }

        article :global(a) {
          color: var(--accents-5);
        }

        article :global(strong) {
          font-weight: 600;
        }

        article :global(b) {
          font-weight: 600;
        }

        article :global(h1),
        article :global(h2),
        article :global(h3),
        article :global(h4),
        article :global(h5),
        article :global(h6) {
          font-size: 1rem;
          font-weight: 600;
          margin: 1rem 0;
        }

        article :global(h1) {
          font-size: 1.3rem;
        }

        article :global(h2) {
          font-size: 1.2rem;
        }

        article :global(h3) {
          font-size: 1.1rem;
        }

        article :global(mark) {
          color: var(--on-highlight);
          background: var(--highlight);
          user-select: none;
        }

        article :global(a mark) {
          color: var(--accents-5);
        }
      `}</style>
    </>
  );
}
