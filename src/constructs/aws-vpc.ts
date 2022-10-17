import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface AwsVpcSecurityGroupRuleProps {
  [key: string]: {
    peer: string;
    protocol: 'tcp' | 'udp' | 'icmp' | 'all';
    description: string;
    remoteRule: boolean;
  };
}

export interface AwsVpcSecurityGroupProps {
  readonly allowAllOutbound?: boolean;
  readonly description?: string;
  readonly securityGroupName?: string;
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
  public readonly createSecurityGroup: (
    service: string,
    props: AwsVpcSecurityGroupProps,
  ) => ec2.SecurityGroup;
  public readonly addIngressRule: (
    securityGroup: ec2.SecurityGroup,
    props: AwsVpcSecurityGroupRuleProps,
  ) => void;
  public readonly addEgressRule: (
    securityGroup: ec2.SecurityGroup,
    props: AwsVpcSecurityGroupRuleProps,
  ) => void;

  constructor(scope: Construct, id: string, props: AwsVpcProps) {
    super(scope, id);

    let index: { [key: string]: number } = {};

    let exp: { [key: string]: any } = {};
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        exp[key] = value;
      }
    });

    this.vpc = new ec2.Vpc(this, 'VPC', exp);

    this.getPublicSubnetIds = () => {
      return this.vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC }).subnetIds;
    };

    this.createSecurityGroup = (service: string, funcProps: AwsVpcSecurityGroupProps) => {
      let funcExp: { [key: string]: any } = {};
      Object.entries(funcProps).forEach(([key, value]) => {
        if (value !== undefined) {
          funcExp[key] = value;
        }
      });
      index[service] = index[service] ? index[service] + 1 : 1;
      const securityGroup = new ec2.SecurityGroup(
        this,
        `${service}-SecurityGroup-${index[service]}`,
        Object.assign(funcExp, { vpc: this.vpc }),
      );
      return securityGroup;
    };

    const peerFactory = (peer: string) => {
      if (peer === 'self') {
        return ec2.Peer.ipv4(this.vpc.vpcCidrBlock);
      } else if (peer === 'any') {
        return ec2.Peer.anyIpv4();
      } else {
        return ec2.Peer.ipv4(peer);
      }
    };

    this.addIngressRule = (
      securityGroup: ec2.SecurityGroup,
      funcProps: AwsVpcSecurityGroupRuleProps,
    ) => {
      Object.entries(funcProps).forEach(([key, value]) => {
        securityGroup.addIngressRule(
          peerFactory(value.peer),
          value.protocol == 'tcp' ? ec2.Port.tcp(Number(key)) : ec2.Port.udp(Number(key)),
          value.description,
          value.remoteRule,
        );
      });
    };

    this.addEgressRule = (
      securityGroup: ec2.SecurityGroup,
      funcProps: AwsVpcSecurityGroupRuleProps,
    ) => {
      Object.entries(funcProps).forEach(([key, value]) => {
        securityGroup.addEgressRule(
          peerFactory(value.peer),
          value.protocol == 'tcp' ? ec2.Port.tcp(Number(key)) : ec2.Port.udp(Number(key)),
          value.description,
          value.remoteRule,
        );
      });
    };
  }
}
