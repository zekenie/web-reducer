import { IsString, MaxLength } from "class-validator";

export default class ValidateSignIn {
  @IsString()
  @MaxLength(21)
  token: string;
}
