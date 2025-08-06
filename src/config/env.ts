import { z } from "zod";
import { Logger } from "@/utils/logger";

const logger = new Logger("Config:Env");

// Schema for environment variables
const envSchema = z.object({
  NODE_ENV: z.string(),
  NEXT_PUBLIC_APP_URL: z.string(),
});

// Function to validate environment variables
const validateEnv = () => {
  try {
    logger.info("Validating environment variables");
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };
    const parsed = envSchema.parse(env);
    logger.info("Environment variables validated successfully");
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join("."));
      logger.error("Invalid environment variables", { error: { missingVars } });
      throw new Error(
        `❌ Invalid environment variables: ${missingVars.join(
          ", "
        )}. Please check your .env file`
      );
    }
    throw error;
  }
};

export const env = validateEnv();
