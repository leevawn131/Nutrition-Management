# AGENTS.md

## 1. Project Overview

This is a nutrition management application designed to help users track their nutrition, meals, health metrics, plans, AI-assisted food recognition, and social interactions.

### Main technologies

- React Native
- Expo
- TypeScript
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Postman
- Git / GitHub
- AI Vision
- AI Chatbot

### Main system features

- User registration, login, and authentication.
- Personal profile management.
- BMI, BMR, TDEE, and maintenance calorie calculation.
- Nutrition goals and macro targets.
- Nutrition planning.
- Meal logging.
- AI food recognition from images.
- Cooking / ingredient-based meal logging.
- Food and nutrition tracking.
- AI nutrition chatbot.
- Gamification.
- Mini social network.

---

## 2. Repository Structure

Current project structure:

```text
Nutrition-Management/
├── .claude/
├── .expo/
├── .postman/
├── .vscode/
├── app/
├── assets/
├── backend/
├── components/
├── constants/
├── database/
├── hooks/
├── node_modules/
├── postman/
├── scripts/
├── services/
├── types/
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── app.json
├── eslint.config.js
├── expo-env.d.ts
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json
```

Do not arbitrarily change the top-level project structure.

Do not create a `src/` directory unless explicitly required.

Prefer the existing project structure and conventions.

---

## 3. Source of Truth

### Database

The current MongoDB schema is defined in:

```text
database/
```

The existing MongoDB schema is the **database source of truth**.

Do NOT arbitrarily:

- create new collections
- remove collections
- rename collections
- rename fields
- change field types
- split collections
- merge collections
- change embedded documents
- change existing schema structure

If a task appears to require a database schema change:

1. Identify the problem.
2. Explain why the current schema is insufficient.
3. Propose the change.
4. Do NOT modify the schema without approval.

### API

The existing API contract is also a source of truth.

Do NOT arbitrarily change:

- endpoint names
- HTTP methods
- request body structure
- response structure
- field names

if the change affects other modules.

### UI

Prefer the current structure:

```text
app/
components/
constants/
hooks/
services/
types/
```

Do not replace the existing navigation or application architecture unless explicitly requested.

---

## 4. Frontend Rules

The frontend uses React Native, Expo, and TypeScript.

### Components

Shared components belong in:

```text
components/
```

Reuse existing components whenever possible.

Do not create duplicate components for existing functionality.

### Screens / Routes

Use the current structure under:

```text
app/
```

Do not introduce another routing architecture without approval.

### API Calls

API requests should be centralized in:

```text
services/
```

Do not scatter API requests across many UI components when they can be handled by shared services.

### Types

Shared TypeScript types/interfaces belong in:

```text
types/
```

Do not duplicate the same entity type in multiple files.

### Constants

Shared constants belong in:

```text
constants/
```

Avoid hardcoding the same value in multiple places.

---

## 5. Backend Rules

The backend is located in:

```text
backend/
```

Current structure:

```text
backend/
├── config/
├── controllers/
├── middlewares/
├── models/
├── routes/
├── services/
└── server.js
```

Do not replace the current backend architecture without approval.

### Layering

Use the following flow:

```text
Request
   ↓
Route
   ↓
Middleware
   ↓
Controller
   ↓
Service
   ↓
Model
   ↓
MongoDB
```

### routes/

Responsible for:

- endpoint definitions
- HTTP methods
- middleware attachment

Do not put complex business logic in routes.

### controllers/

Responsible for:

- reading request data
- calling services
- returning responses

Do not put large business logic inside controllers.

### services/

Responsible for:

- business logic
- calculations
- data processing
- AI orchestration
- application rules

### models/

Responsible for:

- Mongoose schemas
- database models
- model-level validation/configuration

### middlewares/

Responsible for:

- authentication
- authorization
- error handling
- request processing

### config/

Responsible for:

- database configuration
- application configuration
- environment configuration

---

## 6. Current User Data Model

User information is currently stored directly in the `users` collection.

### Authentication

- email
- password_hash
- role
- created_at
- updated_at

### Profile

- full_name
- avatar_url
- gender
- date_of_birth
- height_cm
- weight_kg
- activity_level
- goal

### Nutrition Targets

- target_calories
- target_protein_g
- target_carb_g
- target_fat_g

### Embedded Data

- food_preferences[]
- streak

Do NOT create a separate `profiles` collection.

Do NOT create a separate `health_stats` collection unless the team explicitly approves a schema change.

