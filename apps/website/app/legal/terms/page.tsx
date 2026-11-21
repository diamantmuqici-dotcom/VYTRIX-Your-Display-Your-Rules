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
      description="The rules for using the VYTRIX website and desktop application."
      updated="2026-11-21"
      sections={[
        {
          heading: "1. Scope",
          paragraphs: [
            "These terms cover the VYTRIX website and the VYTRIX desktop application for Windows 10 and Windows 11. By using either, you agree to them. The app is free and its source is published under the MIT license.",
          ],
        },
        {
          heading: "2. Free and open source",
          paragraphs: [
            "The full suite is free in every public release. There is nothing to subscribe to and no key to enter. The source and the build instructions are published in the open.",
          ],
          bullets: [
            "Builds are published on the public GitHub releases page.",
            "Source and build instructions are in the public repository under MIT.",
            "Minor and patch updates are published on the same releases page.",
          ],
        },
        {
          heading: "3. Permitted use",
          paragraphs: [
            "Use the app on Windows systems you control. You may move your own profiles and snapshots between your own devices. If you redistribute your own builds, keep the MIT license notice intact.",
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
          heading: "6. Availability and changes",
          paragraphs: [
            "The website and the app may change as the product develops. Release notes describe what changed. We do not promise that a specific profile will look identical on different panels or driver versions.",
          ],
        },
        {
          heading: "7. Contact",
          paragraphs: [
            "Questions about these terms can be raised in the community server linked on every page. Include the version of the app and the Windows build when the question concerns specific behavior.",
          ],
        },
      ]}
    />
  );
}
