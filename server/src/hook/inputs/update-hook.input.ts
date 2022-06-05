import { IsString, MaxLength } from "class-validator";

export default class UpdateHookInput {
  @IsString()
  @MaxLength(8 * 1000)
  code: string;
}
