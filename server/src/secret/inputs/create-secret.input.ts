import { IsString, MaxLength } from "class-validator";

export default class CreateSecretInput {
  @IsString()
  @MaxLength(100)
  readonly key: string;

  @IsString()
  @MaxLength(1000)
  readonly value: string;
}
