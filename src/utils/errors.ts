/**
 * Typed error hierarchy for louna-agent.
 *
 * All thrown errors inside src/ should extend AgentError so they can be
 * uniformly logged, escalated, and serialized to JSON.
 */

export interface SerializedError {
  name: string;
  message: string;
  code: string;
  context?: Record<string, unknown>;
  cause?: unknown;
}

export abstract class AgentError extends Error {
  abstract readonly code: string;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = new.target.name;
    Error.captureStackTrace?.(this, new.target);
  }

  toJSON(): SerializedError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      ...(this.context ? { context: this.context } : {}),
      ...(this.cause !== undefined ? { cause: serializeCause(this.cause) } : {}),
    };
  }
}

/** Configuration / startup error (invalid env, missing secret). */
export class ConfigError extends AgentError {
  readonly code = 'CONFIG_ERROR';
}

/** External API call failed (Anthropic, OpenAI, HubSpot, etc.). */
export class ExternalApiError extends AgentError {
  readonly code = 'EXTERNAL_API_ERROR';
}

/** Garde-fou (guardrail) was triggered — action refused. */
export class GuardrailError extends AgentError {
  readonly code = 'GUARDRAIL_ERROR';
}

/** Knowledge base / vector retrieval failure. */
export class KnowledgeError extends AgentError {
  readonly code = 'KNOWLEDGE_ERROR';
}

/** Escalation to human required (not really an "error", but uses the same plumbing). */
export class EscalationRequired extends AgentError {
  readonly code = 'ESCALATION_REQUIRED';
}

function serializeCause(cause: unknown): unknown {
  if (cause instanceof AgentError) return cause.toJSON();
  if (cause instanceof Error) {
    return { name: cause.name, message: cause.message, stack: cause.stack };
  }
  return cause;
}
