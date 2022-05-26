import {
  ArrayMaxSize,
  IsArray,
  IsJSON,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export default class BulkVMInput {
  @IsString()
  @MaxLength(10000)
  readonly code: string;

  @IsJSON()
  @IsString()
  @IsOptional()
  @MaxLength(100 * 1000)
  readonly state: string;

  @IsJSON()
  @IsString()
  @MaxLength(250 * 1000)
  readonly requestsJson: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional({ each: true })
  @ArrayMaxSize(1000)
  @MaxLength(255, { each: true })
  readonly invalidIdempotencyKeys: string[];

  @IsJSON()
  @IsString()
  @MaxLength(10 * 1000)
  readonly secretsJson: string;
}
