pipeline {
  agent {
    docker {
      image 'node:latest'
    }

  }
  stages {
    stage('Testing') {
      steps {
        echo 'Starting tests...'
        sh 'yarn'
        sh 'yarn test'
        echo 'Done!'
      }
    }

  }
}