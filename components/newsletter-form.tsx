"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

type FormStatus = "idle" | "submitting" | "success" | "error";

interface NewsletterFormProps {
  hideLabel?: boolean;
  defaultNote?: string;
}

export function NewsletterForm({
  hideLabel = false,
  defaultNote = "One email a month. Unsubscribe anytime.",
}: NewsletterFormProps = {}) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || status === "submitting") return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, honeypot }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Failed to subscribe. Please try again.");
        return;
      }

      // Success
      setStatus("success");
      setEmail("");
      setHoneypot("");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <form className="signup" onSubmit={handleSubmit} data-signup>
      {/* Honeypot field for anti-spam (hidden from real users) */}
      <input
        type="text"
        name="b_name"
        tabIndex={-1}
        autoComplete="off"
        style={{ display: "none" }}
        aria-hidden="true"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
      />
      {!hideLabel && <span className="t-label">Get new posts by email</span>}
      <div className="signup__row">
        <label className="field">
          <Icon name="mail" size={20} className="ic--20" />
          <input
            type="email"
            placeholder="you@example.com"
            aria-label="Email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "submitting"}
          />
        </label>
        <Button
          variant="primary"
          size="lg"
          type="submit"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Subscribing..." : "Subscribe"}
        </Button>
      </div>
      <p
        className={[
          "signup__note t-cap",
          status === "success" ? "is-done" : "",
          status === "error" ? "is-error" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-live="polite"
      >
        {status === "submitting"
          ? "Subscribing..."
          : status === "success"
          ? "Thanks for subscribing! You're on the list."
          : status === "error"
          ? errorMessage
          : defaultNote}
      </p>
    </form>
  );
}
