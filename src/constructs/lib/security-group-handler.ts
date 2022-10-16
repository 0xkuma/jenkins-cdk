import fs from 'fs';
import path from 'path';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { AwsVpc } from '../aws-vpc';

export interface SecurityGroupRuleProps {
  ingress: {
    [key: string]: {
      peer: string;
      protocol: 'tcp' | 'udp' | 'icmp' | 'all';
      description: string;
      remoteRule: boolean;
    };
  };
  egress: {
    [key: string]: {
      peer: string;
      protocol: 'tcp' | 'udp' | 'icmp' | 'all';
      description: string;
      remoteRule: boolean;
    };
  };
  allowAllOutbound: boolean;
}

export interface SecurityGroupHandlerProps {
  service: string;
  vpc: AwsVpc;
  filePath: string;
  securityGroupName: string;
  description: string;
}

export const createSecurityGroup = (props: SecurityGroupHandlerProps): ec2.ISecurityGroup => {
  const securityGroupRule: SecurityGroupRuleProps = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../..', props.filePath), 'utf8'),
  );
  const securityGroup = props.vpc.createSecurityGroup(props.service, {
    securityGroupName: props.securityGroupName,
    description: props.description,
    allowAllOutbound: securityGroupRule.allowAllOutbound,
  });
  props.vpc.addIngressRule(securityGroup, securityGroupRule.ingress);
  if (securityGroupRule.allowAllOutbound) {
    props.vpc.addEgressRule(securityGroup, securityGroupRule.egress);
  }
  return securityGroup;
};
