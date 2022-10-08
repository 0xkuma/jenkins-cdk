import { Duration } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { AwsSsm } from './aws-ssm';

export interface AwsRoute53RecordSetProps {
  readonly recordType: route53.RecordType;
  readonly target: route53.RecordTarget;
  readonly comment?: string;
  readonly deleteExisting?: boolean;
  readonly recordName?: string;
  readonly ttl?: Duration;
}

export interface AwsRoute53HostedZoneProps {
  readonly zoneName: string;
  readonly ccaAmazone?: boolean;
  readonly comment?: string;
  readonly crossAccountZoneDelegationPrincipal?: iam.IPrincipal;
  readonly crossAccountZoneDelegationRoleName?: string;
  readonly queryLogsLogGroupArn?: string;
  readonly ssm: AwsSsm;
}

export class AwsRoute53 extends Construct {
  public readonly hostedZone: route53.IHostedZone;
  public readonly addRecordSet: (
    service: string,
    props: AwsRoute53RecordSetProps,
    index: string,
  ) => void;

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

    this.addRecordSet = (service: string, funcProps: AwsRoute53RecordSetProps, index: string) => {
      let funcExp: { [key: string]: any } = {};
      Object.entries(funcProps).forEach(([key, value]) => {
        if (value !== undefined) {
          funcExp[key] = value;
        }
      });

      new route53.RecordSet(this, `${service}-recordset-${index}`, {
        zone: this.hostedZone,
        ...funcExp,
        recordType: funcExp.recordType,
        recordName: funcExp.recordName,
        target: funcExp.target,
      });
    };
  }
}
