// Influencer Marketing (reference/html/meesho-influencer-marketing.html), ported class-for-class.
// Videos weren't saved: each video slot is a dark still with the play icon (see VideoStill).
// Only the first FAQ answer was captured; the others open to a placeholder line.
import { notInPrototype } from '../../components/Toast';
import { FaqItem, FaqSeparator, PRIMARY_BTN, VideoStill, VideoTile, type VideoTileData } from './influencer-marketing/parts';

const TICK = '/brand/msa/merlin/filled/selector-selected-green.svg';

const BENEFITS = [
  { img: '/brand/mimg/images/marketing/1769170040302.webp', alt: 'No charges on returns', bold: 'No charges', text: 'on Returned/Cancelled/ RTO orders' },
  { img: '/brand/mimg/images/marketing/1769170013011.webp', alt: 'Choose catalogs', text: 'Choose Catalogs of your choice' },
  { img: '/brand/mimg/images/marketing/1769170050534.webp', alt: 'Set commission', text: 'Set any commission of your choice' },
];

const VIDEOS: VideoTileData[] = [
  { title: 'Women Kurti', views: '6.9M', likes: '219K' },
  { title: 'Mens Jackets', views: '172K', likes: '5.3K' },
  { title: 'Home Decor', views: '4.9M', likes: '138K' },
  { title: 'IG Story' },
  { title: 'Collection Page' },
];

const FAQS = [
  'How can I opt in to the program?',
  'What is Influencer Marketing/Affiliate Marketing Program at Meesho?',
  'How does the influencer marketing program work?',
  'Why should I participate in this program?',
  "Why choose influencer marketing if I'm already in other programs?",
  'What are the benefits of the influencer marketing program?',
  'Are there any charges for opt-in or content making?',
  'How does meesho collect affiliate fees?',
  'Can I set my own creator commission?',
  'What happens with non delivered orders coming via this program?',
  'What are the social media channels via which my catalogs would be promoted?',
  'How do users purchase from social media?',
  'How can I check which products/catalogs have generated orders?',
  'Will I receive performance reports post opt-in?',
  'How can I measure the success of the program?',
  'Will Meesho provide proof of content through which I received orders?',
  'Can I choose which influencers to work with?',
  'What if I have issues or need support with the program?',
  'How do I trust if the orders reported are genuine without any content?',
  'How can I opt out from the program?',
  'Can I exclude catalogs from influencer marketing if I do not want to spend any marketing cost?',
  'Do Suppliers have to pay directly to the content creators for the Invoice received directly with respect to content creation services?',
  "I want to understand why I'm getting separate invoices from Meesho and content creators.",
  'I want to block my content creator partner',
  'Can creators return my products after creating content?',
  'Why are some returns happening after 7 days?',
];

const selectCatalogs = () => notInPrototype('Select Catalogs');

