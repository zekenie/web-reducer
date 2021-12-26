import { IsString, MaxLength } from "class-validator";

export default class UpdateHook {
  @IsString()
  @MaxLength(8 * 1000)
  code: string;
}
