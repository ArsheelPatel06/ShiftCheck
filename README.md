# Healthcare Shift Management System

A full-stack web application for managing healthcare staff shifts, leave requests, and workforce analytics. Built with React.js frontend and Node.js/Express backend, featuring real-time data synchronization and advanced scheduling algorithms.

## Architecture

### Frontend

- **Framework**: React.js 18
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Real-time Data**: Firebase Firestore
- **HTTP Client**: Fetch API with custom service layer

### Backend

- **Runtime**: Node.js with Express.js
- **Database**: MongoDB Atlas (Cloud) / Local MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Sync**: Firebase Firestore integration
- **Algorithms**: Custom DSA implementations for scheduling

## Technical Features

### Data Structures & Algorithms

- **Priority Queue**: Staff assignment optimization
- **Hash Table**: Fast user lookup and caching
- **Sliding Window**: Workload tracking and analysis
- **Graph Theory**: Shift conflict detection

### Database Design

- **Users**: Staff profiles with skills, preferences, and workload metrics
- **Shifts**: Time-based assignments with recurring patterns
- **Leave Requests**: Approval workflow with coverage analysis
- **Analytics**: Performance metrics and predictive insights

### API Architecture

- **RESTful Design**: Standard HTTP methods and status codes
- **Authentication**: JWT-based security with role-based access
- **Rate Limiting**: Request throttling for API protection
- **Error Handling**: Comprehensive error responses and logging

## Project Structure

```
healthcare-shift-manager/
├── frontend/                 # React.js application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-based page components
│   │   ├── services/        # API and data services
│   │   ├── contexts/        # React context providers
│   │   └── firebase/        # Firebase configuration
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
├── backend/                 # Node.js/Express API
│   ├── routes/              # API route handlers
│   ├── models/              # MongoDB schemas
│   ├── middleware/          # Authentication and validation
│   ├── utils/               # DSA algorithms and utilities
│   ├── config/              # Database configuration
│   └── package.json         # Backend dependencies
└── README.md                # Project documentation
```

## Core Components

### Frontend Services

- **`api.js`**: HTTP client with timeout handling and error management
- **`firebaseService.js`**: Real-time data synchronization
- **`dataService.js`**: Unified data access layer
- **`autoAssignService.js`**: Intelligent shift assignment

### Backend Routes

- **`/api/users`**: User CRUD operations with filtering
- **`/api/shifts`**: Shift management with auto-assignment
- **`/api/leaves`**: Leave request workflow
- **`/api/analytics`**: Performance metrics and insights

### Database Models

- **User**: Staff profiles with skills and preferences
- **Shift**: Time-based assignments with metadata
- **LeaveRequest**: Approval workflow with coverage analysis

## Development Setup

### Prerequisites

- Node.js 16+ and npm
- MongoDB (local or Atlas)
- Firebase project (for real-time features)

### Installation

1. **Clone Repository**

   ```bash
   git clone <repository-url>
   cd healthcare-shift-manager
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install
   cp env.example .env
   # Configure MongoDB_URI and JWT_SECRET in .env
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp env.example .env
   # Configure Firebase credentials in .env
   npm start
   ```

### Environment Variables

**Backend (.env)**

```
MONGODB_URI=mongodb://localhost:27017/shiftcheck
PORT=5001
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

**Frontend (.env)**

```
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify` - Token verification

### Users

- `GET /api/users` - List users with filtering
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Shifts

- `GET /api/shifts` - List shifts with filtering
- `POST /api/shifts` - Create shift
- `PUT /api/shifts/:id` - Update shift
- `POST /api/shifts/:id/auto-assign` - Auto-assign shift

### Leave Requests

- `GET /api/leaves` - List leave requests
- `POST /api/leaves` - Create leave request
- `PUT /api/leaves/:id/approve` - Approve request
- `PUT /api/leaves/:id/reject` - Reject request

## Performance Optimizations

### Caching Strategy

- **In-memory Cache**: Staff priority queue caching (5-minute TTL)
- **Client-side Filtering**: Reduced server load for data queries
- **Request Timeouts**: 8-second timeout for API calls

### Database Optimization

- **Indexed Queries**: Optimized MongoDB queries with proper indexing
- **Aggregation Pipelines**: Efficient data processing for analytics
- **Connection Pooling**: MongoDB connection management

### Frontend Optimizations

- **Code Splitting**: Lazy loading for route-based components
- **Memoization**: React.memo and useCallback for performance
- **Concurrent Requests**: Promise.all for parallel data fetching

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Admin and staff permission levels
- **Input Validation**: Request data sanitization
- **Rate Limiting**: API request throttling
- **CORS Configuration**: Cross-origin request security

## Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
```

### API Testing

```bash
# Health check
curl http://localhost:5001/health

# Test endpoints
curl http://localhost:5001/api/users
curl http://localhost:5001/api/shifts
```

## Deployment

### Backend Deployment

- Configure production MongoDB URI
- Set JWT_SECRET for production
- Enable rate limiting
- Configure CORS for production domain

### Frontend Deployment

- Build production bundle: `npm run build`
- Configure Firebase for production
- Set production API URL
- Deploy to hosting service

## Dependencies

### Backend Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **jsonwebtoken**: JWT authentication
- **cors**: Cross-origin resource sharing
- **express-rate-limit**: API rate limiting

### Frontend Dependencies

- **react**: UI framework
- **react-dom**: DOM rendering
- **firebase**: Real-time database
- **tailwindcss**: CSS framework
- **react-router-dom**: Client-side routing

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For technical support or questions about implementation, please refer to the project documentation or create an issue in the repository.