---

## 7. Authentication Rules

Passwords must always be hashed before storage.

NEVER:

- store plaintext passwords
- return `password_hash` in API responses
- log passwords
- commit JWT secrets
- commit API keys

JWT authentication must be handled through middleware.

The authenticated user must be obtained from:

```js
req.user.id
```

Do not trust a client-provided `user_id` when JWT authentication already identifies the current user.

Example:

```js
const userId = req.user.id;
```

Avoid:

```js
const userId = req.body.user_id;
```

unless there is a clear business reason.

---

## 8. Health Calculation Rules

### BMI

```text
BMI = weight_kg / height_m²
```

### BMR - Male

```text
BMR = (10 × weight_kg)
    + (6.25 × height_cm)
    - (5 × age)
    + 5
```

### BMR - Female

```text
BMR = (10 × weight_kg)
    + (6.25 × height_cm)
    - (5 × age)
    - 161
```

### TDEE

```text
TDEE = BMR × activity_factor
```

Activity factors:

```text
sedentary   = 1.2
light       = 1.375
moderate    = 1.55
active      = 1.725
very_active = 1.9
```

Health calculations must be implemented in a service layer.

Do not place the full business logic directly inside routes.

---

## 9. AI Integration Rules

AI must be called through the backend/service layer.

Standard flow:

```text
Frontend
   ↓
Backend API
   ↓
AI Service
   ↓
Validate AI Response
   ↓
Business Logic
   ↓
MongoDB
```

The frontend must never contain private AI API keys.

AI must never write directly to MongoDB.

AI responses must be validated before being used or stored.

Never assume AI output is perfectly accurate.

AI nutrition results are estimates and may require user confirmation or correction.

---

## 10. Meal Recognition

The system supports two main meal logging flows.

### Eating Out

```text
Meal Photo
   ↓
AI Vision
   ↓
Food Recognition
   ↓
Portion Estimation
   ↓
Calories + Protein + Carb + Fat
   ↓
User Confirmation / Correction
   ↓
Save Meal
```

### Cooking

```text
Select Ingredients
   ↓
Enter Quantities
   ↓
Calculate Nutrition
   ↓
Save Meal / Recipe
```

The food database does not have to contain every possible dish in the world.

---

## 11. Validation

Always validate client-provided input.

Examples:

- `height > 0`
- `weight > 0`
- `calories >= 0`
- macro values must not be negative
- enums must contain valid values
- dates must be valid
- MongoDB ObjectIds must be valid

Never assume frontend input is trustworthy.

---

## 12. Error Handling

A single failed request must not crash the server.

Error responses should follow a consistent format.

Do not expose:

- internal stack traces
- database connection strings
- API keys
- JWT secrets
- passwords
- internal implementation details

---

## 13. Environment Variables

Secrets must be stored in:

```text
.env
```

Never commit `.env`.

Only commit:

```text
.env.example
```

Example:

```env
MONGODB_URI=
JWT_SECRET=
GEMINI_API_KEY=
PORT=
```

Never put real secrets inside `.env.example`.

---

## 14. Git Workflow

Branch structure:

```text
main
└── develop
    ├── feature/profile
    ├── feature/meal-ai
    ├── feature/plan-tracking
    └── feature/chat-social
```

Rules:

- `main` contains stable code only.
- `develop` is the integration branch.
- Feature branches are always created from `develop`.
- Do not create a feature branch from another member's feature branch.
- Do not push directly to `main`.
- Prefer Pull Requests for changes going into `develop`.
- Pull Requests must be reviewed by at least one other team member.

Do NOT create dependency chains such as:

```text
feature/A
   ↓
feature/B
   ↓
feature/C
```

Feature branches must remain independent at the Git level.

Module dependencies must be handled through:

- API contracts
- database contracts
- mock data
- shared types

---

## 15. Module Ownership

### A - User & Health

Responsible for:

- Authentication
- Profile
- BMI
- BMR
- TDEE
- Maintenance Calories
- Goals
- Git workflow
- CI/CD
- Code review

### B - Meal & AI Vision

Responsible for:

- Food
- Meal
- Meal_Food
- Meal logging
- AI Vision
- Eating-out flow
- Cooking flow

### C - Plan & Tracking

Responsible for:

- Plans
- Plan_Meal
- Nutrition tracking
- Calories/Macro tracking
- Weight tracking
- Charts
- Statistics

### D - Chatbot + Social + Gamification

Responsible for:

