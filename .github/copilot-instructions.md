# E-Voting System AI Assistant Instructions

## Project Overview
This is a full-stack e-voting system built with React/TypeScript (frontend) and Express/MongoDB (backend). The system allows voters to register, verify their identity, and participate in elections, while administrators can create and manage elections.

## Architecture and Data Flow

### Frontend (Vite + React + TypeScript)
- **Component Structure**: Split between admin (`src/components/admin/`) and voter (`src/components/voter/`) interfaces
- **State Management**: Uses React Context (`src/contexts/VotingContext.tsx`) for global state
- **Key Types**: Core types (Election, Voter, Candidate) defined in VotingContext
- **UI Framework**: Uses Tailwind CSS for styling

### Backend (Express + MongoDB)
- **API Routes**: REST endpoints under `/api/voters/` for voter operations
- **Data Models**: Mongoose schemas in `backend/models/` (Election.js, Voter.js, Candidate.js)
- **Authentication**: Handles voter verification through Aadhaar ID

## Development Workflow

### Running the Application
1. Frontend: 
   ```bash
   npm run dev    # Starts Vite dev server
   ```
2. Backend:
   ```bash
   cd backend
   npm run dev    # Starts nodemon for backend
   ```

### Environment Configuration
- Backend requires `.env` file with:
  - `MONGO_URI`: MongoDB connection string
  - `PORT`: Optional backend port (defaults to 5000)

## Key Patterns and Conventions

### Data Models
- Elections have states: 'upcoming' | 'active' | 'closed'
- Voters track voting history with `hasVoted` map: `Record<electionId, boolean>`
- All MongoDB schemas are defined with strict typing

### Component Organization
- Modal components (e.g., `CreateElectionModal.tsx`, `VotingModal.tsx`) follow consistent patterns
- Admin/voter components are strictly separated in directory structure

### Integration Points
- Frontend-Backend: Main API interaction through `/api/voters/` endpoints
- Database: MongoDB for persistent storage
- External: Supabase integration (see `@supabase/supabase-js` dependency)

## Common Operations
- Voter Registration: Implement through `VoterRegistration.tsx` component
- Election Management: Use `CreateElectionModal.tsx` for new elections
- Vote Casting: Handle through `VotingModal.tsx`

## Additional Notes
- Always handle loading and error states in components
- Use TypeScript strictly - interfaces are defined in `VotingContext.tsx`
- Backend routes follow RESTful conventions