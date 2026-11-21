import { Button } from "@/components/button";
import { Container } from "@/components/container";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-brand-cyan">404</p>
      <h1 className="mt-5 font-display text-3xl font-bold text-ink sm:text-4xl">
        Nothing at this address.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        The page moved or never existed. The site map is linked in the footer.
      </p>
      <Button href="/" className="mt-8">
        Back to the start
      </Button>
    </Container>
  );
}
