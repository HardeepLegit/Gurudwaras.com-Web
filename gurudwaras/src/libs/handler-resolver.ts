import * as path from "path";

export const handlerPath = (context: string) => {
  console.log("Path",path);
  return path.relative(process.cwd(), context).replace(/\\/g, "/");
};
