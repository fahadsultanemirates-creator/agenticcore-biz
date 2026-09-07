// AgenticCore Biz — shared front-desk bot logic, used by the homepage
// widget, the Telegram manager bot, and Forge (the dashboard's own
// project-intake assistant). Adapted directly from AgenticCore
// Agency's proven bot-core.ts. Channel-agnostic on purpose: it takes
// plain text in, returns plain text out, and knows nothing about HTTP
// requests or Telegram updates.
//
// Unlike Agency, .biz's landing widget does not have a standing
// OpenRouter/OpenAI secret yet, so the widget channel here can run on
// EITHER OpenRouter (if that secret exists) OR xAI's Grok as a
// fallback -- see widget-chat/index.ts for which one it actually picks.
// Whichever provider answers the widget, it always uses the plain
// (non-task-filing) reply schema: the landing assistant must never be
// able to create a manager_tasks row or run /approve, only Telegram and
// Forge can do that.

import { BUSINESS_KNOWLEDGE_PROMPT } from './business-knowledge.ts';

// deno-lint-ignore no-explicit-any
type SupabaseAdmin = any;

export type Channel = 'widget' | 'telegram' | 'forge';

export interface BotConversation {
  id: string;
  channel: Channel;
  external_id: string;
  language: string | null;
  needs_human: boolean;
  created_at: string;
  updated_at: string;
}

export interface BotMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface HandleMessageParams {
  supabaseAdmin: SupabaseAdmin;
  channel: Channel;
  externalId: string;
  userMessage: string;
  // Widget only: used if present. Absent means the widget falls back to xaiApiKey instead.
  openRouterApiKey?: string;
  // Required for 'telegram'/'forge'; used as the widget's fallback provider when openRouterApiKey is absent.
  xaiApiKey?: string;
  // Model override -- interpreted against whichever provider actually answers.
  model?: string;
  // Optional signal from the transport layer (Telegram's per-user
  // language_code, or the browser's navigator.language) -- not a
  // default, just an extra hint appended to the system prompt.
  languageHint?: string;
}

