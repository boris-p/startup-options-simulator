# Project Guidelines

## Overview
Startup Options Simulator - a tool for startup employees that models exercise costs, taxes (ISO vs NSO), dilution from funding rounds, liquidation preferences, and probability-weighted expected value. The goal is to help employees make informed decisions about their equity compensation through transparent, well-sourced financial modeling.

## Package Manager
Always use `yarn` for all package management commands:
- `yarn` or `yarn install` - install dependencies
- `yarn add <package>` - add a package
- `yarn dev` - start development server
- `yarn build` - build for production
- `yarn test` - run tests

Do NOT use npm commands.

## Code Structure
```
src/
├── components/
│   ├── OptionsSimulator.tsx   # Main orchestrator, manages all state
│   ├── OptionsInputs.tsx       # Input controls (sliders, selects)
│   ├── ResultsPanel.tsx        # Displays calculated results
│   ├── RoundModeling.tsx       # Funding round dilution/liquidation
│   ├── DilutionModeling.tsx    # Dilution calculations display
│   ├── ExitScenarios.tsx       # Exit scenario modeling
│   ├── OpportunityCost.tsx     # S&P 500 comparison
│   ├── PayoutChart.tsx         # Exit payout visualization
│   ├── TaxInfo.tsx             # ISO/NSO tax calculations
│   ├── JargonTerm.tsx          # Tooltip for financial terms
│   ├── Glossary.tsx            # Full glossary display
│   ├── RefLink.tsx             # Citation links to references
│   ├── References.tsx          # Reference list display
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── calculations.ts         # Core financial logic (pure functions)
│   ├── defaults.ts             # Default values, exit probabilities
│   ├── renderDefinition.tsx    # Shared formula rendering for glossary
│   └── utils.ts                # Utility functions
├── types/
│   └── options.ts              # TypeScript type definitions
└── data/
    ├── jargon.ts               # Financial term definitions
    └── references.ts           # Authoritative data sources
```

## Financial Accuracy
All financial assumptions must be grounded in authoritative sources:
- **Dilution benchmarks**: Carta State of Private Markets reports
- **Liquidation preferences**: Carta deal terms data (96% use 1x non-participating)
- **Exit probabilities**: Carta startup shutdown data, PitchBook-NVCA Venture Monitor
- **S&P 500 returns**: NYU Stern Damodaran historical data (10% nominal since 1926)
- **Tax rules**: IRS Section 409A, AMT regulations

When adding new financial data:
1. Add source to `src/data/references.ts`
2. Reference source in comments near the data
3. Use simplified models with clear disclaimers (e.g., "28% AMT rate is simplified")

## Design Principles
- **Compact and information-dense**: Show relevant data without clutter
- **Transparent calculations**: Display formulas where they aid understanding
- **Consistent terminology**: Use terms from `src/data/jargon.ts`
- **Tooltips for jargon**: Use `JargonTerm` component for financial terms
- **Source citations**: Link to references for credibility

## Key Files
| Purpose | File |
|---------|------|
| All calculations | `src/lib/calculations.ts` |
| Default values & probabilities | `src/lib/defaults.ts` |
| Financial term definitions | `src/data/jargon.ts` |
| Data sources | `src/data/references.ts` |
| Type definitions | `src/types/options.ts` |
| Main component | `src/components/OptionsSimulator.tsx` |
| Jargon tooltips | `src/components/JargonTerm.tsx` |
| Glossary display | `src/components/Glossary.tsx` |
| Citation links | `src/components/RefLink.tsx` |
