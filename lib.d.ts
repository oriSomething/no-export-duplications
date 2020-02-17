//#region Parse
interface ParseFileArgs {
  code: string;
  uri: string;
}

interface ParseFileReturn {
  exports: ExportsData;
  imports: ImportData[];
}
//#endregion

interface ImportData {
  fileDirname: string;
  from: string;
  isDefault: boolean;
  isRenamed: boolean;
  name: string;
}

interface ExportData {
  line: number;
  isPrivate: boolean;
}

type ExportsData = Map<string, ExportData>;

//#region Options
interface CheckOptions {
  whitelist?: string[];
  // ignorePrivateOutsidePackage: boolean;
}

interface AnalyzeOptions {
  ignorepath?: string[];
}
//#endregion