export interface HandleMessageResult {
  reply: string;
  needsHuman: boolean;
  rateLimited?: boolean;
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_OPENROUTER_MODEL = 'anthropic/claude-sonnet-5';

const XAI_URL = 'https://api.x.ai/v1/chat/completions';
const DEFAULT_XAI_MODEL = 'grok-4-1';

const HISTORY_LIMIT = 30;
const RATE_LIMIT_WINDOW_MINUTES = 10;
const RATE_LIMIT_MAX_USER_MESSAGES = 20;

// manager_tasks id scheme: "AC-BIZ-0001" -- brand prefix + a count of
// existing rows for that brand, zero-padded to 4 digits. No Postgres
// sequence; see createManagerTask() below for how the count-then-insert
// race is handled without one.
const TASK_BRAND = 'biz';
const TASK_ID_PREFIX = 'AC-BIZ';
const MAX_TASK_ID_ATTEMPTS = 3;

const RATE_LIMIT_MESSAGE =
  "You're sending messages a bit too quickly — please wait a few minutes and try again.";
const GENERIC_ERROR_MESSAGE =
  'Something went wrong on our end. Please try again in a moment.';

// Additive context for the forge channel only, appended on top of the
// same BUSINESS_KNOWLEDGE_PROMPT every channel shares.
const FORGE_ADDITIVE_PROMPT = `You're embedded directly in the client's own dashboard (not Telegram or the public homepage) -- whoever is writing is already a signed-in client, not an anonymous visitor. If the conversation history above is empty, this is the very first thing they've said to you here: open with a short, warm welcome and invite them to describe their business and marketing goals, rather than diving straight into an answer. Guide them through describing it one step at a time (what the business does, current marketing, goals, budget expectations) rather than demanding everything at once, until you have enough to file it as a task for the team to scope and price -- same create_task/task_title/task_type judgment you'd use anywhere else.`;

export async function findOrCreateConversation(
  supabaseAdmin: SupabaseAdmin,
  channel: Channel,
  externalId: string
): Promise<BotConversation> {
  const { data: existing } = await supabaseAdmin
    .from('bot_conversations')
    .select('*')
    .eq('channel', channel)
    .eq('external_id', externalId)
    .maybeSingle();

  if (existing) return existing as BotConversation;

  const { data: created, error } = await supabaseAdmin
    .from('bot_conversations')
    .insert({ channel, external_id: externalId })
    .select('*')
    .single();

  if (error) throw error;
  return created as BotConversation;
}

export async function getRecentMessages(
  supabaseAdmin: SupabaseAdmin,
  conversationId: string,
  limit = HISTORY_LIMIT
): Promise<BotMessage[]> {
  const { data } = await supabaseAdmin
    .from('bot_messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return ((data as BotMessage[]) || []).reverse();
}

export async function getConversationHistory(
  supabaseAdmin: SupabaseAdmin,
  channel: Channel,
  externalId: string,
  limit = HISTORY_LIMIT
): Promise<BotMessage[]> {
  const { data: conversation } = await supabaseAdmin
    .from('bot_conversations')
    .select('id')
    .eq('channel', channel)
    .eq('external_id', externalId)
    .maybeSingle();

  if (!conversation) return [];
  return getRecentMessages(supabaseAdmin, conversation.id, limit);
}

async function isRateLimited(supabaseAdmin: SupabaseAdmin, conversationId: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60_000).toISOString();
  const { count } = await supabaseAdmin
    .from('bot_messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('role', 'user')
    .gte('created_at', windowStart);

  return (count || 0) >= RATE_LIMIT_MAX_USER_MESSAGES;
}

// Plain reply shape -- no task-filing capability at all. Used by the
// widget channel regardless of which provider answers it.
const REPLY_JSON_SCHEMA = {
  name: 'agenticcore_bot_reply',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      reply: {
        type: 'string',
        description: "The reply to send to the visitor, written entirely in the visitor's own language."
      },
      detected_language: {
        type: 'string',
        description: 'ISO 639-1 code (or best-guess language name) of the language the visitor wrote in.'
      },
      needs_human: {
        type: 'boolean',
        description:
          'True if this conversation should be handed off to a human -- custom/large scope, price/scope negotiation, signs of frustration, or any commitment beyond pre-approved terms.'
      },
      uncertain: {
        type: 'boolean',
        description: 'True if the assistant is not confident in the reply, or the question falls outside the given business knowledge.'
      }
    },
    required: ['reply', 'detected_language', 'needs_human', 'uncertain'],
    additionalProperties: false
  }
};

interface ParsedReply {
  reply: string;
  detected_language: string;
  needs_human: boolean;
  uncertain: boolean;
}

// Telegram/Forge only: adds create_task/task_title/task_type on top of
// the base reply shape. Never used for the widget channel.
const MANAGER_REPLY_JSON_SCHEMA = {
  name: 'agenticcore_manager_bot_reply',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      reply: {
        type: 'string',
        description: "The reply to send, written entirely in the sender's own language."
      },
      detected_language: {
        type: 'string',
        description: 'ISO 639-1 code (or best-guess language name) of the language the sender wrote in.'
      },
      needs_human: {
        type: 'boolean',
        description:
          'True if this conversation should be handed off to a human -- custom/large scope, price/scope negotiation, signs of frustration, or any commitment beyond pre-approved terms.'
      },
      uncertain: {
        type: 'boolean',
        description: 'True if the assistant is not confident in the reply, or the question falls outside the given business knowledge.'
      },
      create_task: {
        type: 'boolean',
        description:
          'True if this conversation describes an actual business wanting a marketing plan scoped, or something else the manager should personally track and follow up on. False for ordinary questions you can already answer.'
      },
      task_title: {
        type: 'string',
        description: 'Short (few-word) title summarizing the task. Empty string if create_task is false.'
      },
      task_type: {
        type: 'string',
        description: 'Short category for the task, e.g. "real-estate", "general-business", "revision", "general". Empty string if create_task is false.'
      }
    },
    required: ['reply', 'detected_language', 'needs_human', 'uncertain', 'create_task', 'task_title', 'task_type'],
    additionalProperties: false
  }
};

