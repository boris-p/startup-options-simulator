# Startup Options Calculator

A free, open-source calculator to help startup employees understand their equity compensation. Model exercise costs, taxes (ISO vs NSO), dilution from funding rounds, liquidation preferences, and probability-weighted expected value.

## Purpose

This calculator helps you develop intuition about startup equity by:

- Understanding the true cost of exercising options (not just strike price)
- Comparing ISO vs NSO tax implications (AMT vs ordinary income + FICA)
- Modeling how funding rounds dilute your ownership percentage
- Seeing how liquidation preferences affect your payout at different exit valuations
- Weighing opportunity cost against potential upside with probability-weighted expected value

## Important Disclaimers

**This is NOT financial, tax, or legal advice.**

- This calculator provides educational estimates only
- Tax calculations are simplified (e.g., uses ~28% AMT rate as an approximation)
- Real-world situations involve many factors not modeled here
- Always consult a qualified tax professional, financial advisor, or attorney for actual decisions
- Past startup statistics do not predict future outcomes
- Individual circumstances vary significantly

## Example Scenarios

### 1. Early-Stage Engineer

You join a Series A startup and receive an options grant:

- **Grant:** 10,000 options at $1.00 strike price
- **Current 409A FMV:** $5.00 per share
- **Your ownership:** 0.1% (10,000 shares of 10M fully diluted)

The calculator shows:
- **Exercise cost:** $10,000 (what you pay to buy the shares)
- **Current value:** $50,000 (at today's FMV)
- **Paper gain:** $40,000 (but you can't access this until an exit)

Then model what happens after Series B and C dilution to see your realistic ownership at exit.

### 2. ISO vs NSO Tax Comparison

Same grant: 10,000 options with $4.00 spread ($5 FMV - $1 strike):

- **ISO:** $40,000 counts as AMT income. May trigger ~$11,200 in Alternative Minimum Tax - and you owe this even though you received no cash.
- **NSO:** $40,000 is ordinary income plus FICA taxes (~$15,800 at 32% bracket + 7.65% FICA, less if over SS wage cap).

The calculator helps you compare which makes more sense for your situation.

### 3. Exit Scenario Modeling

Model different outcomes to set realistic expectations:

- **At $100M exit:** Your 0.08% post-dilution stake = $80K gross, but liquidation preferences may reduce this
- **At $1B exit:** Same stake = $800K gross, a potentially life-changing outcome
- **Expected value:** Weighted by actual startup statistics (~75% fail, ~10% acqui-hire, etc.)

The probability-weighted expected value helps you understand realistic outcomes, not just best-case scenarios.

## Data Sources

All financial assumptions are grounded in authoritative sources:

- **Dilution benchmarks:** Carta State of Private Markets reports
- **Liquidation preferences:** Carta deal terms data (96% use 1x non-participating)
- **Exit probabilities:** Carta startup shutdown data, PitchBook-NVCA Venture Monitor
- **S&P 500 returns:** NYU Stern Damodaran historical data (~10% nominal since 1926)
- **Tax rules:** IRS Section 409A, Alternative Minimum Tax guidance

See the References section in the calculator for full citations with links.

## Development

### Prerequisites

- Node.js 20+
- Yarn

### Commands

| Command | Description |
|---------|-------------|
| `yarn install` | Install dependencies |
| `yarn dev` | Start development server |
| `yarn build` | Build for production |
| `yarn test` | Run tests |
| `yarn lint` | Run ESLint |

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- shadcn/ui components
- Recharts for visualizations

## Contributing

Contributions are welcome and greatly appreciated! If you:

- Found an error or inaccuracy in the calculations
- Have a suggestion for improvement
- Want to add a feature or fix a bug
- Noticed outdated data or broken references

Please feel free to [open an issue](../../issues) or submit a pull request.

When contributing financial data or assumptions, please ensure they are grounded in authoritative sources (see Data Sources section above).

## License

MIT
