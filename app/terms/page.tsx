import type { Metadata } from 'next';
import LegalPage, { UL, type LegalSection } from '../components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service · slow garden',
  description: 'What slow garden is, what it is not, and what we ask of you.',
};

const sections: LegalSection[] = [
  {
    id: 'general',
    title: 'General',
    body: (
      <p>
        If you use slow garden, you&apos;re agreeing to what&apos;s on this page. If some part of it doesn&apos;t sit
        right with you, the honest answer is to stop using it, and nothing of yours is left behind when you do.
      </p>
    ),
  },
  {
    id: 'age',
    title: 'Age requirement',
    body: (
      <p>
        slow garden is not built for children. If you&apos;re under 13, please don&apos;t use it. If you&apos;re
        between 13 and whatever counts as an adult where you live, have a parent or guardian read this with you.
      </p>
    ),
  },
  {
    id: 'what-you-can-do',
    title: 'What you can do with it',
    body: (
      <>
        <p>Use it for yourself, as much as you like, for free. What we&apos;d ask you not to do:</p>
        <UL>
          <li>Script or scrape it</li>
          <li>Resell it, or republish the readings as your own</li>
          <li>Try to slip past the rate limits</li>
          <li>Use it to build a competing service</li>
        </UL>
        <p>The readings are for you.</p>
      </>
    ),
  },
  {
    id: 'no-account',
    title: 'No account, and that cuts both ways',
    body: (
      <>
        <p>
          Everything slow garden knows about you lives in your browser&apos;s local storage.  Clear your browser data, use private browsing, or switch to
          another device, and your history is gone. We can&apos;t recover it, because we never had a copy.
        </p>
        <p>
          almanac can make you a backup copy of your history, which is a file for you to keep (see the{' '}
          <a href="/privacy#backups" className="underline underline-offset-4">
            Privacy Policy
          </a>
          ). If a year of readings would hurt to lose, make one now and then, or keep your own notes elsewhere.
        </p>
      </>
    ),
  },
  {
    id: 'what-you-write',
    title: 'What you write stays yours',
    body: (
      <p>
        Your reflections belong to you. We claim no licence over them and no right to use them. That&apos;s easy to promise, because they never leave your device in the first place.
      </p>
    ),
  },
  {
    id: 'what-it-is-not',
    title: 'What slow garden is not',
    body: (
      <>
        <p>This part matters most:</p>
        <p>
          Nothing in slow garden, including root&apos;s tracking of sleep, food, movement and mood, is medical, psychological, legal or financial advice. Don&apos;t use it in place of a
          professional who knows your situation.
        </p>
        <p>
          It doesn&apos;t predict anything. The cards are drawn from the date and the readings are written by a language
          model, so both can be wrong, strange or unhelpful on a given day.
        </p>
        <p>
          A reading is something to think against. Don&apos;t treat it as a fact about your life, or as a reason to make
          a decision you wouldn&apos;t otherwise make.
        </p>
        <p>
          If you&apos;re struggling, please talk to someone real. A friend, a doctor, or a crisis line in your country
          will all serve you better than an app about flowers and tarot cards.
        </p>
      </>
    ),
  },
  {
    id: 'availability',
    title: 'It may change, and it may stop',
    body: (
      <p>
        slow garden is made by one person and given away. Features can change or disappear, and the app can be offline.
        There&apos;s no guarantee it will keep working, and no promise it will still be here next year, though that is the intention.
      </p>
    ),
  },
  {
    id: 'coffee',
    title: 'Supporting slow garden',
    body: (
      <p>
        Sending a coffee is a gift and isn&apos;t refundable. It doesn&apos;t unlock anything. Every reading is free either way, and nothing is held back from anyone who doesn&apos;t send one. Buy Me a Coffee handles the payment. We never see your card, and nothing about it reaches slow garden&apos;s server, including your email or a receipt.
      </p>
    ),
  },
  {
    id: 'warranties',
    title: 'Provided as it is',
    body: (
      <p>
        slow garden is provided as it is, without warranties of any kind, to the fullest extent the law allows. To the
        same extent, we&apos;re not liable for any loss arising from using it or from not being able to use it,
        including lost readings or reflections. Some places don&apos;t allow those exclusions; if yours is one, they
        simply don&apos;t apply to you.
      </p>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing law',
    body: (
      <p>
        These terms are governed by the laws of Singapore, and the courts of Singapore have jurisdiction over any
        dispute. If you&apos;re a consumer somewhere with protections that can&apos;t be waived by agreement, you keep
        those.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: (
      <p>
        If these terms change, the updated version appears here with a new date at the top. Continuing to use slow
        garden after that means the new version applies.
      </p>
    ),
  },
  {
    id: 'questions',
    title: 'Questions',
    body: (
      <p>
        slow garden is made and run by one individual, not a company. A contact address for questions about this page
        will be published here shortly.
      </p>
    ),
  },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="October 2026"
      intro="The terms for using slow garden, including its dream interpreter, milky, and its sticker tracker, root. In short, it's free and it isn't advice."
      sections={sections}
      seeAlso={{ href: '/privacy', label: 'Privacy Policy' }}
    />
  );
}
