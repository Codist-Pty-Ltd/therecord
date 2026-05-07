/** Seven generic B-BBEE scorecard elements for the transformation explainer. */
export const BBEE_SCORECARD_ELEMENTS: readonly {
  name: string;
  summary: string;
}[] = [
  {
    name: "Ownership",
    summary:
      "Who holds shares and economic interest — black ownership measured with substance, not only on paper.",
  },
  {
    name: "Management control",
    summary:
      "Who sits in executive and board roles with real decision-making power.",
  },
  {
    name: "Skills development",
    summary:
      "Training and development spend aimed at building capacity among black employees.",
  },
  {
    name: "Enterprise development",
    summary:
      "Support for black-owned enterprises, including financial and non-financial development.",
  },
  {
    name: "Supplier development",
    summary:
      "Preferential procurement and supplier programmes to grow black-owned suppliers.",
  },
  {
    name: "Socio-economic development",
    summary:
      "Contributions to communities — education, health, welfare, and similar programmes.",
  },
  {
    name: "Net value",
    summary:
      "Whether black shareholders receive real economic benefit from ownership — not only shares on paper.",
  },
];

export const LEGAL_SECTOR_CASE_PLAIN = {
  child: `Some of the biggest law firms in the country went to court in May 2026. They say the government’s special rules for law firms (the Legal Sector Code) are unfair or against the Constitution.

Other lawyers’ groups and parts of government say those rules are needed so the legal profession can finally reflect South Africa — not only the people who were always let in.

The judge listened for a week. She has not decided yet. That decision will be written down and made public when it is ready.`,
  layperson: `Four large law firms (Norton Rose Fulbright / Deneys Reitz, Bowmans, Webber Wentzel, Werksmans), with trade union Solidarity, challenged the B-BBEE Legal Sector Code in the Gauteng High Court in Pretoria from 4–8 May 2026 before Judge Nicolene Janse van Nieuwenhuizen.

They argue the code is irrational, procedurally flawed, and constitutionally defective — including targets described as unachievable without fronting, carve-outs for most small firms, and changes that downgrade tools such as bursaries.

The Black Business Council, Black Lawyers Association, Legal Practice Council, Advocates for Transformation, Nadel, national departments, and others defend the code — framing it as necessary for real transformation at the Bar and in firms.

The hearing is finished; judgment is pending. The Record reports what was argued and will summarise the outcome once the court gives reasons.`,
  legal: `Judicial review proceedings in the Gauteng High Court, Pretoria (4–8 May 2026): the applicants challenge the validity of the B-BBEE Legal Sector Code (Gazette 20 September 2024) on administrative-law and constitutional grounds — rationality, legality, and rights analysis under the Constitution (including freedoms of trade, occupation, and profession read with the equality jurisprudence of section 9(2)).

Respondents include transformation organisations, professional regulators, and the executive. The court must determine, inter alia, whether the sector code falls within empowered delegations under the Broad-Based Black Economic Empowerment Act and whether contested targets and recognition rules survive proportionate scrutiny.

As of May 2026 the record shows oral argument concluded and judgment reserved. Outcomes and ratio must be stated only from the published judgment.`,
} as const;
