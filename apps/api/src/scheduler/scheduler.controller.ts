import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("scheduler")
@Controller("scheduler")
export class SchedulerController {
  // Future scheduler endpoints can be added here
}
