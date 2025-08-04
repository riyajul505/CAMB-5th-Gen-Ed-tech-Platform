# LearnHub - Interactive E-Learning Platform

An interactive, database‑driven e‑learning platform delivering Cambridge curriculum content through hands‑on simulations, adaptive quizzes, and real‑time insights.

## Features

- 🧪 **Interactive Simulations** - Virtual science labs and experiments
- 🎯 **Adaptive Learning** - AI-powered personalized learning pathways  
- 📊 **Real-time Analytics** - Comprehensive progress tracking
- 🏆 **Achievement System** - Gamified learning experience
- 👥 **Multi-role Support** - Student, Teacher, Parent, Admin roles
- 📱 **Responsive Design** - Mobile-first responsive interface

## Tech Stack

- **Frontend:** React 19, React Router, TailwindCSS
- **State Management:** Context API, React Query
- **Data Fetching:** Axios
- **Build Tool:** Vite
- **Styling:** TailwindCSS with custom design system

## Project Structure

```
src/
├── assets/          # Images, icons, static media
├── components/      # Reusable UI components
├── context/         # React Context providers
├── hooks/           # Custom hooks
├── integrations/    # Third-party integrations
├── layout/          # Layout components
├── pages/           # Page components organized by feature
│   ├── auth/        # Authentication pages
│   ├── dashboard/   # Dashboard pages
│   └── home/        # Home page
├── routing/         # Route definitions
└── services/        # API service modules
```

## Getting Started

### Prerequisites

- Node.js 20+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_NAME=LearnHub
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Development Guidelines

- Use functional components with hooks
- Implement PropTypes for runtime validation
- Follow the established folder structure
- Use semantic HTML and ARIA practices
- Write JSDoc comments for functions/components
- Use TailwindCSS utility classes for styling

## Contributing

1. Follow the established patterns and conventions
2. Ensure responsive design for all components
3. Add proper error handling and loading states
4. Write meaningful commit messages
5. Test on multiple screen sizes

## License

This project is part of the CSE471 course requirements.
