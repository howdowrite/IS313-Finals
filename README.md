# Expense Tracker — SQE Final Project

A React, TypeScript and Vite expense tracker with Jenkins CI, SonarQube analysis and Docker deployment. Expenses are stored in the browser's localStorage.

## Local development

Install a Node.js version compatible with the dependencies: Vitest currently requires Node `^22.12.0`, `^24.0.0` or `>=26.0.0`. The Jenkinsfile still specifies a tool named `NodeJS-20`; update its configured tool and the Jenkinsfile together before relying on CI with a supported Node version.

```bash
npm ci
npm run dev
npm test                 # one run with coverage and JUnit output
npm run test:watch       # watch mode
npm run lint
npm run build
npm audit
```

The tests include business logic, UI components and the persistence hook. Vitest writes LCOV to `coverage/lcov.info` and JUnit results to `test-results/junit.xml`. Its configured thresholds are 80% lines, statements and functions and 70% branches. Check which files the coverage report includes; a Vitest result alone does not establish whole-project coverage in SonarQube.

## Pipeline overview

The CI job must be a **Multibranch Pipeline**, because the Jenkinsfile checks the branch name. A normal Pipeline job that checks out `main` does not necessarily supply the branch context needed for these conditions.

| Branch | Tests and coverage | SonarQube and gate | Production build | Archive |
| --- | --- | --- | --- | --- |
| `feature/*` | Yes | No | No | No |
| `develop` | Yes | No | Yes | No |
| `main` | Yes | Yes | Yes | Yes |

CI runs `npm ci`, `npm test` and publishes JUnit results. On `main`, SonarQube consumes LCOV and the quality gate must pass before the build and archive stages. A successful `main` build archives `expense-tracker-<CI_BUILD_NUMBER>.tar.gz`, containing `dist/`, `Dockerfile`, and `nginx.conf`. There is no separate lint stage in the current Jenkinsfile.

The separate CD job selects that archived main-branch build, extracts it, builds an Nginx image from the already-built `dist/` directory, and starts a container. It does not rebuild the React source. `Dockerfile` therefore requires `dist/` to exist in its build context.

## Jenkins with Docker outside of Docker

The following describes a local Docker Desktop setup with a Linux Jenkins container. Docker outside of Docker (DooD) means the Docker CLI in the Jenkins container talks to the host's Docker daemon through its socket; containers and published ports belong to that daemon. **Docker daemon access grants powerful control over the host**; use this only on a trusted local installation.

1. Install and start Docker Desktop with Linux containers. Preserve any existing Jenkins setup: use a separate container name and volume for a new installation.
2. Use a Jenkins image that includes the Docker CLI and `curl`, or install them in a custom Jenkins image. The standard Jenkins image should not be assumed to include the Docker CLI. Install the Pipeline, Git, NodeJS, SonarQube Scanner, Docker Pipeline, Copy Artifact, JUnit, Workspace Cleanup and Email Extension plugins.
3. Start Jenkins with a persistent volume mounted at `/var/jenkins_home`, a published web port (for example host `8090` to container `8080`), and the Docker Desktop Linux socket mounted at `/var/run/docker.sock`. The Jenkins process must have permission to access that socket. Socket ownership and group IDs vary; configure permissions for your installation rather than making the socket world-writable.
4. In the Jenkins agent that will run CD, check `docker version` and `docker info`. Both client and server must respond. Also verify that `git`, `tar`, `curl`, `npm` and a shell are available on the relevant agent. Docker Pipeline uses the Docker CLI and needs access to the same daemon.
5. Open `http://localhost:8090` on the Windows host, complete Jenkins setup, and configure the jobs below. If an existing Jenkins container already works with DooD, its configured ports, image, volumes and socket permissions can be reused; do not delete its volume to reset a job.

The repository does not provide a Jenkins Docker image or Compose file, so these Jenkins container settings must be configured separately. Published container ports can collide with existing services. The CD script stops and removes the existing container for the selected environment before starting its replacement.

For a **new** Docker Desktop installation, one example is to create a separate `Dockerfile.jenkins` outside the application build context, using the official Jenkins installation instructions as a guide:

```dockerfile
FROM jenkins/jenkins:lts
USER root
RUN apt-get update && apt-get install -y docker.io curl && rm -rf /var/lib/apt/lists/*
USER jenkins
```

From the directory containing that file, the following PowerShell example creates a new image and volume, obtains the Linux socket's group ID, and supplies that group to the Jenkins container:

```powershell
docker build -f Dockerfile.jenkins -t finals-jenkins .
docker volume create finals-jenkins-data
$socketGroup = docker run --rm -v /var/run/docker.sock:/var/run/docker.sock --entrypoint stat finals-jenkins -c '%g' /var/run/docker.sock
docker run -d --name finals-jenkins --restart unless-stopped -p 8091:8080 -v finals-jenkins-data:/var/jenkins_home -v /var/run/docker.sock:/var/run/docker.sock --group-add $socketGroup finals-jenkins
docker exec finals-jenkins docker version
```

