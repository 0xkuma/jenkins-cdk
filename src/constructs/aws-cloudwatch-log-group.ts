import { RemovalPolicy } from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface AwsCloudwatchLogGroupProps {
  readonly encryptionKey?: kms.IKey;
  readonly logGroupName?: string;
  readonly removalPolicy?: RemovalPolicy;
  readonly retention?: logs.RetentionDays;
}

export class AwsCloudwatchLogGroup extends Construct {
  public readonly createLogGroup: (
    service: string,
    props: AwsCloudwatchLogGroupProps,
  ) => logs.LogGroup;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    let index: { [key: string]: number } = {};

    this.createLogGroup = (service: string, props: AwsCloudwatchLogGroupProps): logs.LogGroup => {
      let exp: { [key: string]: any } = {};
      Object.entries(props).forEach(([key, value]) => {
        exp[key] = value;
      });
      index[service] = index[service] ? index[service] + 1 : 1;

      const logGroup = new logs.LogGroup(this, `${service}-LogGroup-${index[service]}`, {
        ...exp,
      });
      return logGroup;
    };
  }
}
