import functions from '@functions/index';
import type { AWS } from '@serverless/typescript';
import * as dotenv from 'dotenv';
dotenv.config();

const serverlessConfiguration: AWS = {
  service: 'gurudwaras',

  plugins: ['serverless-esbuild', 'serverless-offline', 'serverless-dotenv-plugin'],

  provider: {
    name: 'aws',
    deploymentBucket: {
    name: 'serverless-framework-deployments-eu-north-1-ada6c825-690c'
  },
    runtime: 'nodejs20.x',
    stage: "${opt:stage, 'dev'}",
    region: process.env.GURUDWARA_AWS_REGION as AWS['provider']['region'],
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      GURDUWARA_LIST_DB: 'Gurduwara_List',
    },
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:DescribeTable',
            ],
            Resource: [
              'arn:aws:dynamodb:eu-north-1:761018888283:table/gurduwara_list',
              'arn:aws:dynamodb:eu-north-1:761018888283:table/gurudwara_dev',
              'arn:aws:dynamodb:eu-north-1:761018888283:table/gurudwara_dev/index/addedByUserId-index',
              'arn:aws:dynamodb:eu-north-1:761018888283:table/user_dev',
              'arn:aws:dynamodb:eu-north-1:761018888283:table/event_dev',
              'arn:aws:dynamodb:eu-north-1:761018888283:table/event_dev/index/startDate-event-index',
              'arn:aws:dynamodb:eu-north-1:761018888283:table/event_dev/index/user_id-index', // ✅ Add this
            ],
          },
          {
            Effect: 'Allow',
            Action: ['cognito-idp:*'],
            Resource: process.env.COGNITO_AUTHORIZER_ARN,
          },
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
            Resource: `arn:aws:s3:::${process.env.GURUDWARA_S3_BUCKET}/*`,
          },
        ],
      },
    },
  },

  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node20',
      platform: 'node',
    },
  },

  functions,
  // resources: {
  //   Resources: {
  //     ApiGatewayAuthorizer: {
  //       Type: "AWS::ApiGateway::Authorizer",
  //       Properties: {
  //         Name: "Cognito",
  //         Type: "COGNITO_USER_POOLS",
  //         IdentitySource: "method.request.header.Authorization",
  //         RestApiId: {
  //           Ref: "ApiGatewayRestApi"
  //         },
  //         ProviderARNs: [
  //           process.env.COGNITO_AUTHORIZER_ARN
  //         ]
  //       }
  //     }
  //   }
  // },
};

module.exports = serverlessConfiguration;
