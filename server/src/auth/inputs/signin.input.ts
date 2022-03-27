import { IsEmail, IsString, MaxLength } from "class-validator";

export default class SignIn {
  @IsString()
  @IsEmail()
  @MaxLength(255)
  email: string;
}
