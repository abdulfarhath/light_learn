# LightLearn - Modular Architecture Documentation

## Overview

LightLearn follows a **feature-based modular architecture** where code is organized by features rather than technical layers. This makes the codebase more maintainable, scalable, and allows features to be developed, tested, and deployed independently.

## Architecture Principles

### 1. Feature Independence
Each feature module is self-contained with its own:
- Business logic (services)
- API/HTTP handlers (controllers)
- Routes
- UI components (frontend)
- Validation rules

### 2. Clear Separation of Concerns
- **Backend**: Service → Controller → Routes pattern
- **Frontend**: Services → Hooks/Context → Components → Pages pattern
- **Shared**: Common utilities, components, and configuration

### 3. Explicit Dependencies
Features can depend on shared modules but should minimize cross-feature dependencies.

---

## Backend Structure

```
server/
├── features/               # Feature-based modules
│   ├── auth/              # Authentication feature
│   │   ├── auth.service.js       # Business logic
│   │   ├── auth.controller.js    # HTTP request handlers
│   │   ├── auth.routes.js        # Route definitions
│   │   ├── auth.validation.js    # Input validation
│   │   ├── auth.middleware.js    # Auth middleware
│   │   └── index.js              # Module exports
│   │
│   ├── users/             # User management feature
│   ├── classes/           # Class management feature
│   ├── live-sessions/     # Real-time sessions
│   └── resources/         # File/resource management
│
├── shared/                # Shared across features
│   ├── config/
│   │   └── database.js           # DB connection
│   ├── middleware/
│   │   └── error-handler.js      # Global error handling
│   └── utils/
│       └── generateClassCode.js  # Utilities
│
├── database/              # Database schemas and migrations
└── index.js               # Main entry point
```

### Backend Pattern: Service-Controller-Routes

Each feature follows this pattern:

#### 1. **Service Layer** (`*.service.js`)
- Contains business logic
- Database operations
- Data transformations
- No HTTP concerns

```javascript
// Example: auth.service.js
class AuthService {
    async createUser(email, password, fullName, role) {
        // Hash password
        // Insert into database
        // Return user
    }
}
```

#### 2. **Controller Layer** (`*.controller.js`)
- Handles HTTP requests/responses
- Input validation
- Calls service methods
- Returns formatted responses

```javascript
// Example: auth.controller.js
class AuthController {
    async register(req, res) {
        // Validate request
        // Call service
        // Send response
    }
}
```

#### 3. **Routes Layer** (`*.routes.js`)
- Maps URLs to controllers
- Applies middleware (auth, validation)

```javascript
// Example: auth.routes.js
router.post('/register', validation.register, controller.register);
```

#### 4. **Module Entry** (`index.js`)
Exports the feature for use in main app:

```javascript
module.exports = {
    routes: authRoutes,
    middleware: authMiddleware,
    service: authService
};
```

---

## Frontend Structure

```
client/src/
├── features/              # Feature-based modules
│   ├── auth/             # Authentication feature
│   │   ├── components/          # Auth-specific components
│   │   ├── pages/              # Login, Register pages
│   │   ├── context/            # AuthContext
│   │   ├── services/           # Auth API calls
│   │   ├── hooks/              # useAuth hook
│   │   └── index.js            # Module exports
│   │
│   ├── users/            # User profile feature
│   ├── classes/          # Class management
│   ├── live-sessions/    # Live session UI (Dashboard)
│   └── resources/        # Resource management
│
├── shared/               # Shared components & utilities
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── hooks/           # Shared custom hooks
│   └── utils/
│       └── api.js       # Axios instance, interceptors
│
├── App.jsx              # Main app component
└── main.jsx             # App entry point
```

### Frontend Pattern: Services-Context-Components-Pages

Each feature follows this pattern:

#### 1. **Services** (`services/*.js`)
- API calls to backend
- Uses shared API instance

```javascript
// Example: authAPI.js
export const authAPI = {
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    }
};
```

#### 2. **Context/Hooks** (`context/*.jsx`, `hooks/*.js`)
- State management
- Business logic for UI
- Reusable hooks

