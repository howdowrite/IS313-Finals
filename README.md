# Expense Tracker - SQE Final Project

A React + TypeScript expense tracking application with a Jenkins, SonarQube, and Docker CI/CD pipeline.

## Features

- **Expense Management**: Add, view, filter, and delete expenses
- **Categories**: Food, Transport, Entertainment, Utilities, Other
- **Date Range Filtering**: Filter expenses by custom date ranges
- **Summary Dashboard**: Total expenses, monthly totals, and category breakdown
- **Data Persistence**: localStorage for client-side data retention
- **Responsive Design**: UI styled with CSS variables

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Testing**: Vitest, Testing Library, V8 coverage
- **CI/CD**: Jenkins Multibranch Pipeline and a separate deployment job
- **Code Quality**: SonarQube analysis and quality gate
- **Containerization**: Docker and Nginx with SPA routing

## Project Structure

```text
expense-tracker/
├── src/
│   ├── components/          # Expense form, list, filters, and summary
│   ├── hooks/useExpenses.ts # Expense state and localStorage
│   ├── utils/expenseCalculator.ts # Business logic
│   ├── App.tsx
│   └── App.css
├── tests/                   # Business logic, components, and hook tests
├── Jenkinsfile              # Multibranch CI pipeline
├── Jenkinsfile.cd           # Parameterized CD pipeline
├── Dockerfile               # Packages the prebuilt app with Nginx
├── nginx.conf               # Nginx configuration
├── sonar-project.properties # SonarQube settings
├── vite.config.ts           # Vitest and coverage configuration
└── package.json
```

## Getting Started

Use a Node.js version compatible with the dependencies. Vitest requires Node `^22.12.0`, `^24.0.0`, or `>=26.0.0`; the Jenkinsfile currently refers to a tool named `NodeJS-20`, which should be updated to a compatible installation.

```bash
npm ci
npm run dev          # development server
npm run build        # production build
npm test             # tests and coverage
npm run test:watch   # watch mode
npm run lint
npm audit
```

## CI/CD Pipeline

### CI Pipeline (Jenkinsfile)

| Branch | Test and coverage | SonarQube and gate | Build | Archive |
|--------|-------------------|--------------------|-------|---------|
| feature/* | Yes | No | No | No |
| develop | Yes | No | Yes | No |
| main | Yes | Yes | Yes | Yes |

CI installs dependencies, runs tests and publishes JUnit results. On `main`, it analyzes coverage with SonarQube, waits for the quality gate, builds the app and archives `expense-tracker-<build number>.tar.gz` containing `dist/`, `Dockerfile` and `nginx.conf`.

### CD Pipeline (Jenkinsfile.cd)

The separate CD job copies the selected `main` CI artifact and builds an Nginx image using the prebuilt application.

- `CI_BUILD_NUMBER`: successful main CI build number
- `ENVIRONMENT`: `DEV`, `TEST`, `ACC`, or `PROD`
- `SKIP_TESTS`: skips the post-deployment HTTP check; leave unchecked for normal use

| Environment | Container | Host port |
|-------------|-----------|-----------|
| DEV | expense-tracker-dev | 3001 |
| TEST | expense-tracker-test | 3002 |
| ACC | expense-tracker-acc | 3003 |
| PROD | expense-tracker-prod | 3004 |

Deploying replaces the existing container for the selected environment. The current health check uses `host.docker.internal`, suitable for a reachable Docker Desktop host; adjust it for other setups. Docker Hub login is not required for local deployment.

## Docker

The application Dockerfile serves the already-built `dist/` directory. To run it locally:

```bash
npm ci
npm run build
docker build -t expense-tracker .
docker run -p 8080:80 expense-tracker
```

### Jenkins with Docker outside of Docker

For Docker Desktop with Linux containers, run Jenkins with a persistent `/var/jenkins_home` volume, a published port (for example `8090:8080`), the Docker CLI and `curl` installed, and the host Docker socket mounted at `/var/run/docker.sock`. Give the Jenkins user access to the socket and check `docker version` from the Jenkins container. The repository does not provide a Jenkins image or Compose file. Docker socket access grants broad control over the host, so use it only in a trusted environment.

Run SonarQube Community Build with persistent storage and a supported database. From Docker Desktop containers, `http://host.docker.internal:9000` can reach SonarQube on host port 9000; `http://host.docker.internal:8090/sonarqube-webhook/` can reach Jenkins on host port 8090. Adjust addresses for your ports and network.

## SonarQube Quality Gate

Create the `expense-tracker` project and assign a quality gate requiring at least **80% overall coverage**. Configure the SonarQube webhook to Jenkins at `/sonarqube-webhook/` and check its delivery after analysis. Confirm Community Build multibranch integration with the instructor.

Vitest thresholds are 80% for lines, statements and functions and 70% for branches; these are separate from the SonarQube gate. Coverage and gate results should be checked from actual runs.

## Testing

Tests cover expense calculations, components and the persistence hook. `npm test` generates a JUnit report at `test-results/junit.xml` and LCOV at `coverage/lcov.info`. Review which files are included before interpreting the coverage percentage.

## Git Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches (e.g., `feature/expense-tracker`)

## Jenkins Setup

1. Install Pipeline, Git, NodeJS, SonarQube Scanner, Docker Pipeline, Copy Artifact, JUnit, Workspace Cleanup and Email Extension plugins.
2. Configure a compatible NodeJS tool, a Secret text credential named `sonarqube-token`, and a SonarQube server named `SonarQube-Lab`. The Jenkinsfile currently expects the scanner at `/var/jenkins_home/tools/hudson.plugins.sonar.SonarRunnerInstallation/SonarScanner/bin/sonar-scanner`; update the path if your installation differs.
3. Create a Multibranch Pipeline named `finals-ci` using `Jenkinsfile`; discover `main`, `develop` and feature branches. Configure a GitHub webhook or periodic scanning/polling.
4. Create a separate Pipeline job using `Jenkinsfile.cd`. Its artifact source is `finals-ci/main`; update that path and Copy Artifact permissions if your CI job has another name or folder.

## npm Audit

Run `npm audit` to check the current dependency findings and document any suggested remediation.

## License

MIT - SQE Final Project
