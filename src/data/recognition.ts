export type RecognitionPartner = {
  key: "dec" | "sitc" | "lbc" | "codezela";
  eyebrow: string;
  name: string;
  role: string;
  summary: string;
  detail: string;
  highlight?: string;
  logo: string;
  logoSmall?: string;
  logoAlt: string;
  addresses?: RecognitionAddress[];
};

export type RecognitionAddress = {
  label: string;
  address: string;
};

export const recognitionPartners: RecognitionPartner[] = [
  {
    key: "dec",
    eyebrow: "Sri Lankan institutional recognition",
    name: "DEC",
    role: "Sri Lankan recognition",
    summary:
      "The GBE Awards programme is institutionally recognised in Sri Lanka through DEC.",
    detail:
      "DEC's role here is institutional recognition of the awards programme in Sri Lanka; DEC is not presented as the programme's education provider, awarding body, or academic accreditor.",
    highlight:
      "DEC is identified under the Ministry of Industry of the Democratic Socialist Republic of Sri Lanka, Gazette No. 2387/25.",
    logo: "/assets/recognition/dec-logo.webp",
    logoSmall: "/assets/recognition/dec-logo-small.webp",
    logoAlt: "DEC Sri Lanka",
    addresses: [
      {
        label: "Office",
        address: "No. 03, Pansala Asala, Agala Oya, Giradurukotte, Sri Lanka",
      },
    ],
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
    logo: "/assets/recognition/sitc-campus-logo.webp",
    logoSmall: "/assets/recognition/sitc-campus-logo-small.webp",
    logoAlt: "SITC Campus",
    addresses: [
      {
        label: "Head office",
        address: "Level 26, East Tower, World Trade Center, Colombo 01, Sri Lanka",
      },
      {
        label: "Gampola office",
        address: "No. 285, Hospital Road, Gampola, Sri Lanka",
      },
    ],
  },
  {
    key: "lbc",
    eyebrow: "UK organiser",
    name: "London Business Consultancy",
    role: "Programme administration",
    summary:
      "London Business Consultancy organises and administers the Global Business Excellence Awards from London, UK.",
    detail:
      "As the UK organiser, London Business Consultancy manages programme administration, award records, and authorised certificate issuance from London.",
    logo: "/assets/brand/london-business-consultancy-logo-mask.webp",
    logoAlt: "London Business Consultancy",
    addresses: [
      {
        label: "HQ Address",
        address: "20 Wenlock Road, London, N1 7GU, United Kingdom",
      },
    ],
  },
];

export const recognitionPagePartners: RecognitionPartner[] = [
  ...recognitionPartners,
  {
    key: "codezela",
    eyebrow: "Event management",
    name: "Codezela Technologies",
    role: "Event delivery",
    summary:
      "Codezela Technologies supports event management and delivery for the GBE Awards programme.",
    detail:
      "Its role covers the practical coordination and digital support required to deliver the awards event alongside the programme organiser.",
    logo: "/assets/recognition/codezela-technologies-logo.webp",
    logoAlt: "Codezela Technologies",
    addresses: [
      {
        label: "UK office",
        address: "71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom",
      },
      {
        label: "Sri Lanka head office",
        address: "Level 12, Parkland Building, 33 Park Street, Colombo 02, Sri Lanka",
      },
      {
        label: "Borella office",
        address: "345/35, R. I. T. Alles Mawatha, Borella, Colombo 08, Sri Lanka",
      },
    ],
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