export default function InfluencerMarketing() {
  return (
    <div className="text-black tracking-[-0.1px]">
      <div>
        <section className="flex items-center justify-between bg-white px-4 py-3">
          <div className="flex">
            <h1 className="m-0 p-0 text-primary-text font-bold font-heading text-4xl leading-7 pl-2">Influencer Marketing</h1>
          </div>
          <div className="flex items-center">
            <div className="flex items-center pl-4">
              <button type="button" className="flex items-center gap-2 cursor-pointer text-brand-primary-text font-medium mr-3" onClick={() => notInPrototype('How it Works video')}>
                <img src="/brand/msa/merlin/filled/youtube.svg" alt="" width="25" height="25" />
                <h5 className="m-0 p-0 text-primary-text text-lg leading-5 font-semibold font-button inline">How it Works?</h5>
              </button>
              <button className={`${PRIMARY_BTN} h-[2.25rem] px-4 text-xl`} type="button" onClick={selectCatalogs}>
                Select Catalogs
              </button>
            </div>
          </div>
        </section>
      </div>
      <div className="h-2 w-full bg-tertiary-bg" />
      <div className="bg-white relative">
        <div className="px-6 pt-8 pb-0 h-114 bg-linear-to-b/srgb from-white from-[57.11%] to-[#FFF7D6] to-[120.54%]">
          <div className="flex items-center">
            <h1 className="m-0 p-0 font-bold font-heading mt-6 ml-7.5 text-[28px] leading-9">Grow Orders with Influencer Promotion! 📈</h1>
          </div>
          <div className="flex justify-between mt-6">
            <div>
              <div className="ml-7.5">
                <div className="flex items-center mt-4">
                  <img src={TICK} alt="" width="24" height="24" />
                  <h2 className="m-0 p-0 text-primary-text font-bold font-heading text-3xl leading-6 ml-2">50K+ influencers</h2>
                  <p className="m-0 p-0 text-primary-text font-normal font-body leading-5 ml-1 text-3xl">can make videos on your products</p>
                </div>
              </div>
              <div className="ml-7.5">
                <div className="flex items-center mt-4">
                  <img src={TICK} alt="" width="24" height="24" />
                  <p className="m-0 p-0 text-primary-text font-normal font-body leading-5 ml-2 text-3xl">Videos are posted on</p>
                  <h2 className="m-0 p-0 font-bold font-heading text-3xl leading-6 inline text-brand-primary-text ml-1">Meesho App</h2>
                  <h2 className="m-0 p-0 text-primary-text font-bold font-heading leading-6 ml-1 text-3xl">+ Social Media =</h2>
                </div>
                <h2 className="m-0 p-0 text-primary-text font-bold font-heading leading-6 ml-8 text-3xl">More Visibility, More Sales</h2>
              </div>
              <div className="flex flex-col max-w-fit">
                <button className={`${PRIMARY_BTN} h-[2.75rem] text-xl px-10 py-3 mt-12 ml-7.5`} type="button" onClick={selectCatalogs}>
                  Select Catalogs
                </button>
              </div>
            </div>
            <div className="flex items-end justify-end mr-12">
              <div className="flex items-baseline">
                <button type="button" className="cursor-pointer p-0 border-0 bg-transparent" onClick={() => notInPrototype('Video')} aria-label="How influencer promotion works video">
                  <VideoStill style={{ height: '357.2px', width: '403.8px' }} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full h-2 bg-tertiary-bg" />
        <div className="flex flex-col mx-14 py-4 w-auto gap-6">
          <div className="flex rounded-lg border border-solid px-4 py-2 border-info-border bg-info-bg">
            <img src="/brand/msa/merlin/filled/thumbs-up.svg" alt="" width="24" height="24" />
            <div className="ml-2 flex items-center">
              <div className="text-2xl leading-5 font-normal text-primary-text">The Best Part =</div>
              <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6 ml-1">Opt out anytime</h3>
              <div className="ml-1 text-2xl leading-5 font-normal text-primary-text">from the program, in just one click</div>
            </div>
          </div>
          <div className="flex items-center justify-between py-4 px-5 rounded-lg w-auto">
            {BENEFITS.map((b, i) => (
              <div key={b.alt} className="contents">
                {i > 0 && <div className="w-[0.0625rem] border-0 border-l border-solid border-b-0 h-17.5 border-l-tertiary-bg" role="separator" aria-orientation="vertical" />}
                <div className="flex">
                  <img src={b.img} alt={b.alt} width="98" height="67" loading="lazy" className="block" />
                  <div className="flex w-40">
                    <p className="m-0 p-0 text-primary-text font-normal font-body text-xl leading-5 ml-6">
                      {b.bold && <span className="m-0 p-0 text-primary-text font-bold font-heading text-xl leading-5 inline">{b.bold} </span>}
                      {b.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full h-2 bg-tertiary-bg" />
        <div className="py-5 px-20 bg-linear-179/srgb from-[#F7FFF4] from-[9.48%] to-white to-[103.57%]">
          <div className="flex items-center justify-center">
            <h1 className="m-0 p-0 font-bold font-heading text-4xl leading-7 text-success-text">2Lakh+ Sellers are Growing with Influencer Videos! 🔥</h1>
          </div>
          <div className="relative flex items-center justify-between mt-5">
            {VIDEOS.map((v) => (
              <VideoTile key={v.title} {...v} />
            ))}
          </div>
        </div>
        <div className="w-full h-2 bg-tertiary-bg" />
        <div className="mt-6">
          <h1 className="m-0 p-0 text-primary-text font-bold font-heading text-4xl leading-7 ml-4">Frequently Asked Questions</h1>
          <div className="mb-4 mt-11">
            <FaqItem q="Where can I access the Terms and Conditions of the Influencer Marketing Program?" defaultOpen>
              <div className="text-secondary-text [&_strong]:font-black [&_strong]:text-black">
                <p className="my-[13px]">
                  Please{' '}
                  <a
                    href="#"
                    className="text-inherit no-underline"
                    onClick={(e) => {
                      e.preventDefault();
                      notInPrototype('Terms and Conditions');
                    }}
                  >
                    click here
                  </a>{' '}
                  to view the detailed Terms and Conditions.
                </p>
              </div>
            </FaqItem>
            <FaqSeparator />
            {FAQS.map((q) => (
              <div key={q}>
                <FaqItem q={q} />
                <FaqSeparator />
              </div>
            ))}
          </div>
        </div>
        {/* bottom-1/50 in the snapshot; lifted by the room the Prototype controls pill takes (0 in compares). */}
        <button type="button" className="fixed bottom-[calc(2%+var(--demo-controls-room))] right-1/20 z-10 cursor-pointer p-0 border-0 bg-transparent" onClick={() => notInPrototype('Request Callback')}>
          <img src="/brand/mimg/images/marketing/1725517041174.png" alt="callback-bg" className="block h-14 w-45" />
        </button>
      </div>
    </div>
  );
}
