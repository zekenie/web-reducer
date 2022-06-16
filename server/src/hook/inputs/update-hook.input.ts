import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

export default class UpdateHookInput {
  @IsString()
  @MaxLength(8 * 1000)
  @IsOptional()
  readonly code?: string;

  @IsString()
  @MaxLength(150)
  @IsOptional()
  // https://stackoverflow.com/questions/24419067/validate-a-string-to-be-url-safe-using-regex
  @Matches(/^[a-zA-Z0-9_-]*$/)
  readonly name?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  readonly description?: string;
}
