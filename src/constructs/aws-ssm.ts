import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class AwsSsm extends Construct {
  public readonly createParameterStore: (
    service: string,
    parameterName: string,
    parameterValue: string,
  ) => ssm.StringParameter;
  public readonly getParameterStoreValue: (
    methods: 'lookup' | 'stringParameter',
    parameterName: string,
  ) => string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.createParameterStore = (
      service: string,
      parameterName: string,
      parameterValue: string,
    ) => {
      return new ssm.StringParameter(this, `${service}-parameter`, {
        parameterName: parameterName,
        stringValue: parameterValue,
      });
    };

    this.getParameterStoreValue = (
      methods: 'lookup' | 'stringParameter',
      parameterName: string,
    ) => {
      switch (methods) {
        case 'lookup':
          return ssm.StringParameter.valueFromLookup(this, parameterName);
        case 'stringParameter':
          return ssm.StringParameter.valueForStringParameter(this, parameterName);
        default:
          throw new Error('methods is undefined');
      }
    };
  }
}
