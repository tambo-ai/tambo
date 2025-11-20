import { Controller, Get, Param } from "@nestjs/common";
import { RegistryService } from "./registry.service";

@Controller("registry")
export class RegistryController {
  constructor(private readonly registryService: RegistryService) {}

  @Get(":componentname")
  getComponentDefinition(@Param("componentname") componentname: string) {
    const componentDefinition =
      this.registryService.getComponentDefinition(componentname);
    return componentDefinition;
  }
}
