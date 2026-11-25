import type { ISecretPolicy } from "../domain/ports";
import { dangerousScheme, describeUrl, redactForModel } from "../infrastructure/secrets/secretPolicy";

export const secretPolicy: ISecretPolicy = {
  describe: describeUrl,
  redactForModel,
  dangerousScheme,
};
