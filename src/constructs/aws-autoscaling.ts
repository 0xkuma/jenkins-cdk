import { Duration } from 'aws-cdk-lib';
import * as asg from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { AwsVpc } from './aws-vpc';
import { createSecurityGroup } from './lib/security-group-handler';

export interface AwsAutoscalingProps {
  readonly vpc: AwsVpc;
  readonly securityGroupsFilePath: string;
  readonly allowAllOutbound?: boolean;
  readonly associatePublicIpAddress?: boolean;
  readonly blockDevices?: asg.BlockDevice[];
  readonly cooldown?: Duration;
  readonly desiredCapaciry?: number;
  readonly groupMetrics?: asg.GroupMetric;
  readonly healthCheck?: asg.HealthCheck;
  readonly ignoreUnmodifiedSizeProperties?: boolean;
  readonly init?: ec2.CloudFormationInit;
  readonly initOptions?: ec2.ApplyCloudFormationInitOptions;
  readonly instanceMonitoring?: asg.Monitoring;
  readonly instanceType?: ec2.InstanceType;
  readonly keyName?: string;
  readonly launchTemplate?: ec2.ILaunchTemplate;
  readonly machineImage?: ec2.IMachineImage;
  readonly maxCapacity?: number;
  readonly maxInstanceLifetime?: Duration;
  readonly minCapacity?: number;
  readonly mixedInstancesPolicy?: asg.MixedInstancesPolicy;
  readonly newInstancesProtectedFromScaleIn?: boolean;
  readonly notifications?: asg.NotificationConfiguration[];
  readonly requireIMDSv2?: boolean;
  readonly role?: iam.IRole;
  readonly signals?: asg.Signals;
  readonly spotPrice?: string;
  readonly terminationPolicies?: asg.TerminationPolicy[];
  readonly updatePolicy?: asg.UpdatePolicy;
  readonly userData?: ec2.UserData;
  readonly vpcSubnets?: ec2.SubnetSelection;
}

export class AwsAutoscaling extends Construct {
  constructor(scope: Construct, id: string, props: AwsAutoscalingProps) {
    super(scope, id);

    let exp: { [key: string]: any } = {};
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        exp[key] = value;
      }
    });

    const securityGroup = createSecurityGroup({
      service: 'autoscaling',
      vpc: exp.vpc,
      filePath: exp.securityGroupsFilePath,
      securityGroupName: 'autoscaling',
      description: 'autoscaling security group',
    });

    new asg.AutoScalingGroup(this, 'AutoScalingGroup', {
      ...exp,
      vpc: exp.vpc,
      securityGroup: securityGroup,
    });
  }
}
