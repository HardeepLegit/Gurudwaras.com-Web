import functions from "@functions/index";
import type { AWS } from "@serverless/typescript";

const serverlessConfiguration: AWS = {
  org: "organization123",
  app: "gurudwaras",
  service: "gurudwaras",

  plugins: ["serverless-offline"],

  provider: {
    name: "aws",
    runtime: "nodejs20.x",
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

export default serverlessConfiguration;
