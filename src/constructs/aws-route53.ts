import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export interface AwsRoute53HostedZoneProps {
  readonly zoneName: string;
  readonly ccaAmazone: boolean;
  readonly comment?: string;
  readonly crossAccountZoneDelegationPrincipal?: iam.IPrincipal;
  readonly crossAccountZoneDelegationRoleName?: string;
  readonly queryLogsLogGroupArn?: string;
}

export class AwsRoute53 extends Construct {
  public readonly hostedZone: route53.IHostedZone;

  constructor(scope: Construct, id: string, props: AwsRoute53HostedZoneProps) {
    super(scope, id);

    let exp: {
      zoneName: string;
      [key: string]: any;
    } = {
      zoneName: props.zoneName,
    };
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined && key !== 'zoneName') {
        exp[key] = value;
      }
    });

    this.hostedZone = new route53.PublicHostedZone(this, 'HostedZone', exp);
  }
}
