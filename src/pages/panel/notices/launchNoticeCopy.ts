// Copy for the pinned Factory Launch Week notice (LW-6), English and a Hindi draft (for the team to review,
// like src/i18n/hi.json). Product names, dates and numbers stay as the panel shows them (English, numerals).
import type { Lang } from '../../../store/demo';

type Copy = {
  pinned: string;
  title: (event: string, category: string, live: string) => string;
  body: (closeBy: string) => string;
  slots: (left: number, type: string) => string;
  slotsFull: (type: string) => string;
  in: (name: string, stock: string) => string;
  live: (today: number) => string;
  ended: string;
  slotRemoved: string;
  closed: (date: string) => string;
  noBook: (type: string) => string;
  check: string;
  viewFactoryLaunch: string;
  viewLive: string;
  results: string;
  viewPricePosition: string;
  creativeAlt: string;
};

const plural = (type: string) => (type.endsWith('s') ? type : `${type}s`);

const en: Copy = {
  pinned: 'Pinned',
  title: (event, category, live) => `${event} · ${category} · ${live}`,
  body: (closeBy) => `Manufacturers only. Launch your product to buyers with no ads and no listing fee. Commit stock by ${closeBy}. Slots are limited.`,
  slots: (left, type) => `${left} ${left === 1 ? 'slot' : 'slots'} left for ${plural(type)}`,
  slotsFull: (type) => `All slots taken for ${plural(type)}`,
  in: (name, stock) => `You're in ${name} · stock ready by ${stock}`,
  live: (today) => `Live now · ${today} ${today === 1 ? 'order' : 'orders'} today`,
  ended: 'Launch week ended · orders continue',
  slotRemoved: 'Launch slot removed — price no longer qualifies',
  closed: (date) => `Commitments closed on ${date}`,
  noBook: (type) => `No open order book for ${plural(type)} yet`,
  check: 'Check my eligibility',
  viewFactoryLaunch: 'View Factory Launch',
  viewLive: 'View live launch',
  results: 'Launch results',
  viewPricePosition: 'View price position',
  creativeAlt: 'Factory Launch Week · Home and Kitchen products at lowest prices',
};

const hi: Copy = {
  pinned: 'पिन किया गया',
  title: (event, category, live) => `${event} · ${category} · ${live}`,
  body: (closeBy) => `सिर्फ़ मैन्युफ़ैक्चरर के लिए। बिना ऐड और बिना लिस्टिंग फ़ीस के अपना प्रोडक्ट ख़रीदारों तक लॉन्च करें। ${closeBy} तक स्टॉक कमिट करें। स्लॉट सीमित हैं।`,
  slots: (left, type) => `${plural(type)} के लिए ${left} स्लॉट बाकी`,
  slotsFull: (type) => `${plural(type)} के सभी स्लॉट भर गए`,
  in: (name, stock) => `आप ${name} में हैं · स्टॉक ${stock} तक तैयार`,
  live: (today) => `अभी लाइव · आज ${today} ऑर्डर`,
  ended: 'लॉन्च वीक ख़त्म · ऑर्डर जारी हैं',
  slotRemoved: 'लॉन्च स्लॉट हटाया गया — कीमत अब योग्य नहीं है',
  closed: (date) => `${date} को कमिटमेंट बंद हो गए`,
  noBook: (type) => `${plural(type)} के लिए अभी कोई ऑर्डर बुक खुली नहीं है`,
  check: 'मेरी योग्यता देखें',
  viewFactoryLaunch: 'फ़ैक्टरी लॉन्च देखें',
  viewLive: 'लाइव लॉन्च देखें',
  results: 'लॉन्च के नतीजे',
  viewPricePosition: 'प्राइस पोज़िशन देखें',
  creativeAlt: 'फ़ैक्टरी लॉन्च वीक · होम और किचन प्रोडक्ट सबसे कम कीमत पर',
};

export const noticeCopy = (lang: Lang): Copy => (lang === 'hi' ? hi : en);
