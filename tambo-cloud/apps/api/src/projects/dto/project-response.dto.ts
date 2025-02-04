export class ProjectCreateRequest {
  projectName!: string;
}

export class ProjectUpdateRequest {
  name!: string;
}

export class ProjectResponse {
  id!: string;
  name!: string;
  userId!: string;
}
