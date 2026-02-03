export type JargonCategory =
  | 'option-types'
  | 'valuation'
  | 'ownership'
  | 'exercise'
  | 'analysis'
  | 'exit-scenarios'
  | 'tax';

export interface JargonDefinition {
  term: string;
  definition: string;
  category: JargonCategory;
}

export const JARGON: Record<string, JargonDefinition> = {
  // Option Types
  iso: {
    term: 'ISO',
    definition:
      'Incentive Stock Options. A type of employee stock option with favorable tax treatment if held for 2+ years from grant and 1+ year from exercise. No ordinary income tax at exercise, but may trigger AMT.',
    category: 'option-types',
  },
  nso: {
    term: 'NSO',
    definition:
      'Non-Qualified Stock Options. Stock options taxed as ordinary income on the spread at exercise. More common for contractors and advisors. No special holding requirements.',
    category: 'option-types',
  },

  // Valuation Terms
  'strike-price': {
    term: 'Strike Price',
    definition:
      'The fixed price per share you pay when exercising your options. Set at grant time, typically at the 409A valuation. Lower strike = more profit if company value increases.',
    category: 'valuation',
  },
  fmv: {
    term: 'FMV',
    definition:
      'Fair Market Value. The current estimated value per share, typically determined by a 409A valuation. Used to calculate your paper gains and tax implications.',
    category: 'valuation',
  },
  '409a': {
    term: '409A',
    definition:
      'An independent valuation required by IRS rules to set the fair market value of private company stock. Updated annually or after significant events. Named after IRS Section 409A, which governs nonqualified deferred compensation plans.',
    category: 'valuation',
  },

  // Ownership Terms
  ownership: {
    term: 'Ownership %',
    definition:
      'Your percentage stake in the company on a fully-diluted basis. Calculated as your shares divided by total shares outstanding (including all options and reserved shares).',
    category: 'ownership',
  },
  dilution: {
    term: 'Dilution',
    definition:
      'The reduction in your ownership percentage when new shares are issued during funding rounds. Your number of shares stays the same, but the total pool grows.\n\nExample: You own 1% (10,000 of 1,000,000 shares). Series A raises money at 20% dilution, issuing 250,000 new shares.\n\n• Before: 10,000 ÷ 1,000,000 = 1.00%\n• After: 10,000 ÷ 1,250,000 = 0.80%\n\nFormula: New % = Old % × (1 - dilution)\n0.80% = 1.00% × (1 - 0.20)',
    category: 'ownership',
  },
  seed: {
    term: 'Seed',
    definition:
      'The earliest priced funding round, typically $1-5M raised at $5-20M valuation. Median dilution is ~18-20%. Often follows friends & family or angel investment.',
    category: 'ownership',
  },
  'series-a': {
    term: 'Series A',
    definition:
      'First major institutional funding round, typically $5-15M raised at $15-50M valuation. Median dilution is ~18-20%. Usually requires product-market fit evidence.',
    category: 'ownership',
  },
  'series-b': {
    term: 'Series B',
    definition:
      'Growth-stage funding round, typically $15-50M raised at $50-200M valuation. Median dilution is ~15-17%. Focus shifts to scaling the business.',
    category: 'ownership',
  },
  'series-c': {
    term: 'Series C',
    definition:
      'Later-stage funding for proven companies, typically $50M+ raised. Median dilution is ~11-13%. Often preparation for IPO or large acquisition.',
    category: 'ownership',
  },
  'series-d': {
    term: 'Series D+',
    definition:
      'Very late-stage private funding, often pre-IPO. Lower dilution (~8%) as company has proven model. May include crossover investors who also invest in public markets.',
    category: 'ownership',
  },

  // Exercise Terms
  'exercise-cost': {
    term: 'Exercise Cost',
    definition:
      'The total cash required to purchase your options. This is what you pay to convert options into actual shares.\n\nFormula: Options × Strike Price = Cost\n10,000 × $1.00 = $10,000',
    category: 'exercise',
  },
  'paper-gain': {
    term: 'Paper Gain',
    definition:
      "The theoretical profit if you could sell today. Called 'paper' because you can't realize it until an exit event (IPO, acquisition).\n\nFormula: (FMV - Strike) × Options = Gain\n($5.00 - $1.00) × 10,000 = $40,000",
    category: 'exercise',
  },
  'current-value': {
    term: 'Current Value',
    definition:
      'The theoretical value of your shares based on current FMV. Not realizable until a liquidity event (IPO, acquisition, secondary sale).\n\nFormula: Options × FMV = Value\n10,000 × $5.00 = $50,000',
    category: 'exercise',
  },

  // Analysis Terms
  'break-even': {
    term: 'Break-even Multiple',
    definition:
      'How much the company must grow for your shares to be worth what you paid to exercise. Below 1x means you\'re already "in the money."\n\nFormula: Strike ÷ FMV = Multiple\n$1.00 ÷ $5.00 = 0.2x (already profitable)\n$5.00 ÷ $2.00 = 2.5x (need 2.5x growth)',
    category: 'analysis',
  },
  'expected-value': {
    term: 'Expected Value',
    definition:
      'Probability-weighted average outcome based on startup exit statistics.\n\nFormula: Σ (probability × outcome)\n\n• 75% × $0 (failure) = $0\n• 10% × $20K (acqui-hire) = $2K\n• 10% × $100K (moderate) = $10K\n• 5% × $500K (strong) = $25K\n\nExpected Value = $37K\n\nMost startups fail, but rare big wins pull up the average.',
    category: 'analysis',
  },
  'exit-valuation': {
    term: 'Exit Valuation',
    definition:
      'The total value of the company at the time of a liquidity event (IPO, acquisition, or merger). Your payout = ownership % × exit valuation (minus exercise cost, taxes, and any liquidation preferences).',
    category: 'analysis',
  },
  'opportunity-cost': {
    term: 'Opportunity Cost',
    definition:
      'The potential gain you give up by choosing one investment over another. Money used to exercise options could have been invested elsewhere (like index funds) for compound growth.',
    category: 'analysis',
  },
  'sp500-returns': {
    term: 'S&P 500 Returns',
    definition:
      'The S&P 500 has returned ~10% annually on average since 1926 (nominal, before inflation). Real returns average ~7%. Includes dividends reinvested. Source: NYU Stern Damodaran historical returns data. Past performance does not guarantee future results.',
    category: 'analysis',
  },
  'time-to-exit': {
    term: 'Time to Exit',
    definition:
      'The expected years until a liquidity event (IPO, acquisition, or other sale). Startup exits typically take 7-10 years from founding. Your options may expire worthless if the company hasn\'t exited by the time you leave + post-termination exercise window.',
    category: 'analysis',
  },
  'compound-growth': {
    term: 'Compound Growth',
    definition:
      'Growth that builds on itself over time. Each year\'s gains earn their own gains. The longer the horizon, the more powerful.\n\nFormula: Principal × (1 + rate)^years = Future Value\n$10,000 × (1.10)^10 = $25,937\n\n• Year 1: $11,000\n• Year 5: $16,105\n• Year 10: $25,937',
    category: 'analysis',
  },
  'company-stage': {
    term: 'Company Stage',
    definition:
      'The most recent funding round completed by the company. Stage affects the probability of different exit outcomes:\n\n' +
      '• Pre-Seed/Seed: ~80% failure rate, highest unicorn potential\n' +
      '• Series A: ~65% failure rate, strong upside potential\n' +
      '• Series B: ~45% failure rate, more predictable\n' +
      '• Series C+: ~20% failure rate, lower risk but less upside\n\n' +
      'Later stages have lower failure rates because the company has already survived earlier milestones, but also lower potential returns since much growth has already occurred.\n\n' +
      'Sources: SPDLoad Startup Statistics 2025, YC Exit Data 2025',
    category: 'analysis',
  },
  'stage-adjusted-probability': {
    term: 'Stage-Adjusted Probability',
    definition:
      'Exit scenario probabilities that account for company maturity. The default 75% failure rate applies to VC-backed startups overall, but varies significantly by stage:\n\n' +
      '• 60% of startups fail between Pre-Seed and Series A\n' +
      '• 35% of Series A companies fail before Series B\n' +
      '• Only ~1% fail after reaching Series C\n\n' +
      'The simulator automatically adjusts probabilities based on funding rounds you model.\n\n' +
      'Sources: SPDLoad 2025, Embroker, Harvard Business School',
    category: 'analysis',
  },

  // Exit Scenarios
  failure: {
    term: 'Failure',
    definition:
      'Company shuts down or is acqui-hired for less than liquidation preferences. Common options are worth $0. Represents ~75% of startup outcomes based on historical data.',
    category: 'exit-scenarios',
  },
  'acqui-hire': {
    term: 'Acqui-hire',
    definition:
      'Acquisition primarily to hire the team rather than for the product/business. Typically 1-2x return for investors. Common shares often receive little or nothing.',
    category: 'exit-scenarios',
  },
  moderate: {
    term: 'Moderate Exit',
    definition:
      'Solid acquisition at 3-5x current valuation. A good outcome where all shareholders benefit. Represents ~8% of venture-backed startups.',
    category: 'exit-scenarios',
  },
  strong: {
    term: 'Strong Exit',
    definition:
      'Successful acquisition or IPO at 5-10x current valuation. Significant returns for early employees. Represents ~4% of venture-backed startups.',
    category: 'exit-scenarios',
  },
  exceptional: {
    term: 'Exceptional Exit',
    definition:
      'Outstanding outcome at 10-20x current valuation. Life-changing returns for early employees. Represents ~2.5% of venture-backed startups.',
    category: 'exit-scenarios',
  },
  unicorn: {
    term: 'Unicorn',
    definition:
      'A private company valued at $1B+. Extremely rare outcome (20x+ multiple). Less than 1% of startups achieve this. Term coined by Aileen Lee in 2013.',
    category: 'exit-scenarios',
  },

  // Tax Terms
  amt: {
    term: 'AMT',
    definition:
      'Alternative Minimum Tax. A parallel tax system that may apply to ISO exercises. The spread at exercise counts as AMT income—even though you received no cash.\n\nExample: Exercise 10,000 ISOs with $4 spread = $40,000 AMT income\n\nAt ~28% AMT rate = ~$11,200 tax bill\n\nNote: The 28% rate is a simplified approximation for high earners. Actual AMT calculation involves exemptions, phase-outs, and two brackets (26%/28%). Consult a tax professional.',
    category: 'tax',
  },
  ltcg: {
    term: 'LTCG',
    definition:
      "Long-Term Capital Gains. Favorable tax rate (0-20% vs up to 37% ordinary income) for assets held 1+ year. For ISOs, requires 2+ years from grant and 1+ year from exercise.",
    category: 'tax',
  },
  'ordinary-income': {
    term: 'Ordinary Income',
    definition:
      'Income taxed at your regular tax rate (up to 37% federal). NSO exercises and disqualifying ISO dispositions create ordinary income on the spread at exercise.',
    category: 'tax',
  },
  spread: {
    term: 'Spread',
    definition:
      'The difference between current FMV and your strike price. This is your per-share profit and the basis for tax calculations.\n\nFormula: FMV - Strike = Spread\n$5.00 - $1.00 = $4.00 per share\n\nFor 10,000 options: $4.00 × 10,000 = $40,000 total spread',
    category: 'tax',
  },
  'tax-bracket': {
    term: 'Tax Bracket',
    definition:
      'Your federal marginal tax rate. For NSO exercises, the spread is taxed as ordinary income at this rate plus FICA taxes (~7.65%). Higher brackets (32-37%) are common for tech workers.',
    category: 'tax',
  },
  'ss-wage-cap': {
    term: 'SS Wage Cap',
    definition:
      'Social Security tax (6.2%) only applies to wages up to the annual wage base ($176,100 for 2025). Medicare (1.45%) has no cap. If your salary already hits the SS cap, you only pay Medicare tax on NSO exercise spread.',
    category: 'tax',
  },
  fica: {
    term: 'FICA',
    definition:
      'Federal Insurance Contributions Act. Payroll taxes that fund Social Security (6.2%) and Medicare (1.45%), totaling 7.65% of wages. For NSO exercises, FICA applies to the spread as compensation income.',
    category: 'tax',
  },
  'liquidation-preference': {
    term: 'Liquidation Preference',
    definition:
      "Investors' right to be paid before common shareholders at exit. The industry standard is 1x non-participating, used in 96% of VC deals (Carta Q3 2024 data).\n\n" +
      "Types:\n" +
      "• 1x Non-participating (most common): Investors choose the greater of (a) their investment back, or (b) their pro-rata ownership share.\n" +
      "• 1x Participating: Investors get their money back AND their ownership share. More investor-favorable, less common.\n" +
      "• Higher multiples (1.5x, 2x): Rare, typically seen in down rounds or distressed situations.\n\n" +
      "Example: $50M invested with 1x non-participating.\n" +
      "At $40M exit: Investors get $40M, common gets $0\n" +
      "At $100M exit: Investors get $50M (or their % share if higher), common splits the rest\n" +
      "At $200M exit: Investors likely convert to common for higher payout",
    category: 'ownership',
  },
  'non-participating-preferred': {
    term: 'Non-Participating Preferred',
    definition:
      'Investors choose the GREATER of: (a) their liquidation preference (usually 1x their investment), or (b) converting to common and taking their pro-rata share. Most founder-friendly option.',
    category: 'ownership',
  },
  'participating-preferred': {
    term: 'Participating Preferred',
    definition:
      "Investors get BOTH: their liquidation preference AND their pro-rata share of remaining proceeds. Sometimes called 'double-dipping'. More investor-favorable, reduces common shareholder payout.",
    category: 'ownership',
  },
};
