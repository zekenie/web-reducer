// stacktracy
// https://github.com/patriksimek/vm2/issues/87

import StackTracey from "stacktracey";

export function formatStacktrace({
  error,
  programFile,
  lineNumberFilter = (n) => true,
  lineNumberMap = (n) => n,
}: {
  error: Error;
  programFile: string;
  lineNumberFilter?: (line?: number) => boolean;
  lineNumberMap?: (lineNumber: number) => number;
}): string {
  const stacktracy = new StackTracey(error);
  return stacktracy
    .filter((line) => !line.thirdParty)
    .filter((line) => line.file === programFile)
    .filter((line) => {
      return lineNumberFilter(line.line);
    })
    .map((line) => {
      if (line.line) {
        line.line = lineNumberMap(line.line);
      }
      return line;
    })
    .asTable();
}
