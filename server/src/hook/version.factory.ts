import crypto from "crypto";
import { Factory } from "fishery";
import { sql } from "slonik";
import { getPool } from "../db";
import { VersionRow, VersionWorkflowState } from "./hook.types";

class VersionFactory extends Factory<VersionRow> {
  draft() {
    return this.params({ workflowState: VersionWorkflowState.DRAFT });
  }
  published() {
    return this.params({ workflowState: VersionWorkflowState.PUBLISHED });
  }
}

const versionFactory = VersionFactory.define(
  ({ associations, params, onCreate }) => {
    onCreate((version) =>
      getPool().one(sql`
        insert into "version"
        ("id", "hookId", "code", "workflowState", "createdAt", "updatedAt", "compiledCode")
        values
        (
          ${version.id},
          ${associations.hookId!},
          ${version.code},
          ${version.workflowState},
          ${version.createdAt.toISOString()},
          ${version.createdAt.toISOString()},
          ${version.compiledCode!}
        )
        returning id
      `)
    );
    return {
      id: crypto.randomUUID(),
      code: "",
      compiledCode: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      hookId: associations.hookId!,
      workflowState: params.workflowState || VersionWorkflowState.DRAFT,
    };
  }
);

export default versionFactory;
