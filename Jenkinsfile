pipeline {
  agent any

  tools {
    nodejs 'NodeJS-20'
  }

  environment {
    SONAR_TOKEN = credentials('sonarqube-token')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Install and Test') {
      steps {
        sh 'npm test'
      }
      post {
        always {
          junit 'test-results/junit.xml'
        }
      }
    }

// had to rename sonarQubeScanner to sonarScanner to work in docker setup.
// had to also rename sonarQube to sonarQube-Lab to work in docker setup.
// I won't push the change on my end only this note so that remote repo still works for you.
    stage('SonarQube Analysis') {
      when { branch 'main' }
      steps {
        withSonarQubeEnv('SonarQube-Lab') {
          sh '''
            /var/jenkins_home/tools/hudson.plugins.sonar.SonarRunnerInstallation/SonarScanner/bin/sonar-scanner \
              -Dsonar.projectKey=expense-tracker \
              -Dsonar.projectName="Expense Tracker" \
              -Dsonar.projectVersion=1.0.${BUILD_NUMBER} \
              -Dsonar.sources=src \
              -Dsonar.tests=tests \
              -Dsonar.test.inclusions=**/*.test.ts,**/*.test.tsx \
              -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,**/*.d.ts,**/tests/** \
              -Dsonar.typescript.lcov.reportPaths=coverage/lcov.info
          '''
        }
      }
    }

    stage('Quality Gate') {
      when { branch 'main' }
      steps {
        timeout(time: 10, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('Build Production') {
      when {
        anyOf {
          branch 'develop'
          branch 'main'
        }
      }
      steps {
        sh 'npm run build'
      }
    }

    stage('Archive Artifact') {
      when { branch 'main' }
      steps {
        sh '''
          tar -czf expense-tracker-${BUILD_NUMBER}.tar.gz \
            dist/ Dockerfile nginx.conf 
        '''
        archiveArtifacts artifacts: "expense-tracker-${BUILD_NUMBER}.tar.gz", fingerprint: true
      }
    }
  }

  post {
    always {
      cleanWs()
    }
    failure {
      emailext (
        subject: "FAILED: Expense Tracker CI - Build #${BUILD_NUMBER}",
        body: "Build failed: ${BUILD_URL}",
        to: '${CHANGES_AUTHOR_EMAIL}'
      )
    }
  }
}
