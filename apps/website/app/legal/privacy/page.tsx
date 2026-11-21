import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What VYTRIX stores locally, what an account requires, and what is never collected.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy"
      description="A plain description of what the app keeps on your machine and what an account needs."
      updated="2026-11-01"
      sections={[
        {
          heading: "1. The short version",
          paragraphs: [
            "Color profiles, optimizer snapshots and session logs stay on the device. VYTRIX does not record what you type, does not read game memory, and does not upload screen contents.",
          ],
        },
        {
          heading: "2. Account information",
          paragraphs: [
            "Once sign-in is connected, an account requires an email address and a password hash. Licensing needs the plan state and a limited device identifier to apply the device allowance. Card details are handled by the payment provider, not stored by VYTRIX.",
          ],
          bullets: [
            "Email address for account identity and recovery.",
            "Plan and license state for entitlement checks.",
            "Device identifiers only to enforce the tier's device count.",
          ],
        },
        {
          heading: "3. Local data",
          paragraphs: [
            "Profiles, share codes you export, optimizer snapshots and performance logs are written to the app data folder on your machine. Removing the app data folder removes them. Exporting a share code uploads nothing.",
          ],
        },
        {
          heading: "4. What is not collected",
          paragraphs: ["The app does not collect:"],
          bullets: [
            "Keystroke content or typed text; hotkeys are registered as combinations only.",
            "Game memory, game state or the contents of a game's address space.",
            "Screenshots, screen captures or continuous display contents.",
            "Background audio or microphone input.",
          ],
        },
        {
          heading: "5. Phone control",
          paragraphs: [
            "Companion control works over your local network after explicit pairing. There is no cloud relay and no account on the phone. A pairing expires after 30 days of inactivity and can be revoked from the desktop app.",
          ],
        },
        {
          heading: "6. Updates and integrity",
          paragraphs: [
            "Update manifests and binaries are fetched over HTTPS. Each release carries a SHA-256 digest so the downloaded file can be checked before it is run. No binary is delivered over plaintext HTTP.",
          ],
        },
        {
          heading: "7. Retention and deletion",
          paragraphs: [
            "Local data stays until you delete it. Account data is retained while the account exists and is removed on a verified deletion request, except where a record must be kept for billing reconciliation.",
          ],
        },
        {
          heading: "8. Children",
          paragraphs: [
            "VYTRIX is not directed at children under 13, and no account is intended for them.",
          ],
        },
        {
          heading: "9. Contact",
          paragraphs: [
            "Privacy questions can be raised in the community server linked on every page. Do not post account details in public channels.",
          ],
        },
      ]}
    />
  );
}
