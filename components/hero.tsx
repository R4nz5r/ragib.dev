import { siteConfig } from "@/site.config";
import { serializeNow } from "@/lib/now";
import { CodeBlock } from "@/components/mdx/code-block";
import { NewsletterForm } from "@/components/newsletter-form";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export async function Hero() {
  const nowCode = serializeNow();

  return (
    <section className="hero">
      <div className="wrap">
        <div className="grid12 hero__grid">
          <div className="c-7 hero__copy">
            <h1 className="t-h1">{siteConfig.hero.heading}</h1>
            <p className="hero__lead t-prose">{siteConfig.hero.lead}</p>
            <div className="hero__links">
              <Button
                as="a"
                variant="outline"
                href={siteConfig.links.portfolio}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="external" size={16} />
                <span>Portfolio</span>
              </Button>
              <Button
                as="a"
                variant="outline"
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="github" size={16} />
                <span>GitHub</span>
              </Button>
              <Button
                as="a"
                variant="outline"
                href={siteConfig.links.x}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="x" size={16} />
                <span>Twitter</span>
              </Button>
            </div>
            <NewsletterForm />
          </div>
          <div className="c-5" data-slot="now">
            <CodeBlock
              code={nowCode}
              language="ts"
              filename="now.ts"
              highlightLines={[4]}
              className="my-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
