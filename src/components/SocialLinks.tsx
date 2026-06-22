type IconProps = {
  "aria-hidden": "true";
};

function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="5" y="5" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="16.7" cy="7.4" r="1.1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M14 8.2h2.2V4.5a28 28 0 0 0-3.2-.2c-3.2 0-5.4 1.9-5.4 5.5V13H4v4.1h3.6V24h4.4v-6.9h3.5l.6-4.1H12V10.2c0-1.2.3-2 2-2Z" />
    </svg>
  );
}

function LinkedinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M5.2 8.8H1.4V22h3.8V8.8ZM3.3 2.2a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM22 14.8c0-4-2.1-6.3-5.3-6.3a4.6 4.6 0 0 0-4.1 2.2h-.1V8.8H8.9V22h3.8v-6.5c0-1.7.3-3.4 2.5-3.4 2 0 2.1 2 2.1 3.5V22H22v-7.2Z" />
    </svg>
  );
}

function XIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.53 3h3.2l-7 8 8.24 10.91h-6.46l-5.06-6.61L6.1 21.91H2.9l7.48-8.55L2.43 3h6.62l4.57 6.05L17.53 3Zm-1.12 16.17h1.77L7.68 4.71H5.78l10.63 14.46Z" />
    </svg>
  );
}

function WhatsappIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.1c-.24.68-1.42 1.31-1.95 1.35-.5.05-1.13.29-3.8-.79-3.2-1.26-5.26-4.52-5.42-4.73-.16-.21-1.3-1.73-1.3-3.29 0-1.56.82-2.33 1.1-2.64.29-.32.63-.4.84-.4l.6.01c.19.01.45-.07.7.54.24.62.84 2.15.91 2.3.07.16.12.35.02.56-.1.21-.15.35-.29.54-.15.18-.31.41-.44.55-.15.15-.3.31-.13.6.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.3 2.33 1.45.29.14.46.12.63-.07.17-.2.73-.85.93-1.15.19-.29.39-.24.65-.15.27.1 1.69.8 1.98.95.29.14.49.21.56.33.07.12.07.7-.17 1.38Z" />
    </svg>
  );
}

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/gbeaward/", Icon: InstagramIcon },
  { label: "Facebook", href: "https://www.facebook.com/gbeaward/", Icon: FacebookIcon },
  { label: "X (Twitter)", href: "https://x.com/gbeaward", Icon: XIcon },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/gbeaward/", Icon: LinkedinIcon },
  { label: "WhatsApp", href: "https://wa.link/10p065", Icon: WhatsappIcon },
];

type SocialLinksProps = {
  compact?: boolean;
};

export default function SocialLinks({ compact = false }: SocialLinksProps) {
  return (
    <nav className={compact ? "social-links social-links--footer" : "social-links"} aria-label="Social links">
      {socialLinks.map(({ label, href, Icon }) => (
        <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer">
          <Icon aria-hidden="true" />
        </a>
      ))}
    </nav>
  );
}
