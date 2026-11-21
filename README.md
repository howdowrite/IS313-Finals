# Expense Tracker - SQE Final Project

A React + TypeScript expense tracking application with complete CI/CD pipeline using Jenkins, SonarQube, and Docker.

## Features

- **Expense Management**: Add, view, filter, and delete expenses
- **Categories**: Food, Transport, Entertainment, Utilities, Other
- **Date Range Filtering**: Filter expenses by custom date ranges
- **Summary Dashboard**: Total expenses, monthly totals, category breakdown
- **Data Persistence**: localStorage for client-side data retention
- **Responsive Design**: Clean, modern UI with CSS variables

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Testing**: Vitest + @testing-library/react + @vitest/coverage-v8
- **CI/CD**: Jenkins Multibranch Pipeline
- **Code Quality**: SonarQube (80% coverage quality gate)
- **Containerization**: Docker multi-stage build (Node.js + Nginx)
- **Web Server**: Nginx with SPA routing support

## Project Structure

```
expense-tracker/
├── src/
│   ├── components/          # React components
│   │   ├── ExpenseForm.tsx  # Add expense form
│   │   ├── ExpenseList.tsx  # Display expenses with delete
│   │   ├── ExpenseFilter.tsx # Category + date filters
│   │   └── SummaryCards.tsx  # Dashboard summary
│   ├── hooks/
│   │   └── useExpenses.ts   # Custom hook with localStorage
│   ├── utils/
│   │   └── expenseCalculator.ts # Pure business logic functions
│   ├── App.tsx              # Main app component
│   └── App.css              # Styling
├── tests/
│   ├── expenseCalculator.test.ts # 29 unit tests
│   └── setup.ts             # Test configuration
├── Jenkinsfile              # CI pipeline (multibranch)
├── Jenkinsfile.cd           # CD pipeline (parameterized)
├── Dockerfile               # Multi-stage Docker build
├── nginx.conf               # Nginx configuration
├── sonar-project.properties # SonarQube config
├── vite.config.ts           # Vitest + coverage config
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm test              # Watch mode
npm test -- --run     # Single run with coverage
```

### Linting

```bash
npm run lint
```

## CI/CD Pipeline

### CI Pipeline (Jenkinsfile)

Multibranch pipeline with branch-aware stages:

| Branch | Test | Coverage | SonarQube | Quality Gate | Build | Archive |
|--------|------|----------|-----------|--------------|-------|---------|
| feature/* | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| develop | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| main | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Stages:
1. **Install Dependencies** - `npm ci`
2. **Lint** - `npm run lint`
3. **Test** - `npm test -- --run`
4. **Coverage Check** - Enforces 80% lines/functions/statements, 70% branches
5. **SonarQube Analysis** - Runs on develop/main branches
6. **Quality Gate** - Waits for SonarQube quality gate (80% coverage, no blockers)
7. **Build** - Production build (`npm run build`)
8. **Archive Artifacts** - Versioned build artifacts

### CD Pipeline (Jenkinsfile.cd)

Parameterized deployment pipeline:

**Parameters:**
- `CI_BUILD_NUMBER` - Build number from CI pipeline
- `ENVIRONMENT` - Target environment (staging/production)
- `SKIP_TESTS` - Skip test execution (default: false)

Stages:
1. **Validate Parameters**
2. **Run Tests** (unless SKIP_TESTS=true)
3. **Build Docker Image** - Multi-stage build with version tag
4. **Security Scan** - Trivy vulnerability scan (if available)
5. **Deploy to Staging** - Auto-deploy on develop branch
6. **Manual Approval** - Required for production
7. **Deploy to Production** - With health checks
8. **Post-Deployment Verification** - Smoke tests
9. **Cleanup** - Remove old images

## Docker

### Multi-stage Build

```dockerfile
# Builder stage - Node.js 20 Alpine
FROM node:20-alpine AS builder
# ... install deps, run tests, build

# Production stage - Nginx Alpine
FROM nginx:alpine AS production
# ... copy build, configure nginx
```

### Run Locally

```bash
docker build -t expense-tracker .
docker run -p 8080:80 expense-tracker
```

## SonarQube Quality Gate

- **Coverage**: ≥ 80% (lines, functions, statements), ≥ 70% (branches)
- **Issues**: Zero blocker/critical issues
- **Duplications**: < 3%
- **Maintainability**: A rating

Configuration in `sonar-project.properties`.

## Testing

- **29 unit tests** covering all business logic functions
- **95% code coverage** (exceeds 80% requirement)
- Tests in `tests/expenseCalculator.test.ts`
- Run with: `npm test -- --run`

## Git Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches (e.g., `feature/expense-tracker`)

## npm Audit

```bash
npm audit
```
Currently: **0 vulnerabilities**

## Jenkins Setup

1. Install Jenkins with required plugins:
   - Pipeline
   - Docker Pipeline
   - SonarQube Scanner
   - Git Parameter

2. Configure credentials:
   - `sonarqube-token` - SonarQube authentication token
   - `dockerhub-credentials` - Docker Hub credentials (for CD)

3. Create Multibranch Pipeline job pointing to this repository

4. Create separate Pipeline job for CD using `Jenkinsfile.cd`

## License

MIT - SQE Final Project