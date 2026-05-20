/**
 * Primary site navigation — grouped IA (Investigate · Accountability · The Law).
 * Consumed by `Header` (desktop dropdowns) and `MobileNav` (drawer sections).
 */

export interface NavItem {
  icon: string;
  name: string;
  desc: string;
  href: string;
}

export interface NavGroup {
  /** Stable id for open-state / ARIA. */
  id: string;
  /** e.g. "Investigate" */
  label: string;
  items: NavItem[];
  /** Desktop dropdown column layout. */
  columns: 1 | 2;
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "investigate",
    label: "Investigate",
    columns: 2,
    items: [
      {
        icon: "🧵",
        name: "Stories",
        desc: "Live accountability timelines",
        href: "/stories",
      },
      {
        icon: "🗺️",
        name: "Provinces",
        desc: "9 provinces & municipalities",
        href: "/provinces",
      },
      {
        icon: "🏭",
        name: "State Entities",
        desc: "Eskom · PRASA · SAPO…",
        href: "/state-entities",
      },
      {
        icon: "👤",
        name: "Human Impact",
        desc: "The real cost",
        href: "/impact",
      },
      {
        icon: "⚖️",
        name: "Transformation",
        desc: "B-BBEE, land, economic justice",
        href: "/transformation",
      },
      {
        icon: "📖",
        name: "History",
        desc: "Before, during & after apartheid",
        href: "/history",
      },
    ],
  },
  {
    id: "accountability",
    label: "Accountability",
    columns: 2,
    items: [
      {
        icon: "🏛️",
        name: "Commissions",
        desc: "22 since 1994",
        href: "/commissions",
      },
      {
        icon: "🏢",
        name: "Ad Hoc Committees",
        desc: "Parliamentary inquiries",
        href: "/commissions?tab=adhoc",
      },
      {
        icon: "💰",
        name: "SIU",
        desc: "Money recovery tracker",
        href: "/siu",
      },
      {
        icon: "🦂",
        name: "Special Units",
        desc: "Scorpions · Hawks · IDAC",
        href: "/accountability-bodies",
      },
    ],
  },
  {
    id: "law",
    label: "The Law",
    columns: 1,
    items: [
      {
        icon: "📋",
        name: "Laws & Acts",
        desc: "PRECCA · PFMA · POCA…",
        href: "/laws",
      },
      {
        icon: "📜",
        name: "Constitution",
        desc: "Your rights, explained",
        href: "/constitution",
      },
    ],
  },
];

/** Mobile drawer section copy (can differ slightly from desktop). */
export const MOBILE_NAV_SECTIONS: {
  sectionId: string;
  title: string;
  items: NavItem[];
}[] = [
  {
    sectionId: "investigate",
    title: "INVESTIGATE",
    items: [
      {
        icon: "🧵",
        name: "Stories",
        desc: "Live accountability timelines",
        href: "/stories",
      },
      {
        icon: "🗺️",
        name: "Provinces",
        desc: "9 provinces & municipalities",
        href: "/provinces",
      },
      {
        icon: "🏭",
        name: "State Entities",
        desc: "Eskom · PRASA · SAPO · SABC…",
        href: "/state-entities",
      },
      {
        icon: "👤",
        name: "Human Impact",
        desc: "The real cost for ordinary people",
        href: "/impact",
      },
      {
        icon: "⚖️",
        name: "Transformation",
        desc: "B-BBEE, land, economic justice",
        href: "/transformation",
      },
      {
        icon: "📖",
        name: "History",
        desc: "South Africa: before, during & after",
        href: "/history",
      },
    ],
  },
  {
    sectionId: "accountability",
    title: "ACCOUNTABILITY",
    items: [
      {
        icon: "🏛️",
        name: "Commissions",
        desc: "22 national commissions since 1994",
        href: "/commissions",
      },
      {
        icon: "🏢",
        name: "Ad Hoc Committees",
        desc: "Parliamentary investigations",
        href: "/commissions?tab=adhoc",
      },
      {
        icon: "💰",
        name: "SIU",
        desc: "Special Investigating Unit · money tracked",
        href: "/siu",
      },
      {
        icon: "🦂",
        name: "Special Units",
        desc: "Scorpions · Hawks · IDAC",
        href: "/accountability-bodies",
      },
    ],
  },
  {
    sectionId: "law",
    title: "THE LAW",
    items: [
      {
        icon: "📋",
        name: "Laws & Acts",
        desc: "PRECCA · PFMA · POCA · SAPS Act…",
        href: "/laws",
      },
      {
        icon: "📜",
        name: "Constitution",
        desc: "Your rights, plain and simple",
        href: "/constitution",
      },
    ],
  },
  {
    sectionId: "more",
    title: "MORE",
    items: [
      {
        icon: "👥",
        name: "People",
        desc: "Key figures across all bodies",
        href: "/people",
      },
      {
        icon: "ℹ️",
        name: "About",
        desc: "What The Record is",
        href: "/about",
      },
    ],
  },
];
