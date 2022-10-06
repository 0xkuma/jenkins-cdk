import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface AwsVpcSecurityGroupIngressRuleProps {
  readonly peer: ec2.IPeer;
  readonly connection: ec2.Port;
  readonly description: string;
  readonly remoteRule: boolean;
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
    type: string,
    props: AwsVpcSecurityGroupProps,
  ) => ec2.SecurityGroup;
  public readonly addIngressRule: (
    securityGroup: ec2.SecurityGroup,
    props: AwsVpcSecurityGroupIngressRuleProps,
  ) => void;

  constructor(scope: Construct, id: string, props: AwsVpcProps) {
    super(scope, id);

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

    this.createSecurityGroup = (type: string, funcProps: AwsVpcSecurityGroupProps) => {
      let funcExp: { [key: string]: any } = {};
      Object.entries(funcProps).forEach(([key, value]) => {
        if (value !== undefined) {
          funcExp[key] = value;
        }
      });
      return new ec2.SecurityGroup(
        this,
        `${type}-SecurityGroup`,
        Object.assign(funcExp, { vpc: this.vpc }),
      );
    };

    this.addIngressRule = (
      securityGroup: ec2.SecurityGroup,
      funcProps: AwsVpcSecurityGroupIngressRuleProps,
    ) => {
      let funcExp: { [key: string]: any } = {};
      Object.entries(funcProps).forEach(([key, value]) => {
        if (value !== undefined) {
          funcExp[key] = value;
        }
      });
      securityGroup.addIngressRule(
        funcExp.peer,
        funcExp.connection,
        funcExp.description,
        funcExp.remoteRule,
      );
    };
  }
}
