import { IsString, MaxLength, MinLength } from "class-validator";

export default class CreateSecretInput {
  @IsString()
  @MaxLength(100)
  @MinLength(1)
  readonly key: string;

  @IsString()
  @MaxLength(1000)
  @MinLength(1)
  readonly value: string;
}
