import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import { Construct } from 'constructs';

export class AwsServiceDiscovery extends Construct {
  public readonly publicDnsNamespace: servicediscovery.IPublicDnsNamespace;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.publicDnsNamespace = new servicediscovery.PublicDnsNamespace(this, 'PublicDnsNamespace', {
      name: process.env.DOMAIN_NAME!,
    });
  }
}
