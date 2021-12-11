import { IsJSON, IsString, MaxLength } from "class-validator";

export default class VMInput {
  @IsString()
  @MaxLength(10000)
  readonly code: string;

  @IsJSON()
  @IsString()
  @MaxLength(100 * 1000)
  readonly state: string;

  @IsJSON()
  @IsString()
  @MaxLength(100 * 1000)
  readonly event: string;
}
