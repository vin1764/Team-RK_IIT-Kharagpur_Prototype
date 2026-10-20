// Notice board (growth/notices): reference/html/meesho-notices.html + reference/screens/notices-1..4.png.
import { LeaveRequest } from './notices/LeaveRequest';
import { NOTICES, type Notice } from './notices/noticeList';

function NoticeCard({ title, date, body }: Notice) {
  return (
    <div className="bg-white rounded-lg p-4 mt-0 mx-0 mb-2">
      <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6 mb-1">{title}</h3>
      <p className="m-0 p-0 font-normal font-body text-base leading-4 text-secondary-text">{date}</p>
      {/* leading-[1.5]: the panel's text-xl sets only font-size, so the body inherits html's 1.5.
          Bare <p>s get the panel's global `p { margin-block: 1em }`.
          Bold runs use the Bold face: the live panel fakes bold on Mier Book, our Book face has no bold. */}
      <div className="mt-4 text-primary-text text-xl leading-[1.5] [&_p]:my-[1em] [&_div>img]:w-full [&_div>img]:h-auto [&_div>img]:mt-2 [&_strong]:font-heading [&_h1]:font-heading">
        {body}
      </div>
    </div>
  );
}

export default function Notices() {
  return (
    <div>
      {/* Sticky under the concept strip (the live panel sticks it at top: 0). */}
      <div className="z-5 sticky" style={{ top: 'var(--concept-strip-h)' }}>
        <header
          className="gap-2.5 text-primary-text shadow-md sticky top-0 z-100 flex items-center justify-start bg-white min-h-7 mb-4 py-3 px-6"
          role="heading"
          aria-level={1}
        >
          <h1 className="m-0 p-0 text-primary-text font-bold font-heading text-4xl leading-7">Notices</h1>
        </header>
      </div>
      <div className="flex w-full px-4 gap-x-4 mx-auto">
        <div className="flex flex-col box-border flex-1 min-w-0">
          {NOTICES.map((n) => (
            <NoticeCard key={`${n.title}|${n.date}`} {...n} />
          ))}
        </div>
        <LeaveRequest />
      </div>
    </div>
  );
}
