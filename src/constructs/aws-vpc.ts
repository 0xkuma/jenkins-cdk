import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface VpcSecurityGroupIds {
  [key: string]: string[];
}

export interface VpcSubnetIds {
  [key: string]: string[];
}

export interface AwsVpcSecurityGroupProps {
  readonly name: string;
  readonly tags?: {
    [key: string]: string;
  };
}

export interface AwsVpcSubnetProps {
  readonly cidr: string[];
  readonly tags?: {
    [key: string]: string;
  };
}

export interface AwsVpcProps {
  readonly cidr: string;
  readonly defaultInstanceTenancy?: ec2.DefaultInstanceTenancy;
  readonly enableDnsHostnames?: boolean;
  readonly enableDnsSupport?: boolean;
  readonly maxAzs?: number;
  readonly subnetConfiguration?: ec2.SubnetConfiguration[];
  readonly vpcName: string;
}

export class AwsVpc extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly getPublicSubnetIds: () => string[];

  constructor(scope: Construct, id: string, props: AwsVpcProps) {
    super(scope, id);

    let exp: { [key: string]: any } = {};
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        exp[key] = value;
      }
    });

    this.getPublicSubnetIds = () => {
      return this.vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC }).subnetIds;
    };

    this.vpc = new ec2.Vpc(this, 'VPC', exp);
  }
}
