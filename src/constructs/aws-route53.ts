import { execSync } from 'child_process';
import { Duration, Fn, Stack } from 'aws-cdk-lib';
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
  public readonly updateNamecheapDNS: () => void;

  constructor(scope: Construct, id: string, props: AwsRoute53HostedZoneProps) {
    super(scope, id);

    const stackName = Stack.of(this).stackName;

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
    if (this.hostedZone.hostedZoneNameServers) {
      props.ssm.createParameterStore(
        'route53',
        `/${stackName}/hostedZoneNameServers`,
        Fn.join(',', this.hostedZone.hostedZoneNameServers),
      );
    } else {
      throw new Error('hostedZoneNameServers is undefined');
    }

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

    this.updateNamecheapDNS = () => {
      console.log('Updating Namecheap DNS...');
      const namecheapApiCredentials = {
        username: process.env.NAMECHEAP_API_USERNAME,
        token: process.env.NAMECHEAP_API_TOKEN,
        ip: process.env.NAMECHEAP_API_IP,
        sld: process.env.DOMAIN_NAME?.split('.')[0],
        tld: process.env.DOMAIN_NAME?.split('.')[1],
      };
      const hostedZoneNameServers = props.ssm.getParameterStoreValue(
        'lookup',
        `/${stackName}/hostedZoneNameServers`,
      );

      execSync(
        `curl --location --request GET 'https://api.namecheap.com/xml.response?ApiUser=${namecheapApiCredentials.username}&ApiKey=${namecheapApiCredentials.token}&UserName=${namecheapApiCredentials.username}&Command=namecheap.domains.dns.setCustom&ClientIp=${namecheapApiCredentials.ip}&SLD=${namecheapApiCredentials.sld}&TLD=${namecheapApiCredentials.tld}&NameServers=${hostedZoneNameServers}'`,
      );
    };
  }
}
