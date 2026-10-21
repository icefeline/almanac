import type { Metadata } from 'next';
import { version } from '../../package.json';

/**
 * Its own title, so the tab and any shared link say what the page is rather
 * than inheriting the app's "slow garden".
 */
export const metadata: Metadata = {
  title: 'Terms & Privacy · slow garden',
  description:
    'What slow garden is, what it is not, and the short list of things that leave your device.',
};

/**
 * Terms and privacy, on one page.
 *
 * Headings are machine voice, the prose is not — the reading page established
 * that split, and this is the one place in the app that has to be both a list
 * of what the software does and something a person can actually read.
 *
 * This page does NOT follow the app's lowercase house style, deliberately. The
 * rest of slow garden is lowercase because it is speaking quietly to one
 * person; this page is a legal document that someone may need to skim for a
 * single clause, or read carefully before deciding whether to trust the app
 * with their birth time. Sentence case, real paragraphs and lists are what make
 * that possible. Lowercase here read as style getting in the way of the one
 * page where clarity outranks tone.
 *
 * Everything stated here is checked against the code rather than aspired to. If
 * a data practice changes, this page changes in the same commit: a privacy
 * policy that describes an older version of the app is worse than none, because
 * it is a promise the software is no longer keeping.
 */
const SANS = 'var(--font-dm-sans), sans-serif';
const MONO = 'var(--font-dm-mono), ui-monospace, monospace';
const TERM = 'var(--font-vt323), monospace';

/** Lime page, ink type — the tear-off calendar's palette, not the app's dark ground. */
const INK = '#172211';
const LIME = '#C9F24E';

/* VT323 reads small for its point size, so the headings carry more px than the
   sans would want at the same visual weight. */
const H1 = 'clamp(34px, 7.5vw, 54px)';
const H2 = 'clamp(24px, 4.4vw, 32px)';
const H3 = 'clamp(19px, 3.4vw, 24px)';
const BODY = 'clamp(15px, 2.2vw, 19px)';
/** The standfirst, a step up from the body it introduces. */
const LEDE = 'clamp(18px, 2.9vw, 24px)';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-14">
      <h2
        className="mb-6"
        style={{ fontFamily: TERM, fontSize: H2, lineHeight: 1.1, letterSpacing: '0.01em' }}
      >
        &gt; {title}
      </h2>
      {children}
    </section>
  );
}

