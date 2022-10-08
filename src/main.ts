import { App, Stack, Tags } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as dotenv from 'dotenv';
import { AwsVpc, AwsEcsCluster, AwsIamRole, AwsRoute53, AwsSsm } from './constructs';
dotenv.config();

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const projectName = 'jenkins-cdk';

const app = new App();
const stack = new Stack(app, projectName, { env: devEnv });
Tags.of(stack).add('ProjectName', projectName);
Tags.of(stack).add('Environment', 'dev');

// Check all the environment variables are set
const requiredEnvVars = [
  'DOMAIN_NAME',
  'NAMECHEAP_API_USERNAME',
  'NAMECHEAP_API_TOKEN',
  'NAMECHEAP_API_IP',
];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Environment variable ${envVar} is not set`);
  }
});

const aws_ssm = new AwsSsm(stack, 'AwsSsm');

new AwsRoute53(stack, 'AwsRoute53', {
  zoneName: process.env.DOMAIN_NAME!,
  ssm: aws_ssm,
}).updateNamecheapDNS();

const subnetConfiguration = [
  {
    cidrMask: 24,
    name: 'Public',
    subnetType: ec2.SubnetType.PUBLIC,
  },
];
const aws_vpc = new AwsVpc(stack, 'AwsVpc', {
  cidr: '10.0.0.0/16',
  defaultInstanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
  enableDnsHostnames: true,
  enableDnsSupport: true,
  maxAzs: 3,
  subnetConfiguration: subnetConfiguration,
  vpcName: `${projectName}-vpc`,
});

const aws_iam_role = new AwsIamRole(stack, 'AwsIamRole');

new AwsEcsCluster(stack, 'AwsEcsCluster', {
  clusterName: `${projectName}-cluster`,
  vpc: aws_vpc,
  role: aws_iam_role,
});

app.synth();
