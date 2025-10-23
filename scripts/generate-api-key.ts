// scripts/generate-api-key.ts
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { config } from "dotenv";

// Carrega as variáveis de ambiente do .env
config();

const prisma = new PrismaClient();

async function main() {
  const platformName = process.argv[2];
  if (!platformName) {
    console.error(
      "Uso: ts-node scripts/generate-api-key.ts <nome-da-plataforma>"
    );
    process.exit(1);
  }

  const apiKey = crypto.randomBytes(32).toString("hex");
  const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");

  await prisma.apiKey.create({ data: { hashedKey, platformName } });

  console.log(`\nAPI Key para "${platformName}":\n`);
  console.log(apiKey);
  console.log("\n✅ Chave salva no banco de dados com sucesso!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
