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

export const createSecurityGroup = (vpc: AwsVpc, filePath: string): ec2.ISecurityGroup => {
  const securityGroupRule: SecurityGroupRuleProps = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../..', filePath), 'utf8'),
  );
  const securityGroup = vpc.createSecurityGroup('ecs-fargate', {
    securityGroupName: 'ecs-fargate',
    description: 'ecs-fargate',
    allowAllOutbound: securityGroupRule.allowAllOutbound,
  });
  vpc.addIngressRule(securityGroup, securityGroupRule.ingress);
  if (securityGroupRule.allowAllOutbound) {
    vpc.addEgressRule(securityGroup, securityGroupRule.egress);
  }
  return securityGroup;
};
