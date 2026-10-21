// Meesho Warehouse: faithful replica of reference/html/meesho-warehouse.html.
// Fee values live in ./warehouse/fees.ts, copied verbatim from the snapshot.
import { MeeshoWarehouseCard } from './warehouse/MeeshoWarehouseCard';
import { ClusterPackPoint } from './warehouse/ClusterPackPoint';
import { OneTimeTable, PerUnitTable, ReverseShippingTable } from './warehouse/FeeTable';

const BENEFITS = [
  { icon: '📈', title: 'Grow Sales by 9%-11%', body: 'Benefits from Meesho’s upto Rs 5 customer discount without affecting your margins' },
  { icon: '🛡️', title: '100% Protection from RTO & Return Frauds', body: 'Enjoy peace of mind with guaranteed approval on all valid claims' },
  {
    icon: <img src="/brand/msa/merlin/filled/return-orders-v2.svg" alt="" width="40" height="40" />,
    title: 'Reduce Returns, RTOs & Cancellations by 6-7%',
    body: 'Reduce damage related returns with our expert handling',
  },
  // "perfomrance" is the live copy, typo included.
  { icon: '🚀', title: 'Supercharge Operations', body: 'Access real-time inventory tracking and perfomrance insights' },
];

const H2 = 'm-0 p-0 text-primary-text font-bold font-heading text-3xl leading-6 text-center';

export default function Warehouse() {
  return (
    <>
      <header
        className="flex items-center gap-2.5 text-primary-text shadow-md sticky z-100 min-h-0 p-3 bg-white justify-start"
        style={{ top: 'var(--concept-strip-h)' }}
        role="heading"
        aria-level={1}
      >
        <h1 className="m-0 p-0 text-primary-text font-bold font-heading text-4xl leading-7">Meesho Warehouse</h1>
      </header>

      {/* Fulfilment options: Meesho Warehouse as captured, then (Pack Point makers) the Cluster Pack Point program (C2M PP-3 … PP-5). */}
      <MeeshoWarehouseCard />
      <ClusterPackPoint />

      <div className="flex flex-col items-center justify-center gap-8 mb-4 bg-white py-4 px-18 pb-8 rounded-lg border-2 border-solid border-secondary-bg max-[481px]:p-4 max-[481px]:m-4 max-[481px]:items-start">
        <h2 className={H2}>Benefits of Meesho Warehouse</h2>
        <div className="grid grid-cols-2 gap-x-16 gap-y-8 max-[481px]:grid-cols-1">
          {BENEFITS.map((b, i) => (
            <div key={b.title} className="flex items-center gap-2" data-testid={`benefit-item-${i}`}>
              <div className="flex items-center justify-center bg-secondary-bg w-17 h-17 rounded-md text-[2.5rem] max-[481px]:w-13.5 max-[481px]:h-13.5 max-[481px]:text-[1.875rem]">
                {b.icon}
              </div>
              <div className="w-full">
                <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6">{b.title}</h3>
                <p className="m-0 p-0 text-primary-text font-normal font-body text-lg leading-5">{b.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col py-4 px-8 pb-8 border border-solid border-secondary-bg bg-white rounded-lg gap-6 max-[481px]:p-4">
        <h2 className={H2}>Warehouse Fees</h2>
        <div className="overflow-x-auto">
          <PerUnitTable />
        </div>
        <h2 className={H2}>Reverse Shipping Fees</h2>
        <div className="overflow-x-auto">
          <ReverseShippingTable />
        </div>
        <h2 className={H2}>One Time Charges per Warehouse Location</h2>
        <div className="w-[70%] overflow-x-auto max-[481px]:w-full">
          <OneTimeTable />
        </div>
      </div>
    </>
  );
}
