import { useEffect, useMemo, useRef, useState } from 'react';

import { Message } from 'lib/model/message';

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
  const name = node.nodeName;
  let position = 1;
  while ((node = node.previousSibling)) {
    if (node.nodeName === name) position += 1;
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
  while (node !== root) {
    if (!node) return '';
    path = `/${getNodeName(node)}[${getNodePosition(node)}]${path}`;
    node = node.parentNode;
  }
  return path.replace(/\/$/, '');
}

export interface ArticleProps {
  message?: Message;
}

// Handles highlighting and other annotations.
export default function Article({ message }: ArticleProps): JSX.Element {
  const [range, setRange] = useState<Range>();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    function listener(): void {
      const sel = window.getSelection() || document.getSelection();
      console.log('Range:', sel?.getRangeAt(0));
      setRange(sel?.getRangeAt(0));
    }
    window.addEventListener('mouseup', listener);
    return () => window.removeEventListener('mouseup', listener);
  }, []);
  const xpath = useMemo(() => {
    if (!range || !ref.current) return;
    const start = xpathFromNode(range.startContainer, ref.current);
    const end = xpathFromNode(range.endContainer, ref.current);
    return {
      start,
      end,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
    };
  }, [range]);
  useEffect(() => console.log('Path:', xpath), [xpath]);
  useEffect(() => {
    // TODO: Instead of having this be an effect that manipulates the DOM
    // directly and thus uses the browser's Web APIs, I should instead simply
    // calculate the highlighted message HTML from the raw HTML string (parsing
    // it using `RegExp` or something lightweight like that).
    if (!ref.current || !xpath?.start) return;
    const { singleNodeValue: start } = document.evaluate(
      `.${xpath.start}`,
      ref.current,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE
    );
    console.log('Start Node:', start);
    const { singleNodeValue: end } = document.evaluate(
      `.${xpath.end}`,
      ref.current,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE
    );
    console.log('End Node:', end);
    window.start = start;
    window.end = end;
    if (!start || !end) return console.warn('No start and/or end nodes.');
    if (start === end) {
      const afterStart = start.splitText(xpath.startOffset);
      const afterEnd = afterStart.splitText(
        xpath.endOffset - xpath.startOffset
      );
      const span = document.createElement('span');
      span.className = 'highlight';
      span.innerHTML = afterStart.nodeValue;
      console.log('Highlighting:', afterStart);
      afterStart.parentNode.insertBefore(span, afterStart);
      afterStart.parentNode.removeChild(afterStart);
      return;
    }
    // Highlight everything in between.
    let next = start;
    while (!next.nextSibling && next.parentNode) next = next.parentNode;
    next = next.nextSibling as Node;
    while (next !== end && !next.contains(end)) {
      console.log('Highlighting:', next);
      if (next instanceof Element) {
        // TODO: Simply setting the `innerHTML` of e.g. a link overrides that
        // link's custom e.g. color styles with the highlight styles. This is
        // different from the behavior when an entire e.g. paragraph is wrapped
        // with the `<span>` tag (where link colors are preserved).
        next.innerHTML = `<span class='highlight'>${next.innerHTML}</span>`;
        while (!next.nextSibling && next.parentNode) next = next.parentNode;
        next = next.nextSibling as Node;
      } else {
        const span = document.createElement('span');
        span.className = 'highlight';
        span.innerHTML = next.nodeValue || '';
        next.parentNode.insertBefore(span, next);
        next.parentNode.removeChild(next);
        next = span;
        while (!next.nextSibling && next.parentNode) next = next.parentNode;
        next = next.nextSibling as Node;
      }
      console.log('Next:', next);
    }
    // Highlight all the stuff before the end text node.
    while (next !== end) {
      const childNodes = Array.from(next.childNodes);
      const endIdx = childNodes.findIndex((n) => n === end || n.contains(end));
      // Highlight all the siblings that do not contain the end text node.
      childNodes.forEach((n, idx) => {
        if (idx >= endIdx) return; // Only highlight stuff before the end node.
        console.log('Highlighting End:', n);
        if (n instanceof Element) {
          n.innerHTML = `<span class='highlight'>${n.innerHTML}</span>`;
        } else {
          const span = document.createElement('span');
          span.className = 'highlight';
          span.innerHTML = n.nodeValue || '';
          n.parentNode.insertBefore(span, n);
          n.parentNode.removeChild(n);
        }
      });
      // Keep highlighting until we reach the end text node.
      next = childNodes[endIdx];
      console.log('Next End:', next);
    }
    // Highlight the start text node.
    const afterStart = start.splitText(xpath.startOffset);
    const span = document.createElement('span');
    span.className = 'highlight';
    span.innerHTML = afterStart.nodeValue;
    afterStart.parentNode.insertBefore(span, afterStart);
    afterStart.parentNode.removeChild(afterStart);
    // Highlight the end text node.
    const afterEnd = end.splitText(xpath.endOffset);
    const spn = document.createElement('span');
    spn.className = 'highlight';
    spn.innerHTML = end.nodeValue;
    end.parentNode.insertBefore(spn, end);
    end.parentNode.removeChild(end);
  }, [xpath]);

  return (
    <>
      {message && (
        <article ref={ref} dangerouslySetInnerHTML={{ __html: message.html }} />
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

        article :global(.highlight) {
          color: var(--on-highlight);
          background: var(--highlight);
        }
      `}</style>
    </>
  );
}