```javascript
// Example: AuthContext.jsx
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // ... auth logic
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

#### 3. **Components** (`components/*.jsx`)
- Reusable UI components
- Feature-specific only

#### 4. **Pages** (`pages/*.jsx`)
- Full page components
- Compose multiple components
- Route targets

#### 5. **Module Entry** (`index.js`)
Exports the feature:

```javascript
export { Login, Register } from './pages';
export { AuthProvider, useAuth } from './context';
export { default as authAPI } from './services/authAPI';
```

---

## Feature Modules

### 1. Auth Feature
**Purpose**: User authentication and authorization

**Backend**:
- User registration
- User login
- JWT token generation
- Token verification middleware
- Role-based authorization

**Frontend**:
- Login page
- Register page
- Auth context & hooks
- Token management

**Key Files**:
- `server/features/auth/`
- `client/src/features/auth/`

---

### 2. Users Feature
**Purpose**: User profile and management

**Backend**:
- Get user profile
- List teachers/students
- Update user info

**Frontend**:
- Profile page
- User display components

**Key Files**:
- `server/features/users/`
- `client/src/features/users/`

---

### 3. Classes Feature
**Purpose**: Class creation and enrollment

**Backend**:
- Create classes (teachers)
- Join classes with code (students)
- List classes
- Get class details
- Get enrolled students

**Frontend**:
- Classes page
- Create/join forms
- Class cards

**Key Files**:
- `server/features/classes/`
- `client/src/features/classes/`

---

### 4. Live Sessions Feature
**Purpose**: Real-time live class functionality

**Backend**:
- Socket.IO handlers
- Whiteboard drawing
- Video/audio streaming
- Chat messaging
- Quizzes and polls
- Attendance tracking

**Frontend**:
- Dashboard (live session page)
- Whiteboard component
- Video/audio components
- Chat component

**Key Files**:
- `server/features/live-sessions/`
- `client/src/features/live-sessions/` (to be organized from Dashboard.jsx)

---

### 5. Resources Feature
**Purpose**: File upload/download management

**Backend**:
- Socket.IO file transfer
- Resource metadata storage
- Lightweight download on-demand

**Frontend**:
- Resource list
- Upload dialog
- Download manager

**Key Files**:
- `server/features/resources/`
- `client/src/features/resources/`

---

## Shared Modules

### Backend Shared
- **`shared/config/database.js`**: PostgreSQL connection pool
- **`shared/utils/`**: Common utilities (generateClassCode, etc.)
- **`shared/middleware/`**: Global middleware (error handling)

### Frontend Shared
- **`shared/utils/api.js`**: Axios instance with interceptors
- **`shared/components/`**: Navbar, ProtectedRoute, etc.
- **`shared/hooks/`**: Common custom hooks

---

## Adding a New Feature

### Backend

1. **Create feature directory**:
   ```bash
   mkdir server/features/my-feature
   ```

2. **Create service file** (`my-feature.service.js`):
   ```javascript
   const pool = require('../../shared/config/database');
   
   class MyFeatureService {
       async doSomething() {
           // Business logic
       }
   }
   
   module.exports = new MyFeatureService();
   ```

3. **Create controller** (`my-feature.controller.js`):
   ```javascript
   const myFeatureService = require('./my-feature.service');
   
   class MyFeatureController {
       async handleRequest(req, res) {
           // Handle HTTP request
       }
   }
   
   module.exports = new MyFeatureController();
   ```

4. **Create routes** (`my-feature.routes.js`):
   ```javascript
   const express = require('express');
   const controller = require('./my-feature.controller');
   
   const router = express.Router();
   router.get('/', controller.handleRequest);
   module.exports = router;
   ```

5. **Create index** (`index.js`):
   ```javascript
   module.exports = {
       routes: require('./my-feature.routes'),
       service: require('./my-feature.service')
   };
   ```

6. **Register in main app** (`server/index.js`):
   ```javascript
   const myFeatureModule = require('./features/my-feature');
   app.use('/api/my-feature', myFeatureModule.routes);
   ```

### Frontend

1. **Create feature directory**:
   ```bash
   mkdir -p client/src/features/my-feature/{components,pages,services,hooks}
   ```

2. **Create service** (`services/myFeatureAPI.js`):
   ```javascript
   import api from '../../../shared/utils/api';
   
   export const myFeatureAPI = {
       getData: async () => {
           const response = await api.get('/my-feature');
           return response.data;
       }
   };
   ```

3. **Create components/pages** as needed

4. **Create index** (`index.js`):
   ```javascript
   export { default as MyFeaturePage } from './pages/MyFeaturePage';
   export { default as myFeatureAPI } from './services/myFeatureAPI';
   ```

5. **Add route in App.jsx**:
   ```javascript
   import { MyFeaturePage } from './features/my-feature';
   
   <Route path="/my-feature" element={<MyFeaturePage />} />
   ```

---

## Module Dependencies

### Allowed Dependencies
- ✅ Features → Shared modules
- ✅ Features → Same feature (internal)
- ✅ Auth feature can be used by other features (via middleware)

### Discouraged Dependencies
- ⚠️ Feature → Different feature (creates tight coupling)
- ❌ Circular dependencies

### Example of Good Practice:
```javascript
// Good: Using shared utility
const pool = require('../../shared/config/database');

// Good: Using auth middleware from auth feature
const { authenticateToken } = require('../auth/auth.middleware');

// Bad: Direct coupling to another feature
const usersService = require('../users/users.service'); // Avoid!
```

---

## Benefits of This Architecture

1. **Modularity**: Features can be developed independently
2. **Maintainability**: Easy to locate and modify feature code
3. **Scalability**: Add new features without affecting existing ones
4. **Testability**: Test features in isolation
5. **Team Collaboration**: Different team members can work on different features
6. **Code Reusability**: Shared modules prevent duplication
7. **Clear Boundaries**: Well-defined interfaces between modules

---

## Migration Checklist

- [x] Backend auth module
- [x] Backend users module
- [x] Backend classes module
- [x] Backend live-sessions module
- [x] Backend resources module
- [x] Frontend auth module
- [x] Frontend users module
- [x] Frontend classes module
- [x] Update App.jsx
- [x] Move shared components
- [x] Update all imports

---

## Next Steps

1. **Extract Dashboard**: Move live-session functionality from Dashboard.jsx into `features/live-sessions/pages/`
2. **Add Tests**: Create test files alongside feature modules
3. **API Documentation**: Document each feature's API endpoints
4. **Component Library**: Extract more shared components
5. **State Management**: Consider adding Redux/Zustand if state becomes complex

---

## Questions?

For any questions about the modular architecture, refer to this document or check the implementation in:
- `server/features/auth/` - Complete backend pattern example
- `client/src/features/auth/` - Complete frontend pattern example
