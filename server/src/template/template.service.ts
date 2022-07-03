import {
  getDraftAndPublishedCode,
  getPublishedCodeByHook,
} from "../hook/hook.db";
import { runTemplatesCode } from "../runner/vm.remote";
import { readStateForHookId } from "../state/state.service";
import { Template } from "./template.types";

export async function getTemplates({
  hookId,
}: {
  hookId: string;
}): Promise<Template[]> {
  const state = await readStateForHookId(hookId);
  const { compiledCode } = await getPublishedCodeByHook(hookId);
  return runTemplatesCode({ code: compiledCode, state });
}
