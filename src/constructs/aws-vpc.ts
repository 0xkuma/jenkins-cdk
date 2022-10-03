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
  public readonly createPublicSubnet: (az: string, cidrBlock: string, index: string) => void;
  public readonly getPublicSubnetIds: () => string[];

  constructor(scope: Construct, id: string, props: AwsVpcProps) {
    super(scope, id);

    const {
      cidr,
      defaultInstanceTenancy,
      enableDnsHostnames,
      enableDnsSupport,
      maxAzs,
      subnetConfiguration,
      vpcName,
    } = props;

    let publicSubnetIds: string[] = [];

    this.createPublicSubnet = (cidrBlock: string, index: string) => {
      const subnet = new ec2.PublicSubnet(this, `PublicSubnet-${index}`, {
        availabilityZone: this.vpc.availabilityZones[Number(index)],
        cidrBlock: cidrBlock,
        vpcId: this.vpc.vpcId,
        mapPublicIpOnLaunch: true,
      });
      publicSubnetIds.push(subnet.subnetId);
    };

    this.getPublicSubnetIds = () => {
      return publicSubnetIds;
    };

    this.vpc = new ec2.Vpc(this, 'VPC', {
      cidr: cidr,
      defaultInstanceTenancy: defaultInstanceTenancy,
      enableDnsHostnames: enableDnsHostnames,
      enableDnsSupport: enableDnsSupport,
      maxAzs: maxAzs,
      subnetConfiguration: subnetConfiguration,
      vpcName: vpcName,
    });
  }
}
