import fs from 'fs';
import path from 'path';
import { Duration } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
import { AwsVpc } from './aws-vpc';
import { createSecurityGroup } from './lib/security-group-handler';

export interface AWSElbTargetGroupProps {
  readonly deregistrationDelay?: Duration;
  readonly healthCheck?: elbv2.HealthCheck;
  readonly loadBalancingAlgorithmType?: elbv2.TargetGroupLoadBalancingAlgorithmType;
  readonly port?: number;
  readonly protocol?: elbv2.ApplicationProtocol;
  readonly protocolVersion?: elbv2.ApplicationProtocolVersion;
  readonly slowStart?: Duration;
  readonly stickinessCookieDuration?: Duration;
  readonly stickinessCookieName?: string;
  readonly targetGroupName?: string;
  readonly targetType?: elbv2.TargetType;
  readonly targets?: elbv2.IApplicationLoadBalancerTarget[];
  readonly vpc: AwsVpc;
}

export interface AwsElbListenerProps {
  readonly certificates?: elbv2.IListenerCertificate[];
  readonly defaultAction?: elbv2.ListenerAction;
  readonly defaultTargetGroups?: elbv2.ITargetGroup[];
  readonly open?: boolean;
  readonly port?: number;
  readonly protocol?: elbv2.ApplicationProtocol;
  readonly sslPolicy?: elbv2.SslPolicy;
  readonly filePath: string;
}

export interface AwsElbListenerFileProps {
  [key: string]: {
    targetType: string;
    port: number;
  };
}

export interface AwsAlbProps {
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

export interface AwsElbProps {
  readonly alb: AwsAlbProps;
  readonly listener: AwsElbListenerProps;
  readonly targetGroup: AWSElbTargetGroupProps;
}

export class AwsElb extends Construct {
  public readonly elb: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: AwsElbProps) {
    super(scope, id);

    let lbExp: { [key: string]: any } = {};
    Object.entries(props.alb).forEach(([key, value]) => {
      if (value !== undefined) {
        lbExp[key] = value;
      }
    });

    const securityGroup = createSecurityGroup({
      service: 'elb',
      vpc: lbExp.vpc,
      filePath: lbExp.securityGroupsFilePath,
      securityGroupName: 'elb',
      description: 'elb security group',
    });

    this.elb = new elbv2.ApplicationLoadBalancer(this, 'Elb', {
      ...lbExp,
      vpc: lbExp.vpc,
      securityGroup,
    });

    const listenerFile: AwsElbListenerFileProps = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', props.listener.filePath), 'utf8'),
    );

    Object.entries(listenerFile).forEach(([key, value]) => {
      const listener = this.elb.addListener(`${key}-Listener`, {
        port: value.port,
      });
      switch (value.targetType) {
        case 'INSTANCE':
          let tgExp: { [key: string]: any } = {};
          Object.entries(props.targetGroup).forEach(([tgKey, tgValue]) => {
            if (tgValue !== undefined) {
              tgExp[tgKey] = tgValue;
            }
          });
          const targetGroup = new elbv2.ApplicationTargetGroup(this, `${key}-TargetGroup`, {
            ...tgExp,
          });
          listener.addTargetGroups(`${key}-AddTargetGroup`, {
            targetGroups: [targetGroup],
          });
          break;
      }
    });
  }
}
