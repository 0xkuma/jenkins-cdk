import fs from 'fs';
import path from 'path';
import { Duration } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { AwsIamRole } from './aws-iam-role';
import { AwsVpc } from './aws-vpc';

export interface SecurityGroupRuleProps {
  [key: string]: {
    peer: string;
    protocal: 'tcp' | 'udp' | 'icmp' | 'all';
    description: string;
    remoteRule?: boolean;
  };
}

export interface AwsEcsFargateTaskDefinitionProps {
  readonly cpu?: number;
  readonly ephemeralStorageGiB?: number;
  readonly executionRole?: iam.IRole;
  readonly family?: string;
  readonly memoryLimitMiB?: number;
  readonly proxyConfiguration?: ecs.ProxyConfiguration;
  readonly runtimePlatform?: ecs.RuntimePlatform;
  readonly taskRole?: iam.IRole;
  readonly volumes?: ecs.Volume[];
}

export interface AwsEcsFargateServiceProps {
  readonly cluster: ecs.ICluster;
  readonly taskDefinition: ecs.FargateTaskDefinition;
  readonly assignPublicIp?: boolean;
  readonly capacityProviderStrategies?: ecs.CapacityProviderStrategy[];
  readonly circuitBreaker?: ecs.DeploymentCircuitBreaker;
  readonly cloudMapOptions?: ecs.CloudMapOptions;
  readonly deploymentController?: ecs.DeploymentController;
  readonly desiredCount?: number;
  readonly enableECSManagedTags?: boolean;
  readonly enableExecuteCommand?: boolean;
  readonly healthCheckGracePeriod?: Duration;
  readonly maxHealthyPercent?: number;
  readonly minHealthyPercent?: number;
  readonly platformVersion?: ecs.FargatePlatformVersion;
  readonly propagateTags?: ecs.PropagatedTagSource;
  readonly securityGroups?: ec2.ISecurityGroup[];
  readonly serviceName?: string;
  readonly vpcSubnets?: ec2.SubnetSelection;
}

export interface AwsEcsClusterProps {
  readonly capacity?: ecs.AddCapacityOptions;
  readonly clusterName?: string;
  readonly containerInsights?: boolean;
  readonly defaultCloudMapNamespace?: ecs.CloudMapNamespaceOptions;
  readonly enableFargateCapacityProviders?: boolean;
  readonly executeCommandConfiguration?: ecs.ExecuteCommandConfiguration;
  readonly vpc: AwsVpc;
  readonly role: AwsIamRole;
  readonly securityGroupsPath: string;
}

export class AwsEcsFargateTaskDefinition extends Construct {
  public readonly fargateTaskDefinition: ecs.FargateTaskDefinition;

  constructor(scope: Construct, id: string, props: AwsEcsFargateTaskDefinitionProps) {
    super(scope, id);

    let exp: { [key: string]: any } = {};
    Object.entries(props).forEach(([key, value]) => {
      exp[key] = value;
    });

    this.fargateTaskDefinition = new ecs.FargateTaskDefinition(this, 'FargateTaskDefinition', exp);
  }
}

export class AwsEcsFargateService extends Construct {
  public readonly service: ecs.IFargateService;
  constructor(scope: Construct, id: string, props: AwsEcsFargateServiceProps) {
    super(scope, id);

    let exp: {
      [key: string]: any;
    } = {};
    Object.entries(props).forEach(([key, value]) => {
      exp[key] = value;
    });

    this.service = new ecs.FargateService(this, 'Service', {
      ...exp,
      cluster: exp.cluster,
      taskDefinition: exp.taskDefinition,
    });
  }
}

export class AwsEcsCluster extends Construct {
  public readonly cluster: ecs.ICluster;
  constructor(scope: Construct, id: string, props: AwsEcsClusterProps) {
    super(scope, id);

    let exp: { [key: string]: any } = {};
    Object.entries(props).forEach(([key, value]) => {
      exp[key] = value;
    });

    this.cluster = new ecs.Cluster(this, 'Cluster', {
      ...exp,
      vpc: exp.vpc.vpc,
    });

    const file = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'role-policy/ecs-task-policy.json'), 'utf8'),
    );
    const ecsTaskExecutionRole = props.role.createRole(
      'ecs-fargate',
      file.servicePrincipal,
      file.policyStatement,
    );

    const task = new AwsEcsFargateTaskDefinition(this, 'TaskDefinition', {
      cpu: 256,
      memoryLimitMiB: 512,
      taskRole: iam.Role.fromRoleArn(this, 'TaskRole', ecsTaskExecutionRole.roleArn),
      executionRole: iam.Role.fromRoleArn(this, 'ExecutionRole', ecsTaskExecutionRole.roleArn),
    });
    task.fargateTaskDefinition.addContainer('Container', {
      image: ecs.ContainerImage.fromRegistry('nginx:latest'),
    });

    const securityGroupRule = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', props.securityGroupsPath), 'utf8'),
    );
    const securityGroup = props.vpc.createSecurityGroup('ecs-fargate', {
      securityGroupName: 'ecs-fargate',
      description: 'ecs-fargate',
      allowAllOutbound: securityGroupRule.allowAllOutbound,
    });
    if (securityGroupRule.allowAllOutbound) {
      for (let rule = 0; rule < securityGroupRule.ingress.length; rule++) {
        props.vpc.addIngressRule(securityGroup, {
          peer: ec2.Peer.anyIpv4(),
          connection:
            securityGroupRule.ingress[rule] == 'tcp'
              ? ec2.Port.tcp(securityGroupRule.ingress[rule])
              : ec2.Port.udp(securityGroupRule.ingress[rule]),
          description: securityGroupRule.ingress[rule].description,
          remoteRule: securityGroupRule.ingress[rule].remoteRule,
        });
      }
    } else {
    }

    new AwsEcsFargateService(this, 'Service', {
      cluster: this.cluster,
      taskDefinition: task.fargateTaskDefinition,
      assignPublicIp: true,
      securityGroups: [securityGroup],
      desiredCount: 0,
    });
  }
}
