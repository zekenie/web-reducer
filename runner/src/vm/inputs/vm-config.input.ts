import { IsIn, IsJSON, IsOptional, IsString, MaxLength } from "class-validator";

export default class VMConfigInput {
  @IsString()
  @MaxLength(10000)
  readonly code: string;

  @IsJSON()
  @IsString()
  @IsOptional()
  @MaxLength(100 * 1000)
  readonly state?: string;
}
