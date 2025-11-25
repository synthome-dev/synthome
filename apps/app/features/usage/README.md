# Usage Overview Feature

This feature displays monthly usage statistics for execution jobs and costs on the Overview page.

## Components

### `UsageOverview`

Main container component that manages shared hover state between the two metric cards.

- Location: `apps/app/features/usage/usage-overview.tsx`
- Displays: Execution Jobs card and Cost card side by side
- Syncs hover state between both cards

### `UsageMetricCard`

Reusable card component for displaying a single metric.

- Location: `apps/app/features/usage/usage-metric-card.tsx`
- Structure: `CardRoot` → `Card` → `CardHeader` + `DailyBarChart` + `CardFooter`
- Props: title, monthly total, daily data, formatters

### `DailyBarChart`

Interactive bar chart component showing daily breakdown.

- Location: `apps/app/features/usage/daily-bar-chart.tsx`
- Features:
  - Proportional bar heights based on max value
  - Hover tooltips
  - Highlights current day with ring
  - Future days shown as placeholders (gray)
  - Synchronized hover across both cards

## Data Fetching

### `getMonthlyUsageStats`

Server action that queries execution jobs data.

- Location: `apps/app/features/usage/actions.ts`
- Returns:
  - Daily breakdown for entire calendar month
  - Monthly totals (count and cost)
  - Today's totals
  - Max daily count (for bar scaling)
  - User's plan type

## Utilities

### Date Utilities

- `formatDateLabel`: Formats dates as "Today" or "Nov 25"
- `isToday`: Check if date is today
- `isFutureDate`: Check if date is in the future
- `formatCurrency`: Format numbers as currency
- `formatNumber`: Format numbers with commas

## Pricing

- **Cost per action**: $50 / 10,000 = $0.005 per execution job
- **Free plan**: All costs shown as $0.00
- **Paid plans**: Calculated based on execution job count

## Calendar Month Scope

The feature shows data for the current calendar month (1st to end of month), not billing cycles:

- Past days + today: Show actual data with proportional bars
- Future days: Show as gray placeholder bars with no data
- Monthly total: Sum from 1st to today
- Footer: Shows selected day or defaults to today

## Integration

The feature is integrated into the Overview page:

- Location: `apps/app/app/(dashboard)/overview/page.tsx`
- Fetches data server-side with `getMonthlyUsageStats()`
- Renders `UsageOverview` component with the stats
