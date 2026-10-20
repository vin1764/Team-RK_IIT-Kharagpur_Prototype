// The panel's data table (Merlin Table) as used on the Meesho Warehouse page, ported
// class-for-class from reference/html/meesho-warehouse.html and fed from fees.ts.
import type { ReactNode } from 'react';
import { ONE_TIME, PER_UNIT, REVERSE_SHIPPING } from './fees';

const TH =
  'text-start border-[0.03125rem] border-t-0 border-tertiary-bg border-solid group-data-[with-header-divider=true]/table:border-secondary-border data-[is-last-column=true]:border-r-0 data-[is-first-column=true]:border-l-0 data-[is-basic-header=true]:text-sm data-[is-basic-header=true]:leading-4 data-[is-basic-header=true]:font-semibold data-[is-basic-header=true]:font-button data-[is-basic-header=true]:py-3 data-[is-basic-header=true]:px-3';
const TD = 'border-[0.03125rem] border-tertiary-border border-solid border-l-[0.0313rem] border-l-tertiary-border';
const TEXT = 'm-0 p-0 text-primary-text font-normal font-body text-lg leading-5';
const H6 = 'm-0 p-0 text-primary-text text-sm leading-4 font-semibold font-button';
const CELL = 'm-0 p-0 text-primary-text font-normal font-body text-base leading-4 flex-1 px-4 py-4';

type Col = { width: string; minWidth?: string; header: ReactNode; basic?: boolean };

function Table({ cols, children }: { cols: Col[]; children: ReactNode }) {
  return (
    <table aria-label="sticky table" className="group/table border-collapse w-full border-spacing-0 table-fixed" data-sticky-top="true" data-with-header-divider="true">
      <thead>
        <tr className="group-data-[sticky-top=true]/table:sticky group-data-[sticky-top=true]/table:top-0 bg-tertiary-bg" style={{ zIndex: 'var(--z-index-table-header)' }}>
          {cols.map((c, i) => (
            <th
              key={i}
              data-is-last-column={i === cols.length - 1}
              data-is-first-column={i === 0}
              data-is-basic-header={c.basic !== false}
              className={TH}
              style={{ width: c.width, minWidth: c.minWidth }}
            >
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Td({ i, n, width, minWidth, flush, children }: { i: number; n: number; width: string; minWidth?: string; flush?: boolean; children: ReactNode }) {
  return (
    <td className={`${TD} ${flush ? 'p-0' : 'py-3 px-3'}`} data-is-last-column={i === n - 1} data-is-first-column={i === 0} style={{ width, minWidth }}>
      {children}
    </td>
  );
}

export function PerUnitTable() {
  const cols: Col[] = [{ width: '240px', header: 'Per Unit Charges' }, ...PER_UNIT.slabs.map((s) => ({ width: '72px', header: s }))];
  return (
    <Table cols={cols}>
      {PER_UNIT.rows.map((r) => (
        <tr key={r.label} className="align-top">
          <Td i={0} n={cols.length} width="240px">
            <p className={TEXT}>{r.label}</p>
          </Td>
          {r.values.map((v, j) => (
            <Td key={j} i={j + 1} n={cols.length} width="72px">
              <p className={`${TEXT} text-right`}>{v}</p>
            </Td>
          ))}
        </tr>
      ))}
    </Table>
  );
}

export function ReverseShippingTable() {
  const cols: Col[] = [
    { width: '200px', minWidth: '200px', header: 'Courier Partner' },
    ...REVERSE_SHIPPING.slabs.map((s) => ({
      width: '180px',
      minWidth: '180px',
      basic: false,
      header: (
        <>
          <h6 className={`${H6} text-right py-2 px-3`}>{s}</h6>
          <div className="w-full h-[0.0625rem] border-b border-solid border-b-secondary-border border-l-0" role="separator" aria-orientation="horizontal" />
          <div className="flex items-center justify-between flex-row">
            <h6 className={`${H6} whitespace-nowrap text-center py-2 px-3 flex-1 border-0 border-r border-solid border-secondary-border box-border`}>Self Ship</h6>
            <h6 className={`${H6} py-2 px-3 text-center flex-1`}>Warehouse</h6>
          </div>
        </>
      ),
    })),
  ];
  return (
    <Table cols={cols}>
      {REVERSE_SHIPPING.rows.map((r) => (
        <tr key={r.courier} className="align-top">
          <Td i={0} n={cols.length} width="200px" minWidth="200px">
            <p className={TEXT}>{r.courier}</p>
          </Td>
          {r.values.map(([self, wh], j) => (
            <Td key={j} i={j + 1} n={cols.length} width="180px" minWidth="180px" flush>
              <div className="flex flex-row items-center justify-between w-full">
                <p className={`${CELL} border-0 border-r border-solid border-tertiary-bg`}>{self}</p>
                <p className={CELL}>{wh}</p>
              </div>
            </Td>
          ))}
        </tr>
      ))}
    </Table>
  );
}

export function OneTimeTable() {
  const cols: Col[] = [
    { width: '195px', header: 'One Time Charges (Per Warehouse Location)' },
    { width: '58px', header: null },
  ];
  return (
    <Table cols={cols}>
      {ONE_TIME.map((r) => (
        <tr key={r.label} className="align-top">
          <Td i={0} n={2} width="195px">
            <p className={TEXT}>{r.label}</p>
          </Td>
          <Td i={1} n={2} width="58px">
            <p className={TEXT}>{r.value}</p>
          </Td>
        </tr>
      ))}
    </Table>
  );
}
