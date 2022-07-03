export type TemplateInputs =
  | {
      __wr_type: "input";
      name: string;
    }
  | { __wr_type: "select"; name: string; options: string[] };

type TemplateFields = any;

export type Template = {
  name: string;
  template: TemplateFields;
};
