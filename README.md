# E-Voting System

A secure e-voting system built with React, TypeScript, Express, and MongoDB that allows voters to register, verify their identity, and participate in elections, while administrators can create and manage elections.

## Features

- **Voter Registration**: Secure voter registration with identity verification
- **Election Management**: Create, configure, and manage elections
- **Secure Voting**: Authenticated and secure voting process
- **Vote Receipts**: Downloadable vote receipts for verification
- **Admin Dashboard**: Comprehensive election management interface
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- React Router for navigation
- Context API for state management

### Backend
- Express.js API
- MongoDB with Mongoose
- JWT Authentication
- WebAuthn for biometric authentication

## Getting Started

### Prerequisites
- Node.js 16.x or higher
- MongoDB Atlas account or local MongoDB instance
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/e-voting-system.git
cd e-voting-system
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

4. Configure environment variables:
   - Copy `.env.example` to `.env` in the project root for frontend
   - Copy `backend/.env.example` to `backend/.env` for backend
   - Update the MongoDB connection string in `backend/.env`

### Running in Development Mode

Start both frontend and backend concurrently:
```bash
npm run dev:full
```

Or start them separately:

Frontend (default: http://localhost:5173):
```bash
npm run frontend
```

Backend (default: http://localhost:5000):
```bash
npm run backend
```

### Building for Production

1. Build the frontend:
```bash
npm run build:prod
```

2. Start the backend in production mode:
```bash
cd backend
npm run prod
```

## Deployment

For detailed deployment instructions, please see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Project Structure

```
e-voting-system/
├── backend/              # Express API
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   └── server.js         # Server entry point
├── src/                  # React frontend
│   ├── components/       # React components
│   │   ├── admin/        # Admin interface components
│   │   └── voter/        # Voter interface components
│   ├── contexts/         # React contexts
│   └── utils/            # Utility functions
├── .env.example          # Example environment variables
└── vite.config.ts        # Vite configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)