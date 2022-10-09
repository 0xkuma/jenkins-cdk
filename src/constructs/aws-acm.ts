import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { AwsRoute53 } from './aws-route53';

export interface AwsAcmProps {
  readonly hostedZone: AwsRoute53;
  readonly cleanupRoute53Route?: boolean;
  readonly customResourceRole?: iam.IRole;
  readonly region?: string;
  readonly route53Endpoint?: string;
  readonly subjectAlternativeNames?: string[];
  readonly transparencyLoggingEnabled?: boolean;
  readonly validation?: acm.CertificateValidation;
}

export class AwsAcm extends Construct {
  constructor(scope: Construct, id: string, props: AwsAcmProps) {
    super(scope, id);

    const domainName = process.env.DOMAIN_NAME!;

    let exp: { [key: string]: any } = {};
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        exp[key] = value;
      }
    });

    new acm.DnsValidatedCertificate(this, 'Certificate', {
      ...exp,
      domainName: `*.${domainName}`,
      hostedZone: exp.hostedZone.hostedZone,
    });
  }
}
