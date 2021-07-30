export interface XPath {
  start: string;
  startOffset: number;
  end: string;
  endOffset: number;
  id: string;
  deleted?: boolean;
}

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
export function fromNode(node: Node, root: Node): string {
  let path = '/';
  let n: Node | null = node;
  while (n !== root) {
    if (!n) return '';
    path = `/${getNodeName(n)}[${getNodePosition(n)}]${path}`;
    n = n.parentNode;
  }
  return path.replace(/\/$/, '');
}
