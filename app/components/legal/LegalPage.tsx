import type { ReactNode } from 'react';
import { version } from '../../../package.json';

/*
 * The shared layout for the Terms of Service and the Privacy Policy.
 *
 * Arranged the way a reader of a legal page wants it: one title, a one-line intro, a numbered contents list that
 * jumps to numbered sections, and the same section order every time. Two separate pages that point at each other,
 * rather than one long combined page.
 *
 * Deliberately neutral: Helvetica, black on white, no app colours or pixel faces. The rest of slow garden speaks in
 * a lowercase house voice; this is the one place where clarity outranks tone, and where someone may need to find a
 * single clause. Everything stated on these pages is checked against the code; if a data practice changes, the
 * page changes in the same commit.
 */

const HELVETICA = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/** A bulleted list. */
export function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-6">{children}</ul>;
}

/** The bold lead-in that lets a list be skimmed by its labels alone. */
export function Term({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-neutral-900">{children}</strong>;
}

export function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
      {children}
    </a>
  );
}

export default function LegalPage({
  title,
  intro,
  updated,
  sections,
  seeAlso,
}: {
  title: string;
  intro: ReactNode;
  updated: string;
  sections: LegalSection[];
  seeAlso: { href: string; label: string };
}) {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-neutral-900 md:py-20" style={{ fontFamily: HELVETICA }}>
      <div className="mx-auto max-w-[44rem]">
        <a href="/" className="text-sm text-neutral-600 underline underline-offset-4">
          ← slow garden
        </a>

        <h1 className="mt-10 text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-4 text-sm text-neutral-500">Last updated: {updated}</p>
        <p className="mt-8 text-lg leading-relaxed md:text-xl">{intro}</p>

        <nav aria-label="Contents" className="mt-10 rounded-lg bg-neutral-50 p-5 md:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Contents</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 marker:text-neutral-400">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="mt-12 scroll-mt-8">
            <h2 className="text-2xl font-bold tracking-tight">
              {i + 1}. {s.title}
            </h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-neutral-800 md:text-[17px]">{s.body}</div>
          </section>
        ))}

        <footer className="mt-16 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 text-sm text-neutral-600">
          <span>
            See also:{' '}
            <a href={seeAlso.href} className="underline underline-offset-4">
              {seeAlso.label}
            </a>
          </span>
          {/* Read from package.json so it cannot quietly fall out of date. */}
          <span className="text-neutral-400">v{version}</span>
        </footer>
      </div>
    </main>
  );
}
