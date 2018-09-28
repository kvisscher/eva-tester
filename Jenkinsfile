#!/usr/bin/env groovy

def branchName = env.BRANCH_NAME
def isProductionBuild = branchName == 'master'
def isTestBuild = branchName == 'develop'

def dockerRegistryCredentialsId = 'quay-evabuild' // (evabuild @ Quay)

def tagSuffix = isProductionBuild ? '' : 'develop-'
def imageNameWithoutRegistryPrefix = "new_black/dora:${tagSuffix}${currentBuild.number}"
def imageName = "quay.io/${imageNameWithoutRegistryPrefix}"

node('docker') {

    stage('Clean workspace') {
        deleteDir()
    }

    stage('Checkout source') {
        checkout scm
    }

    stage('Build image') {
	    sh 'git rev-parse HEAD > commit'
	    def commitHash = readFile('commit').trim()

        print "Building image with hash $commitHash"

        image = docker.build(imageNameWithoutRegistryPrefix, "--build-arg GIT_COMMIT_HASH=$commitHash .")

        print 'Done building image'
    }

    if (isProductionBuild || isTestBuild) {
        stage('Push image') {
            docker.withRegistry('https://quay.io', dockerRegistryCredentialsId) {
                image.push()

                if (isProductionBuild) {
                    image.push('latest', false)
                }
            }            
        }
    }

  stage('Deploy') {
    if (!isTestBuild) {
      print "Not deploying because this is not a test build (${branchName})"
      return
    }

    print "Deploying ${branchName}.."

    def context = 'azure-prod-eva'
    def namespace = 'test-eva'

    print "Deploying ${imageName}:${imageTag} using the context ${context}"
    slackSend channel: '#jenkins', message: "Deploying ${imageName}:${imageTag} using the context ${context}"

    sh "kubectl --context=\"${context}\" -n ${namespace} set image deployment/${deploymentName} ${containerName}=${imageName}:${imageTag}"
    
    print "Done deploying ${imageName}:${imageTag}"
    slackSend channel: '#jenkins', message:  "Done deploying ${imageName}:${imageTag}"
  }

}