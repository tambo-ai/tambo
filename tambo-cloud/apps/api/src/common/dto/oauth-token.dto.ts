import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

@ApiSchema({
  name: "OAuthTokenRequest",
  description: "OAuth 2.0 Token Exchange Endpoint",
})
export class OAuthTokenRequestDto {
  @ApiProperty({
    description:
      "OAuth 2.0 grant type - must be 'urn:ietf:params:oauth:grant-type:token-exchange'",
    example: "urn:ietf:params:oauth:grant-type:token-exchange",
    name: "grant_type",
  })
  @IsString()
  @IsNotEmpty()
  grant_type!: string;

  @ApiProperty({
    description:
      "OAuth subject token from an OAuth provider (e.g., Google, Microsoft)",
    example:
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEyMzQ1Njc4OTAifQ...",
    name: "subject_token",
  })
  @IsString()
  @IsNotEmpty()
  subject_token!: string;

  @ApiProperty({
    description:
      "Type of the subject token - should be 'urn:ietf:params:oauth:token-type:access_token' or 'urn:ietf:params:oauth:token-type:id_token'",
    example: "urn:ietf:params:oauth:token-type:id_token",
    name: "subject_token_type",
  })
  @IsString()
  @IsNotEmpty()
  subject_token_type!: string;

  @ApiProperty({
    description: "Optional audience for the token",
    required: false,
    name: "audience",
  })
  @IsOptional()
  @IsString()
  audience?: string;

  @ApiProperty({
    description: "Optional scope for the token",
    required: false,
    name: "scope",
  })
  @IsOptional()
  @IsString()
  scope?: string;
}

@ApiSchema({
  name: "OAuthTokenResponse",
  description: "OAuth 2.0 Token Response",
})
export class OAuthTokenResponseDto {
  @ApiProperty({
    description: "JWT access token signed by Tambo with projectId as issuer",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  access_token!: string;

  @ApiProperty({
    description: "Token type - always 'Bearer'",
    example: "Bearer",
  })
  token_type!: string;

  @ApiProperty({
    description: "Token expiration time in seconds",
    example: 3600,
  })
  expires_in!: number;

  @ApiProperty({
    description: "Type of the issued token",
    example: "urn:ietf:params:oauth:token-type:access_token",
  })
  issued_token_type!: string;
}
