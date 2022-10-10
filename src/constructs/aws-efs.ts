import { RemovalPolicy, Size } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import { AwsVpc } from './aws-vpc';

export interface AwsEfsProps {
  readonly vpc: AwsVpc;
  readonly enableAutomaticBackups?: boolean;
  readonly encrypted?: boolean;
  readonly fileSystemName?: string;
  readonly kmsKey?: kms.IKey;
  readonly lifecyclePolicy?: efs.LifecyclePolicy;
  readonly OutOfInfrequentAccessPolicy?: efs.OutOfInfrequentAccessPolicy;
  readonly performanceMode?: efs.PerformanceMode;
  readonly provisionedThroughputPerSecond?: Size;
  readonly removalPolicy?: RemovalPolicy;
  readonly securityGroup?: ec2.ISecurityGroup;
  readonly throughputMode?: efs.ThroughputMode;
  readonly vpcSubnets?: ec2.SubnetSelection;
}

export class AwsEfs extends Construct {
  constructor(scope: Construct, id: string, props: AwsEfsProps) {
    super(scope, id);

    let exp: { [key: string]: any } = {};
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        exp[key] = value;
      }
    });

    new efs.FileSystem(this, 'FileSystem', {
      ...exp,
      vpc: exp.vpc.vpc,
    });
  }
}
