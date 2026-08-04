import type { AWS } from "@serverless/typescript";

const serverlessConfiguration: AWS = {
  service: "create-gurudwara-table",
  frameworkVersion: "3",
  useDotenv: true,
  plugins: ["serverless-esbuild"],
  provider: {
    name: "aws",
    runtime: "nodejs18.x",
    region: "eu-north-1",
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: ["dynamodb:CreateTable"],
            Resource: "*"
          }
        ]
      }
    }
  },
  functions: {
    createTable: {
      handler: "src/handler.createGurudwaraTable",
      events: [
        {
          http: {
            path: "create-table",
            method: "get",
          }
        }
      ]
    }
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node18",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10
    }
  }
};

module.exports = serverlessConfiguration;
