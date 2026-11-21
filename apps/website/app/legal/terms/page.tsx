import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for the VYTRIX website and desktop application.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of use"
      description="The rules for using the VYTRIX website, accounts and desktop application."
      updated="2026-11-01"
      sections={[
        {
          heading: "1. Scope",
          paragraphs: [
            "These terms cover the VYTRIX website and the VYTRIX desktop application for Windows 10 and Windows 11. By using either, you agree to them. The app is licensed to you; it is not sold to you.",
          ],
        },
        {
          heading: "2. License tiers",
          paragraphs: [
            "Free grants use of the display color controls, three saved profiles and the preset gallery. Monthly grants the full suite for the active paid period. Lifetime grants the full suite for the current major version, including minor and patch updates.",
          ],
          bullets: [
            "A Lifetime license does not include a future major version as a matter of course.",
            "Cancelling a Monthly plan ends access at the close of the paid period, not midway through it.",
            "Licenses are for one account and the number of devices stated on the pricing page.",
          ],
        },
        {
          heading: "3. Permitted use",
          paragraphs: [
            "Use the app on Windows systems you control. You may move your own profiles and snapshots between your own devices. You may not redistribute the installer, resell license keys, or remove notices from the software.",
          ],
        },
        {
          heading: "4. Games and system integrity",
          paragraphs: [
            "VYTRIX is a display utility, not a game modification. It does not inject code into games, read game memory, or bypass anti-cheat systems. It does not grant any right to break the rules of a game or service you play. Those rules remain yours to follow.",
          ],
        },
        {
          heading: "5. Reversible changes",
          paragraphs: [
            "The optimizer records the prior value of each setting it changes. You can restore a single setting or a whole snapshot. Some Windows settings require elevation, and the app names them before applying anything.",
          ],
        },
        {
          heading: "6. Accounts and billing",
          paragraphs: [
            "Account, licensing and card payment are handled after sign-in. Prices shown on the website are the planned launch prices; the amount charged is the amount presented at checkout before confirmation. Currency conversion fees are set by your payment provider.",
          ],
        },
        {
          heading: "7. Availability and changes",
          paragraphs: [
            "The website and the app may change as the product develops. Release notes describe what changed. We do not promise that a specific profile will look identical on different panels or driver versions.",
          ],
        },
        {
          heading: "8. Contact",
          paragraphs: [
            "Questions about these terms can be raised in the community server linked on every page. Include the version of the app and the Windows build when the question concerns specific behavior.",
          ],
        },
      ]}
    />
  );
}
