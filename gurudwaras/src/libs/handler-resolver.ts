import * as path from "path";

export const handlerPath = (context: string) => {
  return path.relative(process.cwd(), context).replace(/\\/g, "/");
};