- Chatbot
- Posts
- Comments
- Likes
- Friends
- Saved Posts
- Points
- Rank
- Streak
- Achievements

Do not modify another member's module unless it is genuinely required.

---

## 16. Cross-module Changes

If a task requires changes outside the current module:

1. Identify the dependency.
2. Read the related module first.
3. Explain which files need to change.
4. Explain why the change is required.
5. Modify only what is necessary.
6. Do not silently rewrite another module.

Example:

```text
Meal requires authenticated user information
        ↓
Do not modify Auth
        ↓
Use req.user.id
```

---

## 17. API Contract

The API must remain consistent between frontend and backend.

Examples:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

GET  /api/profile
PUT  /api/profile

GET  /api/health/current
```

If an API contract must change:

- update backend
- update frontend
- update Postman
- update shared types
- check all dependent modules

Do not change endpoints casually.

---

## 18. Postman

APIs must be tested with Postman.

Current Postman resources are located in:

```text
postman/
```

and/or:

```text
.postman/
```

Follow the existing project convention.

Do not create another Postman structure unnecessarily.

---

## 19. Testing

### API tasks

Test:

- API success case
- validation errors
- authentication
- authorization
- error cases

### Business logic tasks

Test:

- normal calculations
- edge cases
- invalid inputs

### UI tasks

Test:

- normal flow
- loading state
- error state
- empty state

A task is not complete just because the code compiles.

---

## 20. Code Quality

Prefer code that is:

- readable
- maintainable
- predictable
- easy to review
- minimal

Avoid:

- over-engineering
- unnecessary abstraction
- duplicate code
- unnecessary packages
- rewriting entire files to fix small issues

Preferred order:

```text
Existing code
   ↓
Reuse
   ↓
Modify
   ↓
Create new code if necessary
```

---

## 21. Task Execution

Every task should follow:

```text
Read
 ↓
Understand
 ↓
Plan
 ↓
Implement
 ↓
Test
 ↓
Review Diff
 ↓
Report
```

Before coding:

- read related files
- read the relevant database schema
- read existing API implementations
- check dependencies
- understand current conventions

If requirements are unclear or conflicting:

Do not guess.

Explain the issue before making a major change.

---

## 22. Git Commit Convention

Use Conventional Commits:

```text
feat:
fix:
refactor:
test:
docs:
style:
chore:
```

Examples:

```text
feat(auth): add login API
feat(profile): add profile update
feat(meal): add AI food recognition
fix(auth): handle expired JWT
test(health): add TDEE calculation tests
docs(api): update Postman collection
```

Do not use vague commits such as:

```text
update
fix
final
final2
abc
test123
```

---

## 23. Pull Requests

Every Pull Request should:

- have a clear title
- describe what changed
- describe how it was tested
- stay within task scope
- contain no secrets

Example:

```text
feat(profile): implement profile API

Changes:
- GET /api/profile
- PUT /api/profile
- Profile validation

Test:
- Postman
- npm test
```

---

## 24. Security

Never commit:

- API keys
- JWT secrets
- passwords
- database credentials
- private credentials

Do not log sensitive information.

Do not bypass authentication just to make a demo work.

---

## 25. Agent Restrictions

### The agent MUST NOT:

- rewrite the entire project
- recreate the project from scratch
- change frameworks
- change the database technology
- change the database schema without approval
- create a `src/` directory without a specific reason
- delete working code unnecessarily
- modify unrelated modules
- commit secrets
- push directly to `main`

### The agent MUST:

- read the existing code before editing
- preserve the existing architecture
- make minimal changes
- run tests
- inspect `git diff`
- report modified files
- report test results
- report remaining issues

---

## 26. Definition of Done

A task is complete only when:

- The code works.
- Existing functionality is not broken.
- Validation is implemented.
- Error handling is implemented.
- Tests have been run.
- No secrets are included.
- `git diff` has been reviewed.
- APIs have been tested with Postman when applicable.
- The Pull Request contains an appropriate description.
- There are no unnecessary changes outside the task scope.

---

## 27. Golden Rule

> Do not change what the team has already agreed on without confirmation.

When uncertain:

```text
Read
 ↓
Understand
 ↓
Check Schema
 ↓
Check API
 ↓
Check Dependencies
 ↓
Ask / Propose
 ↓
Implement
```

Prioritize:

```text
Minimal Change
+
Existing Architecture
+
Existing Schema
+
Existing Conventions
```

Do not over-engineer.

Do not work outside the task scope.