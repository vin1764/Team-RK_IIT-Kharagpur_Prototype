// Notice board content, copied from reference/html/meesho-notices.html (dates as captured).
// The bodies are Meesho's CMS HTML; inline styles are kept as-is so they render the same.
// The orange CTAs linked to supplier.meesho.com; here they only show a "not in prototype" toast.
import type { CSSProperties, ReactNode } from 'react';
import { notInPrototype } from '../../../components/Toast';

const CTA_STYLE: CSSProperties = {
  display: 'inline-block',
  marginTop: '12px',
  padding: '12px 24px',
  backgroundColor: '#FF9D00',
  color: 'white',
  textDecoration: 'none',
  fontSize: '18px',
  fontWeight: 'bold',
  fontFamily: 'var(--font-heading)', // see Notices.tsx: bold on the Book face
  borderRadius: '8px',
  cursor: 'pointer',
};
const IMG_STYLE: CSSProperties = { width: 'auto', maxWidth: '100%', height: 'auto' };
const H1_STYLE: CSSProperties = { fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' };

function Cta({ children }: { children: string }) {
  return (
    <a
      role="button"
      tabIndex={0}
      style={CTA_STYLE}
      onClick={() => notInPrototype(children)}
      onKeyDown={(e) => e.key === 'Enter' && notInPrototype(children)}
    >
      {children}
    </a>
  );
}

/** Image + CTA straight in the body (no centred wrapper). */
function Poster({ src, cta = 'Check Now!' }: { src: string; cta?: string }) {
  return (
    <>
      <img src={src} alt={cta} style={IMG_STYLE} />
      <br />
      <Cta>{cta}</Cta>
    </>
  );
}

/** Centred wrapper with an (often empty) h1 above the image, as Meesho's template has it. */
function CentredPoster({ src, heading, h1 = true, cta = 'Check Now!', alt = cta }: { src: string; heading?: string; h1?: boolean; cta?: string; alt?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      {h1 && <h1 style={H1_STYLE}>{heading}</h1>}
      <img src={src} alt={alt} style={IMG_STYLE} />
      <br />
      <Cta>{cta}</Cta>
    </div>
  );
}

export type Notice = { title: string; date: string; body: ReactNode };

export const NOTICES: Notice[] = [
  {
    title: 'MAHA DIWALI SALE',
    date: 'Oct 20 2026',
    body: <Poster src="/brand/mimg/images/products-upload/1792133532133/613x313611.jpg" />,
  },
  {
    title: 'IMPORTANT: Deadline for FY 2025–26 TDS Reimbursement Claims (31st Oct 2026)',
    date: 'Oct 09 2026',
    body: (
      <p>
        Dear Sellers,
        <br />
        <br />
        You are requested to claim all pending TDS reimbursements pertaining to FY 2025–26 on or before <strong>31 October 2026</strong>.
        <br />
        Please ensure that all tickets related to pending TDS reimbursement are raised within the above mentioned{' '} timeline.
        <br />
        <br />
        <strong>Please note:</strong> Any tickets raised after 31 October 2026 will be rejected, and no reimbursement will be processed against such
        claims.
        <br />
        All sellers are advised to take note of this deadline and complete the necessary formalities within the specified timeline to avoid any
        inconvenience.
      </p>
    ),
  },
  {
    title: 'MEGA BLOCKBUSTER SALE: Inventory Update Required – Refill Your Stocks Before 9th Oct!',
    date: 'Oct 08 2026',
    body: <CentredPoster src="/brand/mimg/images/products-upload/1791351018112/inventory_sale_ready_MBS.png" />,
  },
  {
    title: 'MEGA BLOCKBUSTER SALE: Mandatory Sunday Working & Pickup Notice (11th & 18th Oct)',
    date: 'Oct 07 2026',
    body: <Poster src="/brand/mimg/images/marketing/1791370302182.jpg" />,
  },
  {
    title: 'MEGA BLOCKBUSTER SALE: Essential Supplier Guidelines (09–18th Oct)',
    date: 'Oct 07 2026',
    body: <CentredPoster src="/brand/mimg/images/marketing/1791370434962.jpg" h1={false} />,
  },
  {
    title: 'Sale starts from 9th Oct !!',
    date: 'Oct 06 2026',
    body: <CentredPoster src="/brand/mimg/images/products-upload/1791180925461/poster1_2hrs_noext.jpg" />,
  },
  {
    title: 'Sale starts from 9th Oct !!',
    date: 'Sep 28 2026',
    body: <CentredPoster src="/brand/mimg/images/products-upload/1790438636502/613x31345.jpg" />,
  },
  {
    title: 'MEGA BLOCKBUSTER SALE IS COMING!',
    date: 'Sep 26 2026',
    body: (
      <>
        <p>
          <strong>
            Important Pricing Update for Suppliers
            <br />
          </strong>
          <br />
          To ensure sale readiness and pricing stability, price increase requests will not be accepted from 29 Sept 2026 until 02 Nov 2026.
        </p>
        <p>
          <strong>
            Action Required
            <br />
          </strong>
          <br />
          To increase prices before 29 Sept 2026, please raise a support ticket by following:
          <br />
          Supplier Panel -&gt; Support -&gt; Help -&gt; Cataloging &amp; Pricing -&gt; I want to change price of a product/catalog
        </p>
        <p>Note: No price increase requests will be accepted starting 29 Sept 2026 until 02 Nov 2026.</p>
        <p>--------------------------------------------------</p>
        <p>
          <strong>How to Decrease Price (Allowed Anytime)</strong>
        </p>
        <ul>
          <li>
            <strong>Single price decrease</strong>:
            <br />
            Supplier Panel -&gt; Pricing Tab -&gt; Search using Catalog ID / Product ID -&gt; Click Accept / Edit -&gt; Update price -&gt; Save
            <br />
            <br />
          </li>
          <li>
            <strong>Bulk price decrease</strong>:
            <br />
            Supplier Panel -&gt; Pricing Tab -&gt; Download bulk pricing file -&gt; Update prices -&gt; Upload the file back
          </li>
        </ul>
        <p>Plan ahead and make the most of the Mega Blockbuster Sale!</p>
      </>
    ),
  },
  {
    title: "Biggest Sale in Meesho's History is ON - MBS!!",
    date: 'Sep 23 2026',
    body: <CentredPoster src="/brand/mimg/images/products-upload/1790776366018/banner_1_2days.jpg" />,
  },
  {
    title: 'Pay Later Lite is Live - Enable NOW!!',
    date: 'Sep 22 2026',
    body: (
      <CentredPoster
        src="/brand/mimg/images/marketing/1790061262827.jpg"
        heading="Introducing Pay Later Lite"
        cta="Enable Now!"
        alt="Enable Pay Later Lite Now!"
      />
    ),
  },
];
