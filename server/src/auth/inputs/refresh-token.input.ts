import { IsString, MaxLength } from "class-validator";

export default class RefreshToken {
  @IsString()
  @MaxLength(33)
  token: string;
}
