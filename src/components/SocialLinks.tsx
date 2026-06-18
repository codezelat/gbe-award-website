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

function WhatsappIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4.7 19.4 6 15.6a7.4 7.4 0 1 1 2.7 2.7l-4 1.1Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9.2 8.6c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.6 1.4c.1.3 0 .5-.2.7l-.4.4c.6 1 1.3 1.8 2.4 2.3l.5-.5c.2-.2.4-.3.7-.1l1.4.7c.3.1.4.3.3.6-.1.6-.8 1.5-1.4 1.5-2.6 0-6.2-3.1-6.2-6 0-.3.1-.5.1-.6Z" fill="currentColor" />
    </svg>
  );
}

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/", Icon: InstagramIcon },
  { label: "Facebook", href: "https://www.facebook.com/", Icon: FacebookIcon },
  { label: "X-twitter", href: "https://x.com/", text: "X" },
  { label: "Linkedin", href: "https://www.linkedin.com/", Icon: LinkedinIcon },
  { label: "Whatsapp", href: "https://wa.me/", Icon: WhatsappIcon },
];

type SocialLinksProps = {
  compact?: boolean;
};

export default function SocialLinks({ compact = false }: SocialLinksProps) {
  return (
    <nav className={compact ? "social-links social-links--footer" : "social-links"} aria-label="Social links">
      {socialLinks.map(({ label, href, Icon, text }) => (
        <a key={label} href={href} aria-label={label}>
          {Icon ? <Icon aria-hidden="true" /> : <span aria-hidden="true">{text}</span>}
        </a>
      ))}
    </nav>
  );
}