interface ManagerParsedReply extends ParsedReply {
  create_task: boolean;
  task_title: string;
  task_type: string;
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<ParsedReply> {
  const resp = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://agenticcore.biz',
      'X-Title': 'AgenticCore Biz Front-Desk Bot'
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: 'json_schema', json_schema: REPLY_JSON_SCHEMA },
      temperature: 0.4
    })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`OpenRouter request failed (${resp.status}): ${text.slice(0, 500)}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter response missing message content');
  return JSON.parse(content) as ParsedReply;
}

// Widget's xAI fallback -- deliberately uses the plain REPLY_JSON_SCHEMA
// (no create_task field at all), never MANAGER_REPLY_JSON_SCHEMA, so the
// landing assistant cannot file a manager task no matter which provider
// answers it.
async function callXaiPlain(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<ParsedReply> {
  const resp = await fetch(XAI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: 'json_schema', json_schema: REPLY_JSON_SCHEMA },
      temperature: 0.4
    })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`xAI request failed (${resp.status}): ${text.slice(0, 500)}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('xAI response missing message content');
  return JSON.parse(content) as ParsedReply;
}

async function callXaiManager(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<ManagerParsedReply> {
  const resp = await fetch(XAI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: 'json_schema', json_schema: MANAGER_REPLY_JSON_SCHEMA },
      temperature: 0.4
    })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`xAI request failed (${resp.status}): ${text.slice(0, 500)}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('xAI response missing message content');
  return JSON.parse(content) as ManagerParsedReply;
}

const OPEN_TASK_STATUSES_EXCLUDED = ['done', 'cancelled'];

// A given Telegram chat or Forge session should keep talking about the
// same task until it's actually finished, not spawn a fresh AC-BIZ id
// every time the model decides create_task is true again mid-conversation
// -- e.g. a follow-up clarification about scope shouldn't file a second
// task. Only an explicit "new task" from the sender breaks out of that
// and starts another one.
async function hasOpenManagerTask(
  supabaseAdmin: SupabaseAdmin,
  channel: Channel,
  externalId: string
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('manager_tasks')
    .select('public_id')
    .eq('brand', TASK_BRAND)
    .eq('channel', channel)
    .eq('external_id', externalId)
    .not('status', 'in', `(${OPEN_TASK_STATUSES_EXCLUDED.join(',')})`)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

// Count-then-insert, exactly as specified (no Postgres sequence): count
// existing rows for this brand, propose brand-1, pad to 4 digits. Two
// messages arriving close together could compute the same count, so this
// retries on a unique-violation against public_id's unique constraint
// (the actual race guard) rather than trusting the count alone.
async function createManagerTask(
  supabaseAdmin: SupabaseAdmin,
  params: { channel: Channel; externalId: string; title: string; taskType: string }
): Promise<string> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_TASK_ID_ATTEMPTS; attempt++) {
    const { count, error: countError } = await supabaseAdmin
      .from('manager_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('brand', TASK_BRAND);

    if (countError) throw countError;

    const publicId = `${TASK_ID_PREFIX}-${String((count || 0) + 1).padStart(4, '0')}`;

    const { error: insertError } = await supabaseAdmin.from('manager_tasks').insert({
      public_id: publicId,
      brand: TASK_BRAND,
      channel: params.channel,
      external_id: params.externalId,
      title: params.title,
      task_type: params.taskType,
      status: 'waiting_you'
    });

    if (!insertError) return publicId;

    // 23505 = unique_violation on public_id -- another message raced on
    // the same count-based id. Recompute and retry; anything else is a
    // real error worth surfacing immediately.
    if (insertError.code !== '23505') throw insertError;
    lastError = insertError;
  }

  throw lastError ?? new Error('Could not allocate a unique manager task id after retries');
}

export async function handleIncomingMessage(params: HandleMessageParams): Promise<HandleMessageResult> {
  const { supabaseAdmin, channel, externalId, userMessage, openRouterApiKey, xaiApiKey, model, languageHint } = params;

  const conversation = await findOrCreateConversation(supabaseAdmin, channel, externalId);

  if (await isRateLimited(supabaseAdmin, conversation.id)) {
    return { reply: RATE_LIMIT_MESSAGE, needsHuman: false, rateLimited: true };
  }

  const history = await getRecentMessages(supabaseAdmin, conversation.id);

  let systemPrompt = BUSINESS_KNOWLEDGE_PROMPT;
  if (languageHint) {
    systemPrompt += `\n\n(Platform hint, not a rule: this visitor's device/client language looks like "${languageHint}". Use it only if their own message gives you no better signal -- their actual words always win.)`;
  }
  if (channel === 'forge') {
    systemPrompt += `\n\n${FORGE_ADDITIVE_PROMPT}`;
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ];

  let reply: string;
  let detectedLanguage: string;
  let needsHuman: boolean;
  let uncertain: boolean;

  if (channel === 'telegram' || channel === 'forge') {
    if (!xaiApiKey) throw new Error(`xaiApiKey is required for the ${channel} channel`);

    let parsed: ManagerParsedReply;
    try {
      parsed = await callXaiManager(xaiApiKey, model || DEFAULT_XAI_MODEL, messages);
    } catch (err) {
      console.error('xAI call failed:', err);
      return { reply: GENERIC_ERROR_MESSAGE, needsHuman: false };
    }

    detectedLanguage = parsed.detected_language;
    needsHuman = Boolean(parsed.needs_human);
    uncertain = Boolean(parsed.uncertain);
    reply = parsed.reply;

    if (parsed.create_task) {
      const requestsNewTask = /\bnew task\b/i.test(userMessage);
      let skipCreate = false;

      if (!requestsNewTask) {
        try {
          skipCreate = await hasOpenManagerTask(supabaseAdmin, channel, externalId);
        } catch (err) {
          // If the open-task check itself fails, fail toward creating
          // (the pre-existing behavior) rather than silently dropping a
          // task the model judged worth filing.
          console.error('hasOpenManagerTask failed:', err);
        }
      }

      if (!skipCreate) {
        try {
          const publicId = await createManagerTask(supabaseAdmin, {
            channel,
            externalId,
            title: parsed.task_title || 'Untitled task',
            taskType: parsed.task_type || 'general'
          });
          reply = `${reply}\n\nTask ID: ${publicId}`;
        } catch (err) {
          // A task-filing failure must not break the reply itself -- the
          // conversation still gets a normal answer, just without a task
          // filed. Logged so it's visible in the function's logs rather
          // than silently lost.
          console.error('createManagerTask failed:', err);
        }
      }
    }
  } else {
    // widget: OpenRouter if configured, otherwise xAI -- either way,
    // always the plain schema with no task-filing capability.
    let parsed: ParsedReply;
    try {
      if (openRouterApiKey) {
        parsed = await callOpenRouter(openRouterApiKey, model || DEFAULT_OPENROUTER_MODEL, messages);
      } else if (xaiApiKey) {
        parsed = await callXaiPlain(xaiApiKey, model || DEFAULT_XAI_MODEL, messages);
      } else {
        throw new Error('No chat provider configured for the widget channel');
      }
    } catch (err) {
      console.error('Widget provider call failed:', err);
      return { reply: GENERIC_ERROR_MESSAGE, needsHuman: false };
    }

    detectedLanguage = parsed.detected_language;
    needsHuman = Boolean(parsed.needs_human);
    uncertain = Boolean(parsed.uncertain);
    reply = parsed.reply;
  }

  await supabaseAdmin.from('bot_messages').insert([
    {
      conversation_id: conversation.id,
      role: 'user',
      content: userMessage,
      detected_language: detectedLanguage || null
    },
    {
      conversation_id: conversation.id,
      role: 'assistant',
      content: reply,
      detected_language: detectedLanguage || null,
      uncertain,
      handoff_triggered: needsHuman
    }
  ]);

  await supabaseAdmin
    .from('bot_conversations')
    .update({
      language: detectedLanguage || conversation.language,
      needs_human: conversation.needs_human || needsHuman
    })
    .eq('id', conversation.id);

  return { reply, needsHuman };
}
