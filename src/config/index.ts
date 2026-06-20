/**
 * @module config
 * @description Public API for NBP Director configuration.
 */
export { NBP_RULES, type NBPRulesConfig } from './nbp-rules.js';
export { CONTRADICTION_RULES, detectContradictions } from './contradiction-graph.js';
export { REFERENCE_PRIORITY_POLICY, resolveReferenceConflicts } from './reference-policy.js';
export {
  MUTATION_POLICIES,
  isModuleAllowed,
  isModuleForbidden,
  getMutationPolicy,
} from './mutation-policy.js';
