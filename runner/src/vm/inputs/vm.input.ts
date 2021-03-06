import { IsIn, IsJSON, IsOptional, IsString, MaxLength } from "class-validator";

export default class VMInput {
  @IsString()
  @MaxLength(10000)
  readonly code: string;

  @IsJSON()
  @IsString()
  @IsOptional()
  @MaxLength(100 * 1000)
  readonly state?: string;

  @IsJSON()
  @IsString()
  @MaxLength(115 * 1000)
  readonly requestJson: string;

  @IsJSON()
  @IsString()
  @MaxLength(10 * 1000)
  readonly secretsJson: string;

  @IsIn(["reducer", "response", "query"])
  @IsString()
  readonly mode: "reducer" | "response" | "query";
}
