# US Privacy Notice — Source Record

운영 URL: https://ampory.vercel.app/us/privacy (noindex, HTTP 200)

아래는 `app/us/privacy/page.tsx` 기준 소스 전문입니다.

```tsx
import type {Metadata} from 'next';
import {UsPolicyShell} from '@/components/us/policy-shell';
import {UsOperatorDetails} from '@/components/us/operator-details';
import {US_OPERATOR} from '@/lib/us/operator';
import {usPageMetadata} from '@/lib/seo-us';

export const metadata: Metadata = usPageMetadata({
  title: 'Privacy Notice',
  description:
    'How Ampory handles local calculator data, Vercel Hobby hosting logs, personal Gmail inquiries, disabled US analytics, and privacy requests.',
  path: '/us/privacy',
});

export default function Page() {
  return (
    <UsPolicyShell title="Privacy Notice">
      <p>
        Effective date: {US_OPERATOR.policyDate}. This English notice describes the United States application. It is not
        professional legal advice ({US_OPERATOR.professionalLegalAdvice}). The operator is subject to the Republic of
        Korea Personal Information Protection Act (PIPA), including Article 28-8 overseas-transfer disclosure rules,
        while also describing practices relevant to visitors from other regions.
      </p>
      <UsOperatorDetails />

      <h2 className="mt-6 text-lg font-semibold">Calculations and browser storage</h2>
      <p>
        Calculations run in your browser. The US application has no account, cloud synchronization, hosted project
        database, or calculator-input upload feature. Settings, favorites, recent searches, and supported workspace
        drafts use localStorage in this browser profile. Exported JSON, CSV, and SVG files are saved on your device.
        Browser data persists until you clear it through the site controls or browser site-data settings. Remove
        exported files yourself. Do not enter personal or confidential facility information on a shared device.
      </p>

      <h2 className="mt-6 text-lg font-semibold">What happens when you open a page</h2>
      <p>
        Opening a page sends normal HTTPS requests to the hosting provider (Vercel Inc.) and may involve the edge CDN.
        This can include an IP address, requested path, HTTP method, status code, browser and device information,
        timestamps, security-related signals, and service-generated diagnostic data. The confirmed Ampory project uses a{' '}
        <strong>Vercel Hobby</strong> plan. The operator’s serverless-function region is configured as <strong>iad1</strong>;
        that setting does not describe every CDN, security-log, support, backup, or sub-processor location used by Vercel.
      </p>
      <p className="mt-3">
        <strong>Runtime logs (Vercel dashboard)</strong> are distinct from all hosting records. Official Vercel
        documentation (last reviewed November 25, 2026) states dashboard <strong>runtime log retention</strong> of{' '}
        <strong>one hour on Hobby</strong>, one day on Pro, three days on Enterprise, and up to thirty days with
        Observability Plus on eligible plans. That window is how long recent runtime logs remain available in the Logs
        UI—it is not a statement that every provider copy of all access records is erased in one hour.{' '}
        <strong>Build logs</strong>, <strong>security operations</strong>, <strong>CDN cache diagnostics</strong>,{' '}
        <strong>Web Analytics</strong>, <strong>Speed Insights</strong>, <strong>Log Drains</strong>, and other
        service-generated data may follow separate product rules described in Vercel’s Privacy Policy and Terms of
        Service. The operator has not confirmed every retention period inside the live account dashboard.
      </p>
      <p className="mt-3">
        Vercel’s published <strong>Data Processing Addendum</strong> (effective March 31, 2026) applies to customers on{' '}
        <strong>Pro and Enterprise</strong> plans. This notice does <strong>not</strong> claim that the same DPA
        automatically covers the actual Hobby account. Lack of that DPA is not treated here as proof that all hosting is
        unlawful; it means the operator relies on Vercel’s general Terms and Privacy Policy for the Hobby relationship
        and describes the processing in this notice.
      </p>
      <p className="mt-3">
        US Google Analytics, AdSense, and affiliate transmission remain disabled in the US application. The US
        application does not intentionally set advertising or analytics cookies. Protected Preview authentication or
        Vercel tooling may set provider cookies or make provider requests. Following an external reference opens another
        provider’s service. Switching to the Korean site changes the service context; its prepared AdSense code is
        separate from the US application. Korean ads are not currently displayed and no AdSense revenue is being
        generated, although scripts may still be requested on the Korean site.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Overseas processing and entrustment (PIPA Art. 28-8)</h2>
      <p>
        The operator distinguishes (a) data the operator entrusts or transfers to deliver the site, and (b) data you
        choose to send by email. Visiting the site does not by itself mean you consent to every overseas transfer
        described below. Required PIPA items are listed separately for each case using information confirmed from
        official provider materials as of the review date.
      </p>
      <h3 className="mt-4 font-semibold">Website hosting — Vercel Inc.</h3>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Information:</strong> request metadata such as IP address, URL, headers, device or browser signals,
          timestamps, and security or operational logs generated to deliver and protect the site.
        </li>
        <li>
          <strong>Recipient:</strong> Vercel Inc. (Delaware, USA) and infrastructure identified in Vercel’s Privacy
          Policy and sub-processor disclosures (not limited to a single country).
        </li>
        <li>
          <strong>When and how:</strong> when you request a page over HTTPS during normal browsing.
        </li>
        <li>
          <strong>Purpose:</strong> host, deliver, secure, and operate the website.
        </li>
        <li>
          <strong>Retention:</strong> Hobby runtime logs remain available in the dashboard for about one hour per official
          docs; other provider retention categories follow Vercel’s applicable policies and product features. The
          operator cannot delete all provider-held logs through this website.
        </li>
        <li>
          <strong>Refusal and effect:</strong> without remote hosting the operator cannot provide this public website;
          calculators could not be reached online through Ampory. Local-only delivery is not offered.
        </li>
        <li>
          <strong>Safeguards:</strong> HTTPS transport, provider security measures described in Vercel’s Terms and
          Privacy Policy, and minimal data collection by the application design (no server-side calculator database).
        </li>
        <li>
          <strong>Contract basis:</strong> Vercel Terms of Service and Privacy Policy for the Hobby account; Pro/Enterprise
          DPA not claimed.
        </li>
      </ul>
      <h3 className="mt-4 font-semibold">Email inquiries — Google LLC (personal Gmail)</h3>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Information:</strong> your email address, message text, optional name or attachment, and routine
          message metadata you choose to send.
        </li>
        <li>
          <strong>Recipient:</strong> Google LLC operating Gmail, and Google’s processing locations described in Google’s
          Privacy Policy (worldwide data centers and subprocessors—not a single fixed country chosen by Ampory).
        </li>
        <li>
          <strong>When and how:</strong> only when you initiate a message through your mail client (mailto). The site does
          not submit the message automatically.
        </li>
        <li>
          <strong>Purpose:</strong> receive, read, and respond to your inquiry; manual retention tracking by the operator.
        </li>
        <li>
          <strong>Operator retention:</strong> normally six months after the matter is closed, with monthly manual review
          and deletion of retained mailbox copies, sent replies, and attachments unless a limited legal preservation
          exception applies. This is operator policy, not a statutory term or automated deletion at Google.
        </li>
        <li>
          <strong>Google retention:</strong> separate from the operator schedule. Google maintains its own security,
          backup, and deletion practices (including Trash recovery periods). The operator cannot guarantee immediate
          erasure of every Google-held copy. See Google’s Privacy Policy and Gmail help documentation.
        </li>
        <li>
          <strong>Account type:</strong> ordinary personal Gmail — not Google Workspace or Workspace Individual; no
          Workspace-specific DPA is assumed.
        </li>
        <li>
          <strong>Refusal and effect:</strong> you may use calculators without emailing. If you do not send email, the
          operator will not receive your message content for handling.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Email inquiries (operator practices)</h2>
      <p>
        You may send a message directly to{' '}
        <a className="text-primary underline" href={`mailto:${US_OPERATOR.email}`}>
          {US_OPERATOR.email}
        </a>
        , including in English. The site has no hosted message form. Use only information needed for the inquiry. Records
        are used for handling the inquiry and related follow-up, not for marketing or advertising.
      </p>
      <p className="mt-3">
        The normal operator retention limit is six months after the matter is closed. The operator manually reviews
        retention monthly and deletes expired records. Records are deleted earlier when no longer needed or when the law
        requires. A specific preservation duty or necessary ongoing dispute may require limited, separately controlled
        retention until that reason ends.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Hobby commercial use</h2>
      <p>
        Vercel’s Terms (last reviewed November 25, 2026) and Fair Use Guidelines state that the Hobby plan is for
        personal or non-commercial projects. AdSense is cited as an example of commercial use. Ampory is currently a free
        site operated by an individual in Korea; Korean AdSense code may exist but ads are not displayed and no AdSense
        revenue is reported. Future advertising, affiliate, or other monetization may change whether Hobby remains
        appropriate. The operator has not upgraded plans, paid for Pro, or sent a support ticket as part of this notice. If
        monetization proceeds, the operator will reassess hosting plan terms before enabling revenue features.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Requests and safeguards</h2>
      <p>
        Send privacy access, correction, deletion, processing-restriction, or other applicable rights requests to the
        operator at the address above. Identify the relevant correspondence without sending an identity document. Any
        necessary identity check must be proportionate. The operator will apply the applicable law and explain a lawful
        limitation where relevant. Local browser information can be removed on your device and is not available to the
        operator through a cloud account. The operator maintains a separate internal procedure for handling requests and
        manual retention reviews.
      </p>
      <p className="mt-3">
        The operating procedure calls for account access protection, limited access, minimal collection, manual retention
        tracking, separately recorded legal holds, and incident assessment. It does not certify an independently audited
        security program.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Children</h2>
      <p>
        The service addresses general electrical engineering calculations for adults and professionals. It is not
        directed at children under 13. If the operator learns that a child’s personal information was collected in
        violation of applicable law, the operator will take appropriate steps consistent with that law.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Changes</h2>
      <p>
        Material changes will be identified by an updated policy date. Contact information and statutory remedies are
        not limited by the Terms of Use. Enabling US analytics, advertising, affiliate programs, or a different hosting
        or email provider would require an updated notice and, where applicable, separate approval before implementation.
      </p>
    </UsPolicyShell>
  );
}
```
