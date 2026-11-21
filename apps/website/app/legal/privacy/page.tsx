import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What VYTRIX stores locally and what is never collected.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy"
      description="A plain description of what the app keeps on your machine."
      updated="2026-11-21"
      sections={[
        {
          heading: "1. The short version",
          paragraphs: [
            "Color profiles, optimizer snapshots and session logs stay on the device. VYTRIX does not record what you type, does not read game memory, and does not upload screen contents.",
          ],
        },
        {
          heading: "2. Local data",
          paragraphs: [
            "Profiles, share codes you export, optimizer snapshots and performance logs are written to the app data folder on your machine. Removing the app data folder removes them. Exporting a share code uploads nothing.",
          ],
        },
        {
          heading: "3. What is not collected",
          paragraphs: ["The app does not collect:"],
          bullets: [
            "Keystroke content or typed text; hotkeys are registered as combinations only.",
            "Game memory, game state or the contents of a game's address space.",
            "Screenshots, screen captures or continuous display contents.",
            "Background audio or microphone input.",
            "Email addresses, credentials or payment details.",
          ],
        },
        {
          heading: "4. Phone control",
          paragraphs: [
            "Companion control works over your local network after explicit pairing. There is no cloud relay and no account on the phone. A pairing expires after 30 days of inactivity and can be revoked from the desktop app.",
          ],
        },
        {
          heading: "5. Updates and integrity",
          paragraphs: [
            "Releases are fetched from the public GitHub repository over HTTPS. Each release carries a SHA-256 digest so the downloaded file can be checked before it is run. No binary is delivered over plaintext HTTP.",
          ],
        },
        {
          heading: "6. Retention and deletion",
          paragraphs: [
            "Local data stays until you delete it. Removing the app data folder clears profiles, snapshots and logs. VYTRIX creates no account, so there is no server-side profile to retain or delete.",
          ],
        },
        {
          heading: "7. Children",
          paragraphs: [
            "VYTRIX is not directed at children under 13.",
          ],
        },
        {
          heading: "8. Contact",
          paragraphs: [
            "Privacy questions can be raised in the community server linked on every page.",
          ],
        },
      ]}
    />
  );
}
