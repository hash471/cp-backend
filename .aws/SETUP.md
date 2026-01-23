# AWS ECS Setup Guide

This guide helps you set up the required AWS resources for deploying the CP Backend to ECS.

## Prerequisites

- AWS CLI installed and configured
- AWS account with appropriate permissions

## 1. Create ECR Repository

```bash
aws ecr create-repository \
    --repository-name cp-backend \
    --region ap-south-1
```

## 2. Create ECS Cluster

```bash
aws ecs create-cluster \
    --cluster-name cp-backend-cluster \
    --region ap-south-1
```

## 3. Create CloudWatch Log Group

```bash
aws logs create-log-group \
    --log-group-name /ecs/cp-backend \
    --region ap-south-1
```

## 4. Create Secrets in AWS Secrets Manager

### Database Secrets

```bash
aws secretsmanager create-secret \
    --name cp-backend/db \
    --description "Database credentials for CP Backend" \
    --secret-string '{
        "DB_HOST": "your-rds-endpoint.ap-south-1.rds.amazonaws.com",
        "DB_PORT": "5432",
        "DB_USERNAME": "postgres",
        "DB_PASSWORD": "your-secure-password",
        "DB_DATABASE": "complaints",
        "DB_SSL": "true"
    }' \
    --region ap-south-1
```

### Auth Secrets

```bash
aws secretsmanager create-secret \
    --name cp-backend/auth \
    --description "Authentication credentials for CP Backend" \
    --secret-string '{
        "AUTH_CREDENTIALS": "admin:your-secure-admin-password,officer:your-secure-officer-password"
    }' \
    --region ap-south-1
```

## 5. Create IAM Roles

### ECS Task Execution Role

Create a role with the following trust policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```

Attach these policies:
- `AmazonECSTaskExecutionRolePolicy`
- Custom policy for Secrets Manager access:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue"
            ],
            "Resource": [
                "arn:aws:secretsmanager:ap-south-1:YOUR_ACCOUNT_ID:secret:cp-backend/*"
            ]
        }
    ]
}
```

## 6. Create VPC and Networking (if not exists)

You'll need:
- VPC with at least 2 subnets (preferably private)
- Security group allowing:
  - Inbound: Port 3000 from ALB security group
  - Outbound: All traffic (for pulling images, etc.)
- NAT Gateway (if using private subnets)

## 7. Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
    --name cp-backend-alb \
    --subnets subnet-xxx subnet-yyy \
    --security-groups sg-xxx \
    --region ap-south-1

# Create Target Group
aws elbv2 create-target-group \
    --name cp-backend-tg \
    --protocol HTTP \
    --port 3000 \
    --vpc-id vpc-xxx \
    --target-type ip \
    --health-check-path /api \
    --region ap-south-1

# Create Listener
aws elbv2 create-listener \
    --load-balancer-arn arn:aws:elasticloadbalancing:... \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:... \
    --region ap-south-1
```

## 8. Create ECS Service

```bash
aws ecs create-service \
    --cluster cp-backend-cluster \
    --service-name cp-backend-service \
    --task-definition cp-backend \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=cp-backend,containerPort=3000" \
    --region ap-south-1
```

## 9. Create RDS PostgreSQL Database

```bash
aws rds create-db-instance \
    --db-instance-identifier cp-backend-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15 \
    --master-username postgres \
    --master-user-password your-secure-password \
    --allocated-storage 20 \
    --vpc-security-group-ids sg-xxx \
    --db-subnet-group-name your-db-subnet-group \
    --db-name complaints \
    --region ap-south-1
```

## 10. GitHub Actions Secrets

Add these secrets to your GitHub repository:

| Secret Name | Description |
|-------------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user access key with ECS/ECR permissions |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |

## 11. Update Task Definition

Replace `YOUR_ACCOUNT_ID` in `.aws/task-definition.json` with your actual AWS account ID.

## Quick Terraform Alternative

For infrastructure as code, consider using Terraform. A basic setup would include:
- VPC module
- ECS cluster
- ECR repository
- RDS instance
- ALB
- Security groups
- IAM roles

## Troubleshooting

### Container fails to start
- Check CloudWatch logs at `/ecs/cp-backend`
- Verify secrets are accessible
- Ensure security groups allow database connectivity

### Health check fails
- Verify the container is listening on port 3000
- Check if the `/api` endpoint returns 200

### Database connection issues
- Verify RDS security group allows traffic from ECS tasks
- Check if DB_SSL is set correctly
- Ensure the database exists
