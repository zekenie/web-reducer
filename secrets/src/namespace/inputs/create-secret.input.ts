import { IsString, MaxLength, MinLength } from "class-validator";

export default class CreateSecretInput {
  @IsString()
  @MaxLength(100)
  @MinLength(1)
  readonly key: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  readonly value: string;
}
