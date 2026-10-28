import type { Metadata } from 'next';
import LegalPage, { ExtLink, UL, type LegalSection } from '../components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy · slow garden',
  description: 'What slow garden is, what it is not, and the short list of things that leave your device.',
};

const sections: LegalSection[] = [
  {
    id: 'short-version',
    title: 'The short version',
    body: (
      <p>
        Everything you put into slow garden stays in your browser. We don&apos;t have a database with your name in it,
        because we don&apos;t have a database. We don&apos;t sell anything or advertise to you, and nobody here reads your reflections. A few small things do have to leave your device for the app
        to work at all, and the rest of this page is us being specific about which ones.
      </p>
    ),
  },
  {
    id: 'responsible',
    title: 'Who is responsible',
    body: (
      <p>
        slow garden is made and run by one individual rather than a company. This policy covers the tarot app, its dream interpreter, milky, and its sticker tracker, root. Questions about it go to the address in the last section.
      </p>
    ),
  },
  {
    id: 'on-your-device',
    title: 'What stays on your device',
    body: (
      <>
        <p>All of this lives in your browser&apos;s local storage and nowhere else:</p>
        <UL>
          <li>Your first name</li>
          <li>Your birth date, and your birth time and location if you gave them</li>
          <li>Every card you&apos;ve drawn, and the date you drew it</li>
          <li>Your reflections, meaning anything you write in the box at the bottom of a reading. These are never sent anywhere.</li>
          <li>The readings themselves, cached so re-opening a day costs nothing</li>
          <li>
            The app&apos;s notes: a line the app writes to itself after each reading, so tomorrow&apos;s doesn&apos;t feel like it&apos;s meeting you for the first time. You don&apos;t write them, and they are the one thing on this list that does get sent on when the next reading is written.
          </li>
          <li>Your settings, including whether personalisation and location are on</li>
        </UL>
        <p>
          We can&apos;t see any of it. It isn&apos;t backed up, synced, or transmitted anywhere, and clearing your
          browser data deletes all of it permanently.
        </p>
      </>
    ),
  },
  {
    id: 'backups',
    title: 'Backing up your data',
    body: (
      <>
        <p>
          slow garden can make you a backup copy of all of it, but only when you ask. The small note in the corner of
          the app opens it. The copy is a file saved to your own device or, on a phone, wherever you choose in
          the share sheet, such as iCloud Drive or Google Drive. It is made in your browser and never sent to us.
          Restoring one reads the file the same way, in your browser.
        </p>
        <p>
          The app also asks your browser to keep this storage from being cleared automatically when space runs low; the
          browser decides, and it does nothing about you clearing your own data.
        </p>
      </>
    ),
  },
  {
    id: 'leaves-your-device',
    title: 'What leaves your device',
    body: (
      <>
        <p>For the tarot app and milky, five outside services are involved, and only these five:</p>
        <UL>
          <li>
            Anthropic writes the personalised part of your reading. It receives your birth details, the card you drew,
            and the app&apos;s notes (see above). It does not receive your name or your reflections, which never leave
            your device. Their policy covers what happens next:{' '}
            <ExtLink href="https://www.anthropic.com/privacy">anthropic.com/privacy</ExtLink>
          </li>
          <li>
            OpenStreetMap turns a birth location into coordinates. It receives the place name you typed
            and nothing else about you.
          </li>
          <li>
            Upstash runs the rate limiter, which counts requests per IP address so one busy network
            can&apos;t drain the whole thing. Your IP becomes a short-lived counter and then expires. Nothing else about
            you is attached to it, and if the limiter is unreachable the app carries on rather than locking you out.
          </li>
          <li>
            Vercel hosts the app, so it necessarily handles the requests your browser makes, and provides
            the visitor counts. Those counts are cookieless and carry no personal data, which is why you&apos;ve never
            seen a consent banner here.
          </li>
          <li>
            Sentry tells us when the app breaks, on servers in the European Union. It gets the error and
            the line of code that caused it. It does not get your name, your birth date, time or place, your reading,
            or anything you&apos;ve written. Those are stripped out before the report leaves your device or our
            server, by a filter that works on the shape of the data rather than a list of places to look, so new code
            is covered the day it&apos;s written. We don&apos;t record your screen.
          </li>
        </UL>
      </>
    ),
  },
  {
    id: 'milky',
    title: 'The dream interpreter (milky)',
    body: (
      <>
        <p>
          milky works differently from the tarot app in one way that matters: what you write is sent away to be read.
        </p>
        <UL>
          <li>
            The dream you type is sent to our server and on to Anthropic, who write the reading. It is the
            only thing sent. The dream page doesn&apos;t ask for your name or your birth details, and there is no
            account. Because it goes to a third party, please don&apos;t write anything you wouldn&apos;t want an AI
            service to see.
          </li>
          <li>
            We don&apos;t keep it. Neither the dream nor the reading is stored on our servers, and the page
            doesn&apos;t save them in your browser either, so closing or reloading the page clears them.
          </li>
          <li>
            The rate limiter and hosting described above apply here too, and Anthropic&apos;s own policy covers what
            happens on their side: <ExtLink href="https://www.anthropic.com/privacy">anthropic.com/privacy</ExtLink>
          </li>
        </UL>
      </>
    ),
  },
  {
    id: 'root',
    title: 'The sticker tracker (root)',
    body: (
      <>
        <p>root keeps everything on your device and sends nothing anywhere.</p>
        <UL>
          <li>
            In your browser it saves the stickers you place for movement, sleep, food and mood, the card designs you
            picked, the background colour, the layout of the stickers on the opening screen, and a count of your
            visits.
          </li>
          <li>
            None of that is sent to us or to any other service. root has no account, no cookies and no analytics, and
            it loads its fonts from its own site.
          </li>
          <li>Vercel hosts it, so it handles the requests your browser makes to load the page, as described above.</li>
          <li>
            root doesn&apos;t have a backup copy feature, so clearing your browser data deletes your stickers
            permanently.
          </li>
        </UL>
      </>
    ),
  },
  {
    id: 'location',
    title: 'Where you are',
    body: (
      <p>
        If you switch on &ldquo;use my location&rdquo;, your browser asks first and you can say no. We round the
        coordinates to about a kilometre, keep them on your device, and send them to our own reading endpoint so it can
        work out your sunrise, sunset, and moon phase. That&apos;s all they&apos;re for. They don&apos;t go to any
        third party, they aren&apos;t stored after the request, and turning the setting off forgets them. Decline and
        you lose two lines of the margin, nothing else.
      </p>
    ),
  },
  {
    id: 'reminders',
    title: 'Reminders',
    body: (
      <p>
        Daily reminders are scheduled by your own browser, and the time you picked is saved on your device. There&apos;s
        no push server involved, so we never find out whether you opened the app.
      </p>
    ),
  },
  {
    id: 'retention',
    title: 'How long anything is kept',
    body: (
      <>
        <p>Two answers, depending on what you mean:</p>
        <UL>
          <li>
            On your device, until you delete it.
          </li>
          <li>
            Readings aren&apos;t stored at all, and the rate limiter&apos;s counters expire within the hour.
          </li>
        </UL>
      </>
    ),
  },
  {
    id: 'transfers',
    title: 'Data leaving Singapore',
    body: (
      <p>
        The services above operate internationally, so the small amount of data described here is processed outside
        Singapore, including in the United States and the European Union. We rely on those providers&apos; own
        contractual safeguards for those transfers, and send them no more than what&apos;s listed above.
      </p>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights',
    body: (
      <>
        <p>
          Under Singapore&apos;s PDPA you can ask for access to, or correction of, personal data an organisation holds
          about you. If you&apos;re in the UK or the EU, we&apos;ll honour the equivalent GDPR rights; if you&apos;re in
          California, the CCPA ones.
        </p>
        <p>
          In practice all of those requests have the same short answer: we hold nothing about you to hand over, correct,
          or erase. What exists is in your browser, where you can read it, change it, or clear it whenever you like,
          without asking anyone.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: (
      <p>
        slow garden isn&apos;t intended for anyone under 13, and we don&apos;t knowingly collect anything from them.
        Since there are no accounts, there&apos;s nothing for us to look up or delete, and clearing the browser removes
        everything the app has kept.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        If what the app does with data changes, this page changes with it, in the same release. The date at the top
        tells you when it last did.
      </p>
    ),
  },
  {
    id: 'questions',
    title: 'Questions or concerns',
    body: <p>A contact address for questions about this page will be published here shortly.</p>,
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 2026"
      intro="How slow garden handles your data, including its dream interpreter, milky, and its sticker tracker, root. In short: nearly everything stays in your browser, and this page lists the few things that don't."
      sections={sections}
      seeAlso={{ href: '/terms', label: 'Terms of Service' }}
    />
  );
}
