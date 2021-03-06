import { IsString, MaxLength } from "class-validator";

export default class ValidateSignIn {
  @IsString()
  @MaxLength(32)
  token: string;
}
