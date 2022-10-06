import { App, Stack, Tags } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { AwsVpc, AwsEcsCluster, AwsIamRole } from './constructs';

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
