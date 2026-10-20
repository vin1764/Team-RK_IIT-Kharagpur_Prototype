// Field definitions for Add Single Catalog · "Add Product Details" (Water Bottles), in the order and
// two-column layout of catalog-product-details-1/2/3.png and catalog-other-attributes.png.
// The form renders from this list, so Phase 3 can pre-fill values by id and mark them "filled by the bot".
//
// Select options were NOT captured in the references. Each select gets a short, neutral placeholder
// list (PLACEHOLDER_OPTIONS below); only Size's "Free Size" comes from a screenshot.

export type FieldKind = 'text' | 'select' | 'textarea';
export type SectionId = 'inventory' | 'details' | 'other';

export interface FieldDef {
  id: string;
  label: string;
  section: SectionId;
  kind: FieldKind;
  mandatory: boolean;
  /** Shows the (i) icon. A string is the tooltip text; `true` = icon only (tooltip copy not captured). */
  info?: string | true;
  placeholder?: string;
  options?: string[];
  /** For unit pickers: the measurement field this unit belongs to (plan §7 "unit pickers"). */
  unitFor?: string;
  maxLength?: number;
}

const NUM = (xs: number[]) => xs.map(String);

/** Placeholder option sets (assumption: real lists not captured). */
export const PLACEHOLDER_OPTIONS: Record<string, string[]> = {
  size: ['Free Size'], // captured
  addOns: ['None', 'Cover', 'Strap'],
  capacity: ['0.5', '0.75', '1', '1.5', '2'],
  color: ['Black', 'Blue', 'Green', 'Grey', 'Pink', 'Red', 'Silver', 'White', 'Yellow', 'Multicolor'],
  genericName: ['Bottle', 'Water Bottle'],
  leakProof: ['Yes', 'No'],
  material: ['Plastic', 'Stainless Steel', 'Glass', 'Copper', 'Aluminium'],
  netQuantity: NUM([1, 2, 3, 4, 6]),
  breadth: NUM([5, 6, 7, 8, 10, 12, 15, 20, 25, 30]),
  height: NUM([5, 6, 7, 8, 10, 12, 15, 20, 25, 30]),
  length: NUM([5, 6, 7, 8, 10, 12, 15, 20, 25, 30]),
  productUnit: ['cm', 'inch'],
  productWeight: NUM([100, 200, 250, 300, 400, 500, 750, 1000]),
  productWeightUnit: ['g', 'kg'],
  type: ['Sports Bottle', 'Fridge Bottle', 'Insulated Bottle', 'Kids Bottle'],
  volumeUnit: ['ml', 'L'],
  countryOfOrigin: ['India'],
  brand: ['Generic'],
};

const sel = (id: string, label: string, section: SectionId, mandatory = true, info?: true, extra: Partial<FieldDef> = {}): FieldDef => ({
  id, label, section, kind: 'select', mandatory, info, placeholder: 'Select', options: PLACEHOLDER_OPTIONS[id], ...extra,
});
const txt = (id: string, label: string, section: SectionId, mandatory = true, info?: true, placeholder = `Enter ${label}`): FieldDef => ({
  id, label, section, kind: 'text', mandatory, info, placeholder,
});

export const FIELDS: FieldDef[] = [
  // ── Product, Size and Inventory ──
  txt('netWeight', 'Net Weight (gms)', 'inventory', true, true),
  txt('styleCode', 'Style code/ Product ID (optional)', 'inventory', false, true),
  txt('productName', 'Product Name', 'inventory', true, true),
  sel('size', 'Size', 'inventory'),
  // ── Product Details ──
  sel('addOns', 'Add Ons', 'details'),
  sel('capacity', 'Capacity In L', 'details'),
  sel('color', 'Color', 'details'),
  sel('genericName', 'Generic Name', 'details', true, true),
  sel('leakProof', 'Leak Proof', 'details'),
  sel('material', 'Material', 'details'),
  sel('netQuantity', 'Net Quantity (N)', 'details', true, true),
  sel('breadth', 'Product Breadth', 'details', true, true),
  sel('height', 'Product Height', 'details', true, true),
  sel('length', 'Product Length', 'details', true, true),
  sel('productUnit', 'Product Unit', 'details', true, true, { unitFor: 'breadth,height,length' }),
  sel('productWeight', 'Product Weight', 'details'),
  sel('productWeightUnit', 'Product Weight Unit', 'details', true, undefined, { unitFor: 'productWeight' }),
  sel('type', 'Type', 'details'),
  sel('volumeUnit', 'Volume Unit', 'details', true, undefined, { unitFor: 'capacity' }),
  sel('countryOfOrigin', 'COUNTRY OF ORIGIN', 'details', true, true),
  txt('manufacturerName', 'Manufacturer Name', 'details', true, true),
  txt('manufacturerAddress', 'Manufacturer Address', 'details', true, true),
  txt('manufacturerPincode', 'Manufacturer Pincode', 'details', true, true),
  txt('packerName', 'Packer Name', 'details', true, true),
  txt('packerAddress', 'Packer Address', 'details', true, true),
  txt('packerPincode', 'Packer Pincode', 'details', true, true),
  txt('importerName', 'Importer Name', 'details', true, true),
  txt('importerAddress', 'Importer Address', 'details', true, true),
  txt('importerPincode', 'Importer Pincode', 'details', true, true),
  // ── Other Attributes ──
  txt('bisNumber', 'BIS/ISI Certification Number', 'other', false, true),
  sel('brand', 'Brand', 'other', false),
  txt('cmlNumber', 'CM/L Number', 'other', false, true),
  { id: 'description', label: 'Description', section: 'other', kind: 'textarea', mandatory: false, info: true, placeholder: 'Enter Description', maxLength: 1400 },
];

export const SECTIONS: { id: SectionId; title: string }[] = [
  { id: 'inventory', title: 'Product, Size and Inventory' },
  { id: 'details', title: 'Product Details' },
  { id: 'other', title: 'Other Attributes' },
];

/** "Same as Manufacturer Details" copies these into the packer fields. */
export const PACKER_FROM_MANUFACTURER: Record<string, string> = {
  packerName: 'manufacturerName',
  packerAddress: 'manufacturerAddress',
  packerPincode: 'manufacturerPincode',
};

/** Error copy under an empty mandatory field (catalog-price-table-errors.png). */
export const mandatoryMessage = (label: string) => `Mandatory field, Please provide ${label}`;

/** Ids of mandatory fields left empty. */
export function missingFields(values: Record<string, string>): string[] {
  return FIELDS.filter((f) => f.mandatory && !(values[f.id] ?? '').trim()).map((f) => f.id);
}
