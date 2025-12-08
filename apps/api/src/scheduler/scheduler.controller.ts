import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EmailService } from "../common/services/email.service";

@ApiTags("scheduler")
@Controller("scheduler")
export class SchedulerController {
  constructor(private readonly emailService: EmailService) {}

  // Future scheduler endpoints can be added here
}
