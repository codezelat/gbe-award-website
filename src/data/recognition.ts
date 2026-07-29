export type RecognitionPartner = {
  key: "dec" | "sitc" | "lbc";
  eyebrow: string;
  name: string;
  role: string;
  summary: string;
  detail: string;
  sourceUrl: string;
  sourceLabel: string;
  logo: string;
  logoSmall?: string;
  logoAlt: string;
};

export const recognitionPartners: RecognitionPartner[] = [
  {
    key: "dec",
    eyebrow: "Institutional recognition",
    name: "Distance Education Council",
    role: "Sri Lanka recognition",
    summary:
      "The Distance Education Council provides institutional recognition for the GBE Awards programme in Sri Lanka.",
    detail:
      "The Distance Education Council identifies itself as registered under Sri Lanka's Ministry of Industry under Gazette No. 2387/25.",
    sourceUrl: "https://decsl.lk/about-us/",
    sourceLabel: "View DEC information",
    logo: "/assets/recognition/dec-logo.webp",
    logoSmall: "/assets/recognition/dec-logo-small.webp",
    logoAlt: "Distance Education Council Sri Lanka",
  },
  {
    key: "sitc",
    eyebrow: "Research and academic review",
    name: "SITC Campus Business Faculty",
    role: "Business research support",
    summary:
      "SITC Campus Business Faculty contributes business-focused research and academic review to the recognition framework.",
    detail:
      "Its role supports informed review by bringing an academic and business-research perspective to the awards programme.",
    sourceUrl: "https://sitc.lk/",
    sourceLabel: "Visit SITC Campus",
    logo: "/assets/recognition/sitc-campus-logo.webp",
    logoSmall: "/assets/recognition/sitc-campus-logo-small.webp",
    logoAlt: "SITC Campus",
  },
  {
    key: "lbc",
    eyebrow: "UK organiser",
    name: "London Business Consultancy",
    role: "Programme administration",
    summary:
      "London Business Consultancy organises and administers the Global Business Excellence Awards from London, UK.",
    detail:
      "London Business Consultancy is a trading name of LBC Group of Companies Ltd, registered in England and Wales under company number 15216645.",
    sourceUrl: "https://find-and-update.company-information.service.gov.uk/company/15216645",
    sourceLabel: "View Companies House record",
    logo: "/assets/brand/london-business-consultancy-logo-mask.webp",
    logoAlt: "London Business Consultancy",
  },
];

export const certificateAuthenticitySteps = [
  {
    number: "01",
    title: "Issued",
    text: "The certificate records the recipient, award title, category, and award year as maintained by the GBE Awards organiser.",
  },
  {
    number: "02",
    title: "Signed",
    text: "Each certificate is signed by an authorised representative of London Business Consultancy, the UK organiser.",
  },
  {
    number: "03",
    title: "Recorded",
    text: "Published winner records provide a public reference connecting the recipient to the relevant award and year.",
  },
] as const;
