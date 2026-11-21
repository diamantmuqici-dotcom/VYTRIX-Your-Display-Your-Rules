import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Refunds",
  description: "Refund windows and cancellation behavior for VYTRIX Monthly and Lifetime licenses.",
};

export default function RefundsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Refunds"
      description="When a payment can be returned and how to ask for it."
      updated="2026-11-01"
      sections={[
        {
          heading: "1. Free tier",
          paragraphs: [
            "There is no charge for the Free tier, so there is nothing to refund. No card is required to use it.",
          ],
        },
        {
          heading: "2. Monthly",
          paragraphs: [
            "A Monthly subscription can be cancelled at any time. Access continues until the end of the paid period. A charge for a period already started is not refunded on cancellation; a charge for a period that has not started is not taken after cancellation.",
          ],
        },
        {
          heading: "3. Lifetime",
          paragraphs: [
            "A Lifetime purchase can be refunded within 14 days of the original charge if the license has not been materially used. Heavy use of the optimizer or repeated profile exports counts as material use.",
          ],
        },
        {
          heading: "4. Duplicate charges and failed delivery",
          paragraphs: [
            "A duplicate charge or a license key that never arrived is refunded in full once the payment record is located. Include the charge date and the last four digits of the card in the request.",
          ],
        },
        {
          heading: "5. How to request",
          paragraphs: [
            "Refund requests are made from the account surface once billing is connected. Until that surface is live, the community server is the contact route. Include the account email and the approximate purchase date; do not post payment details publicly.",
          ],
        },
        {
          heading: "6. Chargebacks",
          paragraphs: [
            "Contact the project before opening a chargeback so the payment can be reversed directly. A chargeback ends access to the associated license while the case is reviewed.",
          ],
        },
        {
          heading: "7. Price changes",
          paragraphs: [
            "A price change never affects a purchase already made. A Lifetime license keeps the tier it bought at the time of purchase.",
          ],
        },
      ]}
    />
  );
}
