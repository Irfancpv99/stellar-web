# Stellarator Simulation Dashboard

A web app for managing stellarator fusion simulation jobs. You can submit simulations, track their progress, view results, and compare different runs.

## What it does

- Submit new simulation jobs with custom parameters (coil count, magnetic field, plasma density, resolution)
- See all your simulations in a table with their current status
- View detailed results when a simulation finishes (metrics + time series chart)
- Compare two completed simulations side by side
- Export results as JSON or CSV

## Tech stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- React Query for data fetching
- Chart.js for graphs
- React Router for navigation

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

3. Open http://localhost:8080 in your browser

## Available scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project structure

```
src/
  api/           - Mock API for simulations
  components/    - UI components
  hooks/         - Custom React hooks
  pages/         - Page components (Dashboard, NewSimulation, Results, Compare)
  types/         - TypeScript types
```

## Notes

- This uses mock data - there's no real backend
- Simulations run for 3-10 seconds (fake delay)
- About 10% of simulations randomly fail (to show error handling)
- The dashboard auto-refreshes every 3 seconds to show status updates

## Pages

- `/` - Main dashboard with simulation list
- `/new` - Form to create a new simulation
- `/results/:id` - View results for a specific simulation
- `/compare` - Compare two completed simulations
