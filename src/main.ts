import { App, Stack, Tags } from 'aws-cdk-lib';

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();
const stack = new Stack(app, 'Stack', { env: devEnv });

app.synth();
Tags.of(app).add('ProjectName', 'jenkins-cdk');
Tags.of(app).add('Environment', 'dev');
