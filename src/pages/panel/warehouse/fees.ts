// Meesho Warehouse published fees, copied verbatim from reference/html/meesho-warehouse.html.
// These are real published values: do not edit without a new snapshot.

/** Warehouse Fees: per-unit charges by weight slab. */
export const PER_UNIT = {
  slabs: ['Upto 150 gms', '151-500 gms', '501-1000 gms', '1001-2000 gms', 'Above 2000 gms'],
  rows: [
    { label: 'Delivered Orders (Local Zones < 500km from Warehouse)', values: ['₹4', '₹10', '₹13.50', '₹28', '₹38'] },
    { label: 'Delivered Orders (National Zones > 500km from Warehouse)', values: ['₹15', '₹20', '₹27', '₹40', '₹67'] },
    { label: 'Return Orders', values: ['₹12.75', '₹14', '₹14.75', '₹20.50', '₹20.50'] },
    { label: 'Charges for SKUs with inventory unsold for over 30 days', values: ['₹7.50', '₹17', '₹28', '₹50', '₹104'] },
    { label: 'B2B reject fee', values: ['₹4', '₹11', '₹17', '₹30', '₹66'] },
    { label: 'RTO processing fee / Storage fee / Insurance charges', values: ['FREE', 'FREE', 'FREE', 'FREE', 'FREE'] },
  ],
};

/** Reverse Shipping Fees by courier: [Self Ship, Warehouse] per weight slab. */
export const REVERSE_SHIPPING = {
  slabs: ['Upto 500 gms', '501-1000 gms', '1001-1500 gms', '1501-2000 gms', '2001-2500 gms'],
  rows: [
    { courier: 'valmo', values: [['₹153', '₹145'], ['₹163', '₹155'], ['₹169', '₹161'], ['₹184', '₹176'], ['₹202', '₹194']] },
    { courier: 'xpressbees', values: [['₹155', '₹147'], ['₹165', '₹157'], ['₹171', '₹163'], ['₹186', '₹178'], ['₹204', '₹196']] },
    { courier: 'shadowfax', values: [['₹162', '₹154'], ['₹172', '₹164'], ['₹178', '₹170'], ['₹192', '₹184'], ['₹210', '₹202']] },
    { courier: 'delhivery', values: [['₹161', '₹153'], ['₹203', '₹195'], ['₹244', '₹236'], ['₹290', '₹282'], ['₹340', '₹332']] },
    { courier: 'ecom', values: [['₹165', '₹157'], ['₹175', '₹167'], ['₹181', '₹173'], ['₹196', '₹188'], ['₹213', '₹205']] },
  ] as Array<{ courier: string; values: Array<[string, string]> }>,
};

/** One Time Charges per Warehouse Location. */
export const ONE_TIME = [
  { label: 'GST + APOB', value: '₹9999 + GST' },
  { label: 'VPOB Renewal', value: '₹8000 + GST' },
  { label: 'Only APOB', value: '₹500 + GST' },
];
