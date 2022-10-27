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

let securityGroupList: { [key: string]: ec2.SecurityGroup } = {};

export const createSecurityGroup = (props: SecurityGroupHandlerProps): ec2.ISecurityGroup => {
  if (securityGroupList[props.service]) {
    throw new Error('Security group already exists');
  }

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

  if (!securityGroupList[props.service]) {
    securityGroupList[props.service] = securityGroup;
  }

  return securityGroup;
};

export const getSecurityGroup = (service: string): ec2.ISecurityGroup => {
  if (!securityGroupList[service]) {
    throw new Error('Security group does not exist');
  }

  return securityGroupList[service];
};
