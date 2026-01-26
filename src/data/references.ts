export interface Reference {
  id: string;
  shortName: string;
  title: string;
  publisher: string;
  date: string;
  url: string;
}

export const REFERENCES: Reference[] = [
  {
    id: 'carta-dilution',
    shortName: 'Carta',
    title: 'State of Private Markets Q4 2024',
    publisher: 'Carta',
    date: '2024',
    url: 'https://carta.com/data/state-of-private-markets-q4-2024/',
  },
  {
    id: 'pitchbook-nvca',
    shortName: 'PitchBook-NVCA',
    title: 'Venture Monitor Q4 2024',
    publisher: 'PitchBook & NVCA',
    date: '2024',
    url: 'https://nvca.org/wp-content/uploads/2025/01/Q4-2024-PitchBook-NVCA-Venture-Monitor.pdf',
  },
  {
    id: 'startup-failure',
    shortName: 'Carta Shutdowns',
    title: 'Startup Shutdowns Accelerated in 2024',
    publisher: 'Carta',
    date: '2024',
    url: 'https://carta.com/data/startup-shutdowns-q1-2024/',
  },
  {
    id: 'founder-success',
    shortName: 'Gompers et al.',
    title: 'Performance Persistence in Entrepreneurship',
    publisher: 'Federal Reserve Bank of New York',
    date: '2010',
    url: 'https://www.newyorkfed.org/medialibrary/media/research/economists/kovner/performance_persistence.pdf',
  },
  {
    id: 'flat-down-rounds',
    shortName: 'PitchBook',
    title: 'Why US Startups Hit a Decade High in Flat & Down Rounds',
    publisher: 'PitchBook',
    date: '2024',
    url: 'https://pitchbook.com/news/articles/why-us-startups-decade-high-flat-down-rounds-2024',
  },
  {
    id: 'carta-liquidation-prefs',
    shortName: 'Carta',
    title: 'A Complete Guide to Liquidation Preferences',
    publisher: 'Carta',
    date: '2024',
    url: 'https://carta.com/learn/equity/liquidity-events/liquidation-preferences/',
  },
  {
    id: 'carta-deal-terms',
    shortName: 'Carta',
    title: 'VC Deal Terms: What Changed in Q3 2024',
    publisher: 'Carta',
    date: '2024',
    url: 'https://carta.com/data/deal-terms/',
  },
  {
    id: 'ssa-wage-base',
    shortName: 'SSA',
    title: 'Contribution and Benefit Base',
    publisher: 'Social Security Administration',
    date: '2025',
    url: 'https://www.ssa.gov/oact/cola/cbb.html',
  },
  {
    id: 'irs-409a',
    shortName: 'IRS',
    title: 'Section 409A - Nonqualified Deferred Compensation Plans',
    publisher: 'Internal Revenue Service',
    date: '2024',
    url: 'https://www.irs.gov/retirement-plans/plan-sponsor/section-409a-deferred-compensation-plans',
  },
  {
    id: 'damodaran-sp500',
    shortName: 'Damodaran',
    title: 'Historical Returns on Stocks, Bonds and Bills',
    publisher: 'NYU Stern School of Business',
    date: '2024',
    url: 'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html',
  },
  {
    id: 'aileen-lee-unicorn',
    shortName: 'Aileen Lee',
    title: 'Welcome To The Unicorn Club: Learning From Billion-Dollar Startups',
    publisher: 'TechCrunch',
    date: '2013',
    url: 'https://techcrunch.com/2013/11/02/welcome-to-the-unicorn-club/',
  },
  {
    id: 'irs-amt',
    shortName: 'IRS',
    title: 'Alternative Minimum Tax',
    publisher: 'Internal Revenue Service',
    date: '2024',
    url: 'https://www.irs.gov/taxtopics/tc556',
  },
];

export function getReferenceById(id: string): Reference | undefined {
  return REFERENCES.find((ref) => ref.id === id);
}

export function getReferenceIndex(id: string): number {
  return REFERENCES.findIndex((ref) => ref.id === id) + 1;
}
