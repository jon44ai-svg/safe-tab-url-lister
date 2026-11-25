import type {
  Classification,
  Library,
  ModelView,
  OpenTab,
} from "./types";

export interface ITabRepository {
  load(): Promise<Library>;
  save(library: Library): Promise<void>;
}

export interface IOpenTabs {
  list(): Promise<OpenTab[]>;
}

export interface ISecretPolicy {
  describe(url: string): {
    host: string;
    path: string;
    urlDisplay: string;
    sensitive: boolean;
  };
  redactForModel(title: string, url: string): ModelView;
  dangerousScheme(url: string): boolean;
}

export interface IClassifier {
  healthy(): Promise<boolean>;
  classify(item: { id: string; view: ModelView }, signal?: AbortSignal): Promise<Classification>;
  classifyBatch(
    items: { id: string; view: ModelView }[],
    signal?: AbortSignal,
  ): Promise<Map<string, Classification>>;
}
