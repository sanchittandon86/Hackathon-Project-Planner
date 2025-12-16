# Smart Project Planner

An intelligent project planning and resource allocation system built with Next.js and Supabase.

## Features

- **Task Management**: Create and manage tasks with effort estimates and due dates
- **Employee Management**: Track employees and their designations
- **Leave Management**: Manage employee leaves
- **Smart Planning**: Automatically generate optimized project plans based on employee availability and workload
- **Version Control**: Track plan changes and version history
- **Simulation**: Test different scenarios before applying changes
- **Dashboard**: View analytics and workload distribution
- **Excel Export**: Export version history to Excel

## Tech Stack

- **Framework**: Next.js 16
- **Database**: Supabase (PostgreSQL)
- **UI**: React 19, Tailwind CSS, Radix UI
- **Charts**: Recharts
- **Excel Export**: xlsx

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Add Employees**: Navigate to Employees page and add team members
2. **Add Tasks**: Create tasks with effort hours, designations, and due dates
3. **Manage Leaves**: Add employee leave dates
4. **Generate Plan**: Click "Generate Plan" to create an optimized schedule
5. **View Versions**: Check version history to see plan changes over time
6. **Export Data**: Export version history to Excel for reporting

## Project Structure

```
app/              # Next.js app router pages
lib/              # Business logic and utilities
components/       # React components
types/           # TypeScript type definitions
docs/            # Documentation
```

## Scripts

- `npm run dev` - Start development server (for development)
- `npm run build` - Build for production (must run before `start`)
- `npm run start` - Start production server (requires build first)
- `npm run lint` - Run ESLint

**Note**: To run in production mode, first build the app with `npm run build`, then start it with `npm run start`.

## License

Private project
