// Right-column copy of each onboarding step, replicated from reference/screens/onb-*.png.
// This is Meesho's own copy (numbers included), shown as captured. Only the first answer of
// each step was captured; the others open to "Answer not available in this prototype."
import type { ReactNode } from 'react';
import { notInPrototype } from '../../../components/Toast';

export interface FaqItem {
  q: string;
  a?: ReactNode;
}

export interface Aside {
  icon: string;
  headline: string;
  faqs: FaqItem[];
}

const A = ({ children, what }: { children: ReactNode; what: string }) => (
  <a
    href="#"
    onClick={(e) => {
      e.preventDefault();
      notInPrototype(what);
    }}
    className="text-brand-primary-text no-underline"
  >
    {children}
  </a>
);

const IMG = '/brand/local/onboarding';

export const ASIDES: Record<'business' | 'pickup' | 'bank' | 'supplier', Aside> = {
  business: {
    icon: `${IMG}/faq-suppliers.png`,
    headline: 'More than 100,000 suppliers are growing their business by selling on Meesho',
    faqs: [
      {
        q: 'Which sellers can sell on Meesho?',
        a: (
          <>
            <p>Starting October 1st, 2023, sellers (with or without GST registration) can sell on Meesho.</p>
            <p>
              To start selling, Non-GST sellers must obtain an Enrolment ID/ UIN from the GST website (click <A what="The GST website link">here</A> to obtain it). Watch the{' '}
              <A what="The video guide">video guide</A>.
            </p>
            <p>
              Regular GST &amp; Composite GST sellers can register using their GSTIN number. Our partner Vakilsearch can assist in obtaining a GSTIN.{' '}
              <A what="The Vakilsearch link">Click here</A> to learn more.
            </p>
          </>
        ),
      },
      { q: 'How can I obtain GSTIN No or Enrolment ID / UIN?' },
      { q: 'What is the difference between Enrolment ID / UIN and GSTIN?' },
    ],
  },
  pickup: {
    icon: `${IMG}/faq-pin.png`,
    headline: 'Meesho provides free shipping to 24,000+ pincodes in India',
    faqs: [
      {
        q: 'Who will pick up the products for delivery?',
        a: <p>All products will be picked up by Meesho certified delivery partners from your location and delivered directly to the customer.</p>,
      },
      { q: 'Do I need to pay the shipping charges?' },
      { q: 'How can I change shipping state' },
    ],
  },
  bank: {
    icon: `${IMG}/faq-rupee.png`,
    headline: 'Payments are deposited safely in your bank account on time',
    faqs: [
      {
        q: 'What if I don’t have bank account in the name of business?',
        a: <p>We can only transfer payments to accounts which are in the registered business name. Please open a new bank account with any bank in your registered business name.</p>,
      },
      { q: 'How and when do I get paid?' },
      { q: 'Are my bank details safe?' },
    ],
  },
  supplier: {
    icon: `${IMG}/faq-store.png`,
    headline: 'Resellers use store name to identify their favourite suppliers to buy products',
    faqs: [
      {
        q: 'What is Store Name and where it is used?',
        a: (
          <p>
            Your Store Name is visible on the Meesho reseller app with your products.
            <br />
            Resellers use Store Name to identify their preferred suppliers.
          </p>
        ),
      },
      { q: 'Can I change my Store Name later?' },
    ],
  },
};

/** Meesho's public supplier support line, as printed on every onboarding step. */
export const SUPPORT_PHONE = '080 - 61799601';