function Clause({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-9">
      <h3
        className="mb-2"
        style={{ fontFamily: TERM, fontSize: H3, lineHeight: 1.15 }}
      >
        {title}
      </h3>
      <div style={{ fontSize: BODY, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

/** A bulleted list. `spaced` for entries that run to a sentence or more. */
function List({ spaced = false, children }: { spaced?: boolean; children: React.ReactNode }) {
  return (
    <ul className={`list-disc pl-6 mb-4 ${spaced ? 'space-y-4' : 'space-y-1'}`}>{children}</ul>
  );
}

/**
 * The bolded lead-in that lets a list be skimmed by its labels alone.
 *
 * Bold but not underlined. The service names in the old markup were underlined
 * for emphasis, which was survivable when the page was one long prose block;
 * with real links now sitting a line or two away — anthropic.com/privacy, the
 * jump links at the top — underlined bold text reads as something you can
 * click, and a legal page is the worst place to make someone test that.
 */
function Term({ children }: { children: React.ReactNode }) {
  return <strong style={{ fontWeight: 700 }}>{children}</strong>;
}

export default function TermsAndPrivacy() {
  return (
    <main
      className="min-h-screen px-6 py-16"
      style={{ background: LIME, color: INK, fontFamily: SANS }}
    >
      <div className="max-w-2xl mx-auto">
        <h1 style={{ fontFamily: TERM, fontSize: H1, lineHeight: 1, letterSpacing: '0.01em' }}>
          &gt; TERMS &amp; PRIVACY
        </h1>

        <p
          className="mt-5 opacity-60"
          style={{ fontFamily: MONO, fontSize: 'clamp(10px, 2.2vw, 12px)', letterSpacing: '0.18em' }}
        >
          LAST UPDATED: AUGUST 2026
        </p>

        {/* The one paragraph anyone reads, so it is set like a standfirst and
            framed the way the reading page frames its own blocks. Dotted on
            ink, since the rule is the app's, not a border for its own sake. */}
        <div
          className="mt-10 mb-16"
          style={{ border: `1px dotted ${INK}`, padding: 'clamp(20px, 4vw, 30px)' }}
        >
          <p style={{ fontSize: LEDE, lineHeight: 1.55 }}>
            slow garden is a web app that draws you one tarot card a day and writes a short
            reflection to go with it. It runs entirely in your browser. There is no account,
            no login, and no database anywhere with your name in it &mdash; which makes most
            of what follows shorter than you might expect. Jump to{' '}
            <a href="#terms" className="underline" style={{ fontWeight: 700 }}>the Terms</a> or{' '}
            <a href="#privacy" className="underline" style={{ fontWeight: 700 }}>the Privacy Policy</a>.
          </p>
        </div>

        {/* ── TERMS ────────────────────────────────────────────────────── */}
        <Section id="terms" title="TERMS OF USE">
          <Clause title="Using slow garden means agreeing to this">
            <p>
              If you use slow garden, you&apos;re agreeing to what&apos;s on this page. If
              some part of it doesn&apos;t sit right with you, the honest answer is to stop
              using it &mdash; and nothing of yours is left behind when you do.
            </p>
          </Clause>

          <Clause title="You should be at least 13">
            <p>
              slow garden is not built for children. If you&apos;re under 13, please
              don&apos;t use it. If you&apos;re between 13 and whatever counts as an adult
              where you live, have a parent or guardian read this with you.
            </p>
          </Clause>

          <Clause title="What you can do with it">
            <p className="mb-4">
              Use it for yourself, as much as you like, for free. What we&apos;d ask you not
              to do:
            </p>
            <List>
              <li>Script or scrape it</li>
              <li>Resell it, or republish the readings as your own</li>
              <li>Try to slip past the rate limits</li>
              <li>Use it to build a competing service</li>
            </List>
            <p>The readings are for you.</p>
          </Clause>

          <Clause title="There is no account, and that cuts both ways">
            <p>
              Everything slow garden knows about you lives in your browser&apos;s local
              storage. That&apos;s good for privacy and unforgiving in every other respect.
              Clear your browser data, use private browsing, or switch to another device,
              and your history is gone. We can&apos;t recover it, because we never had a
              copy. If a year of readings would hurt to lose, keep your own notes elsewhere.
            </p>
          </Clause>

          <Clause title="What you write stays yours">
            <p>
              Your reflections belong to you. We claim no licence over them and no right to
              use them &mdash; which is easy to promise, because they never leave your device
              in the first place.
            </p>
          </Clause>

          <Clause title="What slow garden is not">
            <p className="mb-4">
              This matters more than the rest of this page, so plainly:
            </p>
            <List spaced>
              <li>
                <Term>It is not advice.</Term> Nothing in it is medical, psychological,
                legal, or financial guidance, and it should never be used in place of a
                professional who knows your situation.
              </li>
              <li>
                <Term>It does not predict anything.</Term> The cards are drawn from the date
                and the readings are written by a language model. Both can be wrong, strange,
                or simply unhelpful on a given day.
              </li>
              <li>
                <Term>It is a prompt, not a verdict.</Term> Treat a reading as something to
                think against &mdash; never as a fact about your life, or as a reason to make
                a decision you wouldn&apos;t otherwise make.
              </li>
            </List>
            <p>
              If you&apos;re struggling, please talk to someone real. A friend, a doctor, or
              a crisis line in your country will all serve you better than an app about
              flowers and tarot cards.
            </p>
          </Clause>

          <Clause title="It may change, and it may stop">
            <p>
              slow garden is made by one person and given away. Features can change or
              disappear, and the app can be offline. There&apos;s no guarantee it will keep
              working, and no promise it will still be here next year &mdash; though the
              intention is that it will be.
            </p>
          </Clause>

          <Clause title="If you buy me a coffee">
            <p>
              The support link is a gift rather than a purchase, and it isn&apos;t
              refundable. It doesn&apos;t unlock anything &mdash; every reading is free
              either way, and nothing about the app is held back from anyone who
              doesn&apos;t send one. Buy Me a Coffee handles the payment; we never see
              your card, and nothing about it reaches slow garden&apos;s server at all
              &mdash; not your email, not a receipt, nothing. It&apos;s a thank-you, not
              a transaction.
            </p>
          </Clause>

          <Clause title="Provided as it is">
            <p>
              slow garden is provided as it is, without warranties of any kind, to the
              fullest extent the law allows. To the same extent, we&apos;re not liable for
              any loss arising from using it or from not being able to use it, including
              lost readings or reflections. Some places don&apos;t allow those exclusions; if
              yours is one, they simply don&apos;t apply to you.
            </p>
          </Clause>

          <Clause title="Governing law">
            <p>
              These terms are governed by the laws of Singapore, and the courts of Singapore
              have jurisdiction over any dispute. If you&apos;re a consumer somewhere with
              protections that can&apos;t be waived by agreement, you keep those.
            </p>
          </Clause>

          <Clause title="Changes to these terms">
            <p>
              If these terms change, the updated version appears here with a new date at the
              top. Continuing to use slow garden after that means the new version applies.
            </p>
          </Clause>
        </Section>

        {/* ── PRIVACY ──────────────────────────────────────────────────── */}
        <Section id="privacy" title="PRIVACY POLICY">
          <Clause title="The short version">
            <p>
              Everything you put into slow garden stays in your browser. We don&apos;t have a
              database with your name in it, because we don&apos;t have a database. We
              don&apos;t sell anything, we don&apos;t advertise to you, and there&apos;s
              nobody here reading your reflections. A few small things do have to leave your
              device for the app to work at all, and the rest of this page is us being
              specific about which ones.
            </p>
          </Clause>

          <Clause title="Who&apos;s responsible">
            <p>
              slow garden is made and run by one individual, not a company. A contact address
              for questions about this page will be published here shortly.
            </p>
          </Clause>

          <Clause title="What stays on your device">
            <p className="mb-4">
              All of this lives in your browser&apos;s local storage and nowhere else:
            </p>
            <List>
              <li>Your first name</li>
              <li>Your birth date, and your birth time and location if you gave them</li>
              <li>Every card you&apos;ve drawn, and the date you drew it</li>
              <li>
                <Term>Your reflections</Term> &mdash; anything you write in the box at the
                bottom of a reading. Yours alone; never sent anywhere, by anything.
              </li>
              <li>The readings themselves, cached so re-opening a day costs nothing</li>
              <li>
                <Term>The app&apos;s notes</Term> &mdash; a line the app writes to itself
                after each reading, so tomorrow&apos;s doesn&apos;t feel like it&apos;s
                meeting you for the first time. Written by the app, not by you, and the one
                thing on this list that does get sent on when the next reading is written.
              </li>
              <li>Your settings, including whether personalisation and location are on</li>
            </List>
            <p>
              We can&apos;t see any of it. It isn&apos;t backed up, synced, or transmitted
              anywhere, and clearing your browser data deletes all of it permanently.
            </p>
          </Clause>

          <Clause title="What leaves your device">
            <p className="mb-4">Five outside services are involved, and only these five:</p>
            <List spaced>
              <li>
                <Term>Anthropic</Term> writes the personalised part of your reading. It
                receives your birth details, the card you drew, and the app&apos;s own notes
                &mdash; a line the app writes to itself after each reading, so tomorrow&apos;s
                can follow on from today&apos;s. It does not receive your name, and it does
                not receive your reflections: the writing you do in the box at the bottom of
                a reading never leaves your device at all, and is never sent anywhere. Their
                policy covers what happens next:{' '}
                <a
                  href="https://www.anthropic.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ fontWeight: 700 }}
                >
                  anthropic.com/privacy
                </a>
              </li>
              <li>
                <Term>OpenStreetMap</Term> turns a birth location into coordinates. It
                receives the place name you typed and nothing else about you.
              </li>
              <li>
                <Term>Upstash</Term> runs the rate limiter, which counts requests per IP
                address so one busy network can&apos;t drain the whole thing. Your IP becomes
                a short-lived counter and then expires. Nothing else about you is attached to
                it, and if the limiter is unreachable the app carries on rather than locking
                you out.
              </li>
              <li>
                <Term>Vercel</Term> hosts the app, so it necessarily handles the requests
                your browser makes, and provides the visitor counts. Those counts are
                cookieless and carry no personal data, which is why you&apos;ve never seen a
                consent banner here.
              </li>
              <li>
                <Term>Sentry</Term> tells us when the app breaks, on servers in the European
                Union. It gets the error and the line of code that caused it. It does not get
                your name, your birth date, time or place, your reading, or anything
                you&apos;ve written &mdash; those are stripped out before the report leaves
                your device or our server, by a filter that works on the shape of the data
                rather than a list of places to look, so new code is covered the day
                it&apos;s written. We don&apos;t record your screen.
              </li>
            </List>
          </Clause>

          <Clause title="Where you are">
            <p>
              If you switch on &ldquo;use my location&rdquo;, your browser asks first and you
              can say no. We round the coordinates to about a kilometre, keep them on your
              device, and send them to our own reading endpoint so it can work out your
              sunrise, sunset, and moon phase. That&apos;s all they&apos;re for. They
              don&apos;t go to any third party, they aren&apos;t stored after the request,
              and turning the setting off forgets them. Decline and you lose two lines of the
              margin, nothing else.
            </p>
          </Clause>

          <Clause title="Reminders">
            <p>
              Daily reminders are scheduled by your own browser, and the time you picked is
              saved on your device. There&apos;s no push server involved, so we never find
              out whether you opened the app.
            </p>
          </Clause>

          <Clause title="How long anything is kept">
            <p className="mb-4">Three answers, depending on what you mean:</p>
            <List>
              <li>
                <Term>On your device</Term> &mdash; until you delete it.
              </li>
              <li>
                <Term>Readings and rate limits</Term> &mdash; readings aren&apos;t stored at
                all, and the limiter&apos;s counters expire within the hour.
              </li>
            </List>
          </Clause>

          <Clause title="Data leaving Singapore">
            <p>
              The services above operate internationally, so the small amount of data
              described here is processed outside Singapore, including in the United States
              and the European Union. We rely on those providers&apos; own contractual
              safeguards for those transfers, and send them no more than what&apos;s listed
              above.
            </p>
          </Clause>

          <Clause title="Your rights">
            <p className="mb-4">
              Under Singapore&apos;s PDPA you can ask for access to, or correction of,
              personal data an organisation holds about you. If you&apos;re in the UK or the
              EU, we&apos;ll honour the equivalent GDPR rights; if you&apos;re in California,
              the CCPA ones.
            </p>
            <p>
              In practice all of those requests have the same short answer: we hold nothing
              about you to hand over, correct, or erase. What exists is in your browser,
              where you can read it, change it, or clear it whenever you like, without asking
              anyone.
            </p>
          </Clause>

          <Clause title="Children">
            <p>
              slow garden isn&apos;t intended for anyone under 13, and we don&apos;t knowingly
              collect anything from them. Since there are no accounts, there&apos;s nothing
              for us to look up or delete, and clearing the browser removes everything the
              app has kept.
            </p>
          </Clause>

          <Clause title="Changes to this policy">
            <p>
              If what the app does with data changes, this page changes with it, in the same
              release. The date at the top tells you when it last did.
            </p>
          </Clause>
        </Section>

        <div className="flex items-baseline justify-between gap-6">
          <a
            href="/"
            className="underline"
            style={{ fontFamily: MONO, fontSize: 'clamp(11px, 2.4vw, 13px)', letterSpacing: '0.18em', fontWeight: 500 }}
          >
            ← BACK
          </a>
          {/* Read from package.json so it cannot quietly fall out of date. */}
          <span
            className="opacity-50"
            style={{ fontFamily: TERM, fontSize: 'clamp(14px, 2.6vw, 17px)', letterSpacing: '0.04em' }}
          >
            v{version}
          </span>
        </div>
      </div>
    </main>
  );
}