This example uses host port `8091`, so use `http://localhost:8091` in the browser and adjust the SonarQube webhook URL accordingly. If the socket mount or group access fails, inspect your Docker Desktop setup before continuing. A separate container started this way has its own Jenkins settings and jobs; install the required plugins and configure it as described below. Do not replace an existing container or volume without first preserving anything you need.

## SonarQube setup

Run SonarQube Community Build with persistent storage and its supported database according to your installation. Create the `expense-tracker` project and configure a quality gate requiring **at least 80% overall coverage**, then assign it to the project. Confirm Community Build's main-branch multibranch integration with the instructor as required by the assignment.

In Jenkins:

1. Create a Secret text credential with ID `sonarqube-token` for a token allowed to analyze the project. Never commit the token.
2. Under **Manage Jenkins → System**, configure a SonarQube server named `SonarQube-Lab`, with the URL reachable **from the Jenkins agent**, and select the token credential.
3. Configure a scanner named `SonarScanner` under **Manage Jenkins → Tools**. The current Jenkinsfile hard-codes `/var/jenkins_home/tools/hudson.plugins.sonar.SonarRunnerInstallation/SonarScanner/bin/sonar-scanner`; ensure that exact path exists on the agent or update the Jenkinsfile for your setup.
4. Configure the NodeJS tool. The current Jenkinsfile expects `NodeJS-20`, but the dependency requirements above require a newer version; change the Jenkinsfile tool name to match a compatible installation.
5. Add a SonarQube webhook to `<JENKINS_URL>/sonarqube-webhook/`, including the trailing slash. It must be reachable **from SonarQube** so `waitForQualityGate` can receive the result. The webhook name can be descriptive, such as `Jenkins Quality Gate`.

For Jenkins and SonarQube containers on Docker Desktop, `http://host.docker.internal:9000` is a possible SonarQube URL from Jenkins, and `http://host.docker.internal:8090/sonarqube-webhook/` is a possible webhook URL from SonarQube. Adjust for actual host ports and networking. `localhost` inside a container refers to that container. Check webhook delivery and the imported coverage in SonarQube after an actual analysis.

## Configure the CI job

1. In Jenkins, create a **Multibranch Pipeline** named `finals-ci` and add the GitHub repository as a branch source. Select credentials if the repository is private.
2. Use **by Jenkinsfile**, with script path `Jenkinsfile`, and configure discovery of `main`, `develop` and `feature/*` branches.
3. Set automatic GitHub webhook triggering or periodic scanning/polling as required by the assignment. A manual scan can be used to discover branches initially.
4. Run the branch jobs and inspect their console output. Confirm that `main` publishes the SonarQube analysis, passes the gate, builds and archives a versioned artifact. The currently hard-coded scanner name, path, server name and token ID must match your Jenkins configuration.

For local Jenkins, an internet-hosted GitHub webhook cannot call a private `localhost` address directly; use polling or an appropriate reachable webhook endpoint. Configure email notifications if the failure email step is needed.

## Configure and run CD

1. Create a separate **Pipeline** job using Pipeline script from SCM and script path `Jenkinsfile.cd`, pointing to the same repository and an appropriate branch. The script defines the parameters; Jenkins may expose them after it has loaded the pipeline once.
2. Install the Copy Artifact and Docker Pipeline plugins. The CD script copies from `finals-ci/main`; if your CI multibranch job has another name or folder path, update `projectName` in `Jenkinsfile.cd`. Configure Copy Artifact permissions as needed.
3. Run a successful `main` CI build and confirm its numbered archive is available. In CD, choose **Build with Parameters**:
   - `CI_BUILD_NUMBER`: the successful **main CI** build number, not the CD build number.
   - `ENVIRONMENT`: `DEV`, `TEST`, `ACC` or `PROD`.
   - `SKIP_TESTS`: leave unchecked for the post-deployment HTTP check. The current flag skips that check; it does not run or skip a unit test suite.
4. Verify the chosen build number and environment in the console, then open the matching host URL:

| Environment | Container | Host port |
| --- | --- | --- |
| DEV | `expense-tracker-dev` | 3001 |
| TEST | `expense-tracker-test` | 3002 |
| ACC | `expense-tracker-acc` | 3003 |
| PROD | `expense-tracker-prod` | 3004 |

The CD health check uses `host.docker.internal`, which assumes the Jenkins agent can reach the Docker Desktop host by that name. Adapt it for other Docker hosts. Docker Hub login is currently commented out and no image push is configured; local deployment does not require Docker Hub credentials. CD currently has no production approval stage, security scan or automated test stage.

## Build the application image locally

From the repository root, generate `dist/` first, then build and run the image:

```bash
npm ci
npm run build
docker build -t expense-tracker:local .
docker run --rm -p 8081:80 expense-tracker:local
```

Open `http://localhost:8081`. Choose a free host port if necessary.

## Submission checks

Capture the repository and branch evidence, feature test run, develop test/build, main stages and SonarQube coverage/gate, archived artifact and CI build number, a failed test or quality gate followed by a corrected passing run, CD parameters and deployed app, and the current `npm audit` result. Record the required 5–8 minute demonstration. Actual Jenkins, SonarQube and Docker results must be verified in the environment where the jobs run.
