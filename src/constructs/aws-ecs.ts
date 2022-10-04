import { Duration } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

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
  readonly vpc: ec2.IVpc;
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
      cluster: ecs.ICluster;
      taskDefinition: ecs.FargateTaskDefinition;
      [key: string]: any;
    } = { cluster: props.cluster, taskDefinition: props.taskDefinition };

    Object.entries(props).forEach(([key, value]) => {
      if (key !== 'cluster' && key !== 'taskDefinition') {
        exp[key] = value;
      }
    });

    this.service = new ecs.FargateService(this, 'Service', exp);
  }
}

export class AwsEcsCluster extends Construct {
  public readonly cluster: ecs.ICluster;
  constructor(scope: Construct, id: string, props: AwsEcsClusterProps) {
    super(scope, id);

    let exp: { [key: string]: any } = {};
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        exp[key] = value;
      }
    });

    this.cluster = new ecs.Cluster(this, 'Cluster', exp);

    const task = new AwsEcsFargateTaskDefinition(this, 'TaskDefinition', {
      cpu: 256,
      memoryLimitMiB: 512,
    });
    task.fargateTaskDefinition.addContainer('Container', {
      image: ecs.ContainerImage.fromRegistry('nginx:latest'),
    });

    new AwsEcsFargateService(this, 'Service', {
      cluster: this.cluster,
      taskDefinition: task.fargateTaskDefinition,
    });
  }
}
