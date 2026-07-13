import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const sqlite = readFileSync(join(__dirname, "..", "prisma", "schema.prisma"), "utf8");
const postgres = sqlite.replace(
  /datasource db \{[\s\S]+?\}/,
  `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
);
writeFileSync(join(__dirname, "..", "prisma", "schema.postgres.prisma"), postgres);
console.log("Synced schema.postgres.prisma from schema.prisma");
