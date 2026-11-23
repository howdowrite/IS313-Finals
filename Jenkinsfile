pipeline {
  agent any

  tools {
    nodejs 'NodeJS-20'
    sonarqube 'SonarQubeScanner'
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

    stage('SonarQube Analysis') {
      when { branch 'main' }
      steps {
        withSonarQubeEnv('SonarQube') {
          sh '''
            sonar-scanner \
              -Dsonar.projectKey=expense-tracker \
              -Dsonar.projectName="Expense Tracker" \
              -Dsonar.projectVersion=1.0.${BUILD_NUMBER} \
              -Dsonar.sources=src \
              -Dsonar.tests=tests \
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
            --exclude=node_modules \
            --exclude=coverage \
            --exclude=.git \
            --exclude=.gitignore \
            --exclude=*.md \
            --exclude=Jenkinsfile* \
            --exclude=Dockerfile \
            --exclude=nginx.conf \
            --exclude=sonar-project.properties \
            dist/ Dockerfile nginx.conf sonar-project.properties
        '''
        archiveArtifacts artifacts: 'expense-tracker-${BUILD_NUMBER}.tar.gz', fingerprint: true
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