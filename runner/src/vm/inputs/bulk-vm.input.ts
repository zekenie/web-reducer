import { IsJSON, IsString, MaxLength } from "class-validator";

export default class BulkVMInput {
  @IsString()
  @MaxLength(10000)
  readonly code: string;

  @IsJSON()
  @IsString()
  @MaxLength(100 * 1000)
  readonly state: string;

  @IsJSON()
  @IsString()
  @MaxLength(250 * 1000)
  readonly requestsJson: string;
}
