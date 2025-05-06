import functions from "@functions/index";
import type { AWS } from "@serverless/typescript";
import * as dotenv from 'dotenv';
dotenv.config();

const serverlessConfiguration: AWS = {
  org: "organization123",
  app: "gurudwaras",
  service: "gurudwaras",

  plugins: ["serverless-offline","serverless-dotenv-plugin"],

  provider: {
    name: "aws",
    runtime: "nodejs20.x",
    profile: "aamir",
    stage:  "${opt:stage, 'dev'}",
    region: "eu-north-1",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      GURDUWARA_LIST_DB: 'Gurduwara_List'
    },
    iam:{
      role:{
        statements:[
          {
            Effect: "Allow",
            Action: [
              "dynamodb:PutItem",
              "dynamodb:GetItem",
              "dynamodb:Query",
              "dynamodb:Scan"
            ],
            Resource: "arn:aws:dynamodb:eu-north-1:761018888283:table/gurduwara_list"
          }
        ]
      }
    }
  },

  functions

  // custom: {
  //   esbuild: {
  //     bundle: true,
  //     minify: false,
  //     sourcemap: true,
  //     target: "node20",
  //     platform: "node",
  //     external: ["aws-sdk"],
  //   },
  // },
};

module.exports = serverlessConfiguration;
