import * as kms from 'aws-cdk-lib/aws-kms';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface AwsSnsProps {
  readonly contentBasedDeduplication?: boolean;
  readonly displayName?: string;
  readonly fifo?: boolean;
  readonly masterKey?: kms.IKey;
  readonly topicName?: string;
}

export class AwsSns extends Construct {
  public readonly topic: sns.Topic;

  constructor(scope: Construct, id: string, props: AwsSnsProps = {}) {
    super(scope, id);

    let exp: { [key: string]: any } = {};
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        exp[key] = value;
      }
    });

    this.topic = new sns.Topic(this, 'Topic', {
      ...exp,
    });
  }
}
