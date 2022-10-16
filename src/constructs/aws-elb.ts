import { Duration } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
import { AwsVpc } from './aws-vpc';
import { createSecurityGroup } from './lib/security-group-handler';

export interface AwsElbListenerProps {}

export interface AwsElbProps {
  readonly vpc: AwsVpc;
  readonly deletionProtection?: boolean;
  readonly http2Enabled?: boolean;
  readonly idleTimeout?: Duration;
  readonly internetFacing?: boolean;
  readonly ipAddressType?: elbv2.IpAddressType;
  readonly loadBalancerName?: string;
  readonly vpcSubnets?: ec2.SubnetSelection;
  readonly securityGroupsFilePath: string;
}

export class AwsElb extends Construct {
  public readonly elb: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: AwsElbProps) {
    super(scope, id);

    let exp: { [key: string]: any } = {};
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        exp[key] = value;
      }
    });

    const securityGroup = createSecurityGroup({
      service: 'elb',
      vpc: props.vpc,
      filePath: props.securityGroupsFilePath,
      securityGroupName: 'elb',
      description: 'elb security group',
    });

    this.elb = new elbv2.ApplicationLoadBalancer(this, 'Elb', {
      ...exp,
      vpc: exp.vpc.vpc,
      securityGroup,
    });
  }
}
