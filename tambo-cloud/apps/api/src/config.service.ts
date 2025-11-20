import { ConfigService } from "@nestjs/config";

class ConfigServiceSingleton {
  private static instance?: ConfigService;

  static initialize(configService: ConfigService) {
    ConfigServiceSingleton.instance = configService;
  }

  static getInstance(): ConfigService {
    if (!ConfigServiceSingleton.instance) {
      throw new Error("ConfigService has not been initialized.");
    }
    return ConfigServiceSingleton.instance;
  }
}

export { ConfigServiceSingleton };
