import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class AwsSsm extends Construct {
  public readonly createParameterStore: (
    service: string,
    parameterName: string,
    parameterValue: string,
  ) => ssm.StringParameter;
  public readonly getParemeterStore: (parameterName: string) => string;

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

    this.getParemeterStore = (parameterName: string) => {
      return ssm.StringParameter.fromStringParameterName(this, 'ParameterStore', parameterName)
        .stringValue;
    };
  }
}
