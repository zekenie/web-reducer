import { IsIn, IsString, MaxLength } from "class-validator";

export default class CreateKeyInput {
  @IsString()
  @IsIn(["read", "write"])
  type: "read" | "write";
}
