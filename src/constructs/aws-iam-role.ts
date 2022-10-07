import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class AwsIamRole extends Construct {
  public readonly createRole: (
    service: string,
    servicePrincipal: string,
    policyStatement: {
      Effect: iam.Effect;
      Action: string[];
      Resource: string[];
    },
  ) => iam.Role;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.createRole = (
      service: string,
      servicePrincipal: string,
      policyStatement: {
        Effect: iam.Effect;
        Action: string[];
        Resource: string[];
      },
    ) => {
      const role = new iam.Role(this, `${service}-role`, {
        assumedBy: new iam.ServicePrincipal(servicePrincipal),
      });
      role.addToPolicy(
        new iam.PolicyStatement({
          effect: policyStatement.Effect,
          actions: policyStatement.Action,
          resources: policyStatement.Resource,
        }),
      );
      return role;
    };
  }
}
