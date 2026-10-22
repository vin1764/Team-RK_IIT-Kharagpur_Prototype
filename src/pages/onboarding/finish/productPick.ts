// "What do you make?" on the onboarding finish screen: Meesho's own category data (src/data/categories.json,
// the tree Add Single Catalog uses) plus the product types the prototype has numbers for
// (src/data/productTypes.json `categoryPath`). A leaf maps to a product type only when a type's
// categoryPath is exactly that leaf; any other leaf is a valid answer with no demand data.
import data from '../../../data/productTypes.json';
import type { ProductTypeId } from '../../../engine/ui';
import { productTypeName } from '../../../engine/ui';
import { botTypeFor } from '../../panel/catalog/bot';
import { nodeAt, searchLeaves, type LeafHit } from '../../panel/catalog/categories';

const TYPES = Object.entries(data as Record<string, { categoryPath?: string[] }>)
  .filter(([id, v]) => !id.startsWith('_') && Array.isArray(v.categoryPath))
  .map(([id, v]) => ({ id: id as ProductTypeId, path: v.categoryPath! }));

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/** The product type behind a category path, or null. */
export function typeForPath(path: string[]): ProductTypeId | null {
  return TYPES.find((t) => same(t.path, path))?.id ?? null;
}

/** The category path of a product type, or null. */
export function pathForType(type: ProductTypeId): string[] | null {
  return TYPES.find((t) => t.id === type)?.path ?? botTypeFor(type)?.categoryPath ?? null;
}

/**
 * Search box hits: the tree's leaves (same as Add Single Catalog's "Search Category") plus product types
 * whose category isn't in the captured tree (e.g. Men Fashion › Footwear › Casual Shoes), matched on the
 * type's name or its leaf.
 */
export function searchProducts(q: string): LeafHit[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const extra = TYPES.filter((t) => !nodeAt(t.path))
    .filter((t) => productTypeName(t.id).toLowerCase().includes(s) || t.path.at(-1)!.toLowerCase().includes(s))
    .map((t) => ({ path: t.path, leaf: productTypeName(t.id), root: t.path[0]! }));
  return [...searchLeaves(q), ...extra];
}

/**
 * What the bot recognises from one photo: in this prototype only the product it has bot data for (the
 * persona's own, Jasmeet's 1 L bottle). Anything else isn't recognised: the maker picks the category instead.
 */
export function recognisedType(own: ProductTypeId | null | undefined): ProductTypeId | null {
  return own && botTypeFor(own) ? own : null;
}
