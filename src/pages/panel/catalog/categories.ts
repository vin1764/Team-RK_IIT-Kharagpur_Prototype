// Category tree for the catalog flows (src/data/categories.json). Only nodes visible in the
// references are included; a node without `children` simply wasn't captured.
import data from '../../../data/categories.json';

export interface CategoryNode {
  name: string;
  children?: CategoryNode[];
  /** Sample photo shown in the right-hand preview for a leaf (cropped from the screenshots). */
  sample?: { src: string; w: number; h: number };
}

export const CATEGORY_TREE = data.tree as CategoryNode[];
/** The panel's tree is four levels deep: super-category › category › sub-category › leaf. */
export const LEAF_DEPTH = 4;

/** Nodes for each visible column, given the selected path (names). */
export function columnsFor(path: string[]): CategoryNode[][] {
  const cols: CategoryNode[][] = [CATEGORY_TREE];
  let level = CATEGORY_TREE;
  for (const name of path) {
    const node = level.find((n) => n.name === name);
    if (!node?.children) break;
    cols.push(node.children);
    level = node.children;
  }
  return cols;
}

export function nodeAt(path: string[]): CategoryNode | undefined {
  let level = CATEGORY_TREE;
  let node: CategoryNode | undefined;
  for (const name of path) {
    node = level.find((n) => n.name === name);
    if (!node) return undefined;
    level = node.children ?? [];
  }
  return node;
}

export const isLeafPath = (path: string[]) => path.length === LEAF_DEPTH && !!nodeAt(path);

export interface LeafHit {
  path: string[];
  leaf: string;
  root: string;
}

/** Every leaf in the data, with its full path. */
export const ALL_LEAVES: LeafHit[] = (() => {
  const out: LeafHit[] = [];
  const walk = (nodes: CategoryNode[], trail: string[]) => {
    for (const n of nodes) {
      const p = [...trail, n.name];
      if (p.length === LEAF_DEPTH) out.push({ path: p, leaf: n.name, root: p[0]! });
      else if (n.children) walk(n.children, p);
    }
  };
  walk(CATEGORY_TREE, []);
  return out;
})();

/** Search box: leaves whose name contains the query (case-insensitive). */
export function searchLeaves(q: string): LeafHit[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return ALL_LEAVES.filter((h) => h.leaf.toLowerCase().includes(s));
}
