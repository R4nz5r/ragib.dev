"use client";

import { useState } from "react";
import { siteConfig } from "@/site.config";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

interface ShareRowProps {
  title: string;
  slug: string;
}

export function ShareRow({ title, slug }: ShareRowProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${siteConfig.url}/articles/${slug}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const emailSubject = encodeURIComponent(title);
  const emailBody = encodeURIComponent(`Check out this article: ${shareUrl}`);
  const mailtoUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${emailSubject}&body=${emailBody}`;

  function handleEmailClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const isMobile =
      typeof navigator !== "undefined" &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      e.preventDefault();
      window.open(gmailUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function handleCopy() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore copy errors
    }
  }

  return (
    <div className="share">
      <span className="t-label">Share this post</span>
      <div className="share__b">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          aria-label={copied ? "Link copied" : "Copy link"}
          data-copy-link
        >
          <Icon name={copied ? "check" : "link"} size={16} />
          <span className="lbl">{copied ? "Copied" : "Copy link"}</span>
        </Button>
        <Button
          as="a"
          variant="outline"
          size="sm"
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="x" size={16} />
          <span>Post on X</span>
        </Button>
        <Button
          as="a"
          variant="outline"
          size="sm"
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="linkedin" size={16} />
          <span>LinkedIn</span>
        </Button>
        <Button
          as="a"
          variant="outline"
          size="sm"
          href={mailtoUrl}
          onClick={handleEmailClick}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="mail" size={16} />
          <span>Email</span>
        </Button>
      </div>
    </div>
  );
}
