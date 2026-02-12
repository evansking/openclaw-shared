import { useSettings, useSaveSettings } from "../../hooks/use-api";
import { SettingRow } from "../../components/shared/setting-row";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

function get(obj: any, path: string[]): any {
  let v = obj;
  for (const k of path) {
    if (v == null) return undefined;
    v = v[k];
  }
  return v;
}

export function SettingsIndex() {
  const { data: settings, isLoading } = useSettings();
  const save = useSaveSettings();
  const [config, setConfig] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    if (settings) setConfig(structuredClone(settings));
  }, [settings]);

  useEffect(() => {
    if (location.hash && config) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash, config]);

  if (isLoading || !config) return <div className="text-muted-foreground text-sm">Loading...</div>;

  const updatePath = (path: string[], value: any) => {
    const next = structuredClone(config);
    let obj = next;
    for (let i = 0; i < path.length - 1; i++) {
      if (!obj[path[i]]) obj[path[i]] = {};
      obj = obj[path[i]];
    }
    if (value === undefined) {
      delete obj[path[path.length - 1]];
    } else {
      obj[path[path.length - 1]] = value;
    }
    setConfig(next);
  };

  const handleSave = () => save.mutate(config);

  // Shorthand accessors
  const v = (path: string[], fallback: any = undefined) => get(config, path) ?? fallback;

  const imsg = config.channels?.imessage ?? {};
  const defaults = config.agents?.defaults ?? {};
  const heartbeat = defaults.heartbeat ?? {};
  const subagents = defaults.subagents ?? {};
  const gateway = config.gateway ?? {};
  const msgs = config.messages ?? {};
  const commands = config.commands ?? {};
  const webSearch = config.tools?.web?.search ?? {};
  const webFetch = config.tools?.web?.fetch ?? {};
  const browser = config.browser ?? {};
  const session = config.session ?? {};
  const cron = config.cron ?? {};
  const logging = config.logging ?? {};
  const update = config.update ?? {};
  const plugins = config.plugins ?? {};
  const skills = config.skills ?? {};
  const ui = config.ui ?? {};

  // Controls
  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`w-9 h-5 rounded-full transition-colors relative ${checked ? "bg-primary" : "bg-zinc-600"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );

  const Input = ({ value, onChange, type = "text", wide }: { value: any; onChange: (v: any) => void; type?: string; wide?: boolean }) => (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
      className={`${wide ? "w-48" : "w-32"} px-2 py-1 text-sm bg-secondary rounded border-0 outline-none text-right font-mono`}
    />
  );

  const Select = ({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="px-2 py-1 text-sm bg-secondary rounded border-0 outline-none">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => {
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return (
      <div id={id} className="bg-card border rounded-lg p-4 scroll-mt-16">
        <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">{title}</h2>
        {children}
      </div>
    );
  };

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-[hsl(0,0%,7%)] py-3 z-10">
        <h1 className="text-lg font-semibold">Settings</h1>
        <button onClick={handleSave} disabled={save.isPending} className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
          {save.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="space-y-6 pb-12">

        {/* ── iMessage Channel ── */}
        <Card title="iMessage Channel">
          <SettingRow label="Enabled" description="Master switch for the iMessage channel">
            <Toggle checked={imsg.enabled ?? true} onChange={(v) => updatePath(["channels", "imessage", "enabled"], v)} />
          </SettingRow>
          <SettingRow label="DM Policy" description="How incoming DMs are routed to agent sessions">
            <Select value={imsg.dmPolicy ?? "pairing"} options={["pairing", "allowlist", "open", "disabled"]} onChange={(v) => updatePath(["channels", "imessage", "dmPolicy"], v)} />
          </SettingRow>
          <SettingRow label="Group Policy" description="Which group chats the bot responds in">
            <Select value={imsg.groupPolicy ?? "allowlist"} options={["allowlist", "open", "disabled"]} onChange={(v) => updatePath(["channels", "imessage", "groupPolicy"], v)} />
          </SettingRow>
          <SettingRow label="Include Attachments" description="Include image and file attachments from messages">
            <Toggle checked={imsg.includeAttachments ?? true} onChange={(v) => updatePath(["channels", "imessage", "includeAttachments"], v)} />
          </SettingRow>
          <SettingRow label="Chunk Mode" description="How to split outgoing messages that exceed length limits">
            <Select value={imsg.chunkMode ?? "newline"} options={["newline", "length"]} onChange={(v) => updatePath(["channels", "imessage", "chunkMode"], v)} />
          </SettingRow>
          <SettingRow label="Block Streaming" description="Wait for full response before sending to chat">
            <Toggle checked={imsg.blockStreaming ?? false} onChange={(v) => updatePath(["channels", "imessage", "blockStreaming"], v)} />
          </SettingRow>
          <SettingRow label="Service" description="Send via iMessage or SMS">
            <Select value={imsg.service ?? "auto"} options={["auto", "imessage", "sms"]} onChange={(v) => updatePath(["channels", "imessage", "service"], v)} />
          </SettingRow>
          <SettingRow label="CLI Path" description="Path to the imsg CLI binary">
            <Input value={imsg.cliPath ?? "/opt/homebrew/bin/imsg"} onChange={(v) => updatePath(["channels", "imessage", "cliPath"], v)} wide />
          </SettingRow>
          <SettingRow label="DB Path" description="Path to Messages chat.db">
            <Input value={imsg.dbPath ?? ""} onChange={(v) => updatePath(["channels", "imessage", "dbPath"], v)} wide />
          </SettingRow>
          <SettingRow label="Media Max MB" description="Maximum inbound attachment size in megabytes">
            <Input type="number" value={imsg.mediaMaxMb ?? ""} onChange={(v) => updatePath(["channels", "imessage", "mediaMaxMb"], v)} />
          </SettingRow>
          <SettingRow label="History Limit" description="Number of past messages to include as context">
            <Input type="number" value={imsg.historyLimit ?? ""} onChange={(v) => updatePath(["channels", "imessage", "historyLimit"], v)} />
          </SettingRow>
          <SettingRow label="DM History Limit" description="History limit specifically for DM conversations">
            <Input type="number" value={imsg.dmHistoryLimit ?? ""} onChange={(v) => updatePath(["channels", "imessage", "dmHistoryLimit"], v)} />
          </SettingRow>
        </Card>

        {/* ── Agent Defaults ── */}
        <Card title="Agent Defaults">
          <SettingRow label="Max Concurrent" description="Maximum parallel agent sessions">
            <Input type="number" value={defaults.maxConcurrent ?? 4} onChange={(v) => updatePath(["agents", "defaults", "maxConcurrent"], v)} />
          </SettingRow>
          <SettingRow label="Subagent Max" description="Maximum parallel subagent sessions">
            <Input type="number" value={subagents.maxConcurrent ?? 8} onChange={(v) => updatePath(["agents", "defaults", "subagents", "maxConcurrent"], v)} />
          </SettingRow>
          <SettingRow label="Subagent Archive (min)" description="Archive idle subagent sessions after N minutes">
            <Input type="number" value={subagents.archiveAfterMinutes ?? 60} onChange={(v) => updatePath(["agents", "defaults", "subagents", "archiveAfterMinutes"], v)} />
          </SettingRow>
          <SettingRow label="Thinking Default" description="Default thinking/reasoning depth for agents">
            <Select value={defaults.thinkingDefault ?? "off"} options={["off", "minimal", "low", "medium", "high", "xhigh"]} onChange={(v) => updatePath(["agents", "defaults", "thinkingDefault"], v)} />
          </SettingRow>
          <SettingRow label="Verbose Default" description="Verbosity level for agent output">
            <Select value={defaults.verboseDefault ?? "off"} options={["off", "on", "full"]} onChange={(v) => updatePath(["agents", "defaults", "verboseDefault"], v)} />
          </SettingRow>
          <SettingRow label="Elevated Default" description="Elevated tool-use mode">
            <Select value={defaults.elevatedDefault ?? "off"} options={["off", "on", "ask", "full"]} onChange={(v) => updatePath(["agents", "defaults", "elevatedDefault"], v)} />
          </SettingRow>
          <SettingRow label="User Timezone" description="IANA timezone for the user (e.g. America/Los_Angeles)">
            <Input value={defaults.userTimezone ?? ""} onChange={(v) => updatePath(["agents", "defaults", "userTimezone"], v)} wide />
          </SettingRow>
          <SettingRow label="Time Format" description="12-hour or 24-hour clock display">
            <Select value={defaults.timeFormat ?? "auto"} options={["auto", "12", "24"]} onChange={(v) => updatePath(["agents", "defaults", "timeFormat"], v)} />
          </SettingRow>
          <SettingRow label="Timeout (sec)" description="Agent execution timeout in seconds">
            <Input type="number" value={defaults.timeoutSeconds ?? ""} onChange={(v) => updatePath(["agents", "defaults", "timeoutSeconds"], v)} />
          </SettingRow>
          <SettingRow label="Context Tokens" description="Optional context window cap (leave empty for model default)">
            <Input type="number" value={defaults.contextTokens ?? ""} onChange={(v) => updatePath(["agents", "defaults", "contextTokens"], v)} />
          </SettingRow>
          <SettingRow label="Media Max MB" description="Maximum inbound media size in megabytes">
            <Input type="number" value={defaults.mediaMaxMb ?? ""} onChange={(v) => updatePath(["agents", "defaults", "mediaMaxMb"], v)} />
          </SettingRow>
          <SettingRow label="Skip Bootstrap" description="Skip BOOTSTRAP.md creation for new sessions">
            <Toggle checked={defaults.skipBootstrap ?? false} onChange={(v) => updatePath(["agents", "defaults", "skipBootstrap"], v)} />
          </SettingRow>
          <SettingRow label="Bootstrap Max Chars" description="Maximum characters for BOOTSTRAP.md content">
            <Input type="number" value={defaults.bootstrapMaxChars ?? 20000} onChange={(v) => updatePath(["agents", "defaults", "bootstrapMaxChars"], v)} />
          </SettingRow>
        </Card>

        {/* ── Heartbeat ── */}
        <Card title="Heartbeat (Proactive Mode)">
          <SettingRow label="Interval" description="How often the heartbeat fires (e.g. '30m', '1h', '0m' to disable)">
            <Input value={heartbeat.every ?? "30m"} onChange={(v) => updatePath(["agents", "defaults", "heartbeat", "every"], v)} />
          </SettingRow>
          <SettingRow label="Session" description="Session key for heartbeat ('main' or custom)">
            <Input value={heartbeat.session ?? "main"} onChange={(v) => updatePath(["agents", "defaults", "heartbeat", "session"], v)} />
          </SettingRow>
          <SettingRow label="Target" description="Where heartbeat output is delivered">
            <Select value={heartbeat.target ?? "last"} options={["last", "none"]} onChange={(v) => updatePath(["agents", "defaults", "heartbeat", "target"], v)} />
          </SettingRow>
          <SettingRow label="Deliver To" description="Override delivery target (E.164 number or chat id)">
            <Input value={heartbeat.to ?? ""} onChange={(v) => updatePath(["agents", "defaults", "heartbeat", "to"], v)} wide />
          </SettingRow>
          <SettingRow label="Active Hours Start" description="Hour to start heartbeat (0-23)">
            <Input type="number" value={heartbeat.activeHours?.start ?? ""} onChange={(v) => updatePath(["agents", "defaults", "heartbeat", "activeHours", "start"], v)} />
          </SettingRow>
          <SettingRow label="Active Hours End" description="Hour to stop heartbeat (0-23)">
            <Input type="number" value={heartbeat.activeHours?.end ?? ""} onChange={(v) => updatePath(["agents", "defaults", "heartbeat", "activeHours", "end"], v)} />
          </SettingRow>
          <SettingRow label="Ack Max Chars" description="Max characters for heartbeat acknowledgment">
            <Input type="number" value={heartbeat.ackMaxChars ?? 30} onChange={(v) => updatePath(["agents", "defaults", "heartbeat", "ackMaxChars"], v)} />
          </SettingRow>
          <SettingRow label="Include Reasoning" description="Include reasoning in heartbeat output">
            <Toggle checked={heartbeat.includeReasoning ?? false} onChange={(v) => updatePath(["agents", "defaults", "heartbeat", "includeReasoning"], v)} />
          </SettingRow>
        </Card>

        {/* ── Streaming & Output ── */}
        <Card title="Streaming & Output">
          <SettingRow label="Block Streaming" description="Default block streaming mode for all channels">
            <Select value={defaults.blockStreamingDefault ?? "off"} options={["off", "on"]} onChange={(v) => updatePath(["agents", "defaults", "blockStreamingDefault"], v)} />
          </SettingRow>
          <SettingRow label="Block Streaming Break" description="Where to break streamed blocks">
            <Select value={defaults.blockStreamingBreak ?? "text_end"} options={["text_end", "message_end"]} onChange={(v) => updatePath(["agents", "defaults", "blockStreamingBreak"], v)} />
          </SettingRow>
          <SettingRow label="Typing Mode" description="When to show typing indicators">
            <Select value={defaults.typingMode ?? "thinking"} options={["never", "instant", "thinking", "message"]} onChange={(v) => updatePath(["agents", "defaults", "typingMode"], v)} />
          </SettingRow>
          <SettingRow label="Typing Interval (sec)" description="Seconds between typing indicator refreshes">
            <Input type="number" value={defaults.typingIntervalSeconds ?? ""} onChange={(v) => updatePath(["agents", "defaults", "typingIntervalSeconds"], v)} />
          </SettingRow>
          <SettingRow label="Human Delay Mode" description="Add natural delays to responses">
            <Select value={defaults.humanDelay?.mode ?? "off"} options={["off", "on"]} onChange={(v) => updatePath(["agents", "defaults", "humanDelay", "mode"], v)} />
          </SettingRow>
          <SettingRow label="Human Delay Min (ms)" description="Minimum delay in milliseconds">
            <Input type="number" value={defaults.humanDelay?.minMs ?? ""} onChange={(v) => updatePath(["agents", "defaults", "humanDelay", "minMs"], v)} />
          </SettingRow>
          <SettingRow label="Human Delay Max (ms)" description="Maximum delay in milliseconds">
            <Input type="number" value={defaults.humanDelay?.maxMs ?? ""} onChange={(v) => updatePath(["agents", "defaults", "humanDelay", "maxMs"], v)} />
          </SettingRow>
          <SettingRow label="Envelope Timestamp" description="Include timestamps in message envelopes">
            <Select value={defaults.envelopeTimestamp ?? "on"} options={["on", "off"]} onChange={(v) => updatePath(["agents", "defaults", "envelopeTimestamp"], v)} />
          </SettingRow>
          <SettingRow label="Envelope Timezone" description="Timezone for envelope timestamps">
            <Select value={defaults.envelopeTimezone ?? "local"} options={["utc", "local", "user"]} onChange={(v) => updatePath(["agents", "defaults", "envelopeTimezone"], v)} />
          </SettingRow>
          <SettingRow label="Envelope Elapsed" description="Show elapsed time in envelopes">
            <Select value={defaults.envelopeElapsed ?? "on"} options={["on", "off"]} onChange={(v) => updatePath(["agents", "defaults", "envelopeElapsed"], v)} />
          </SettingRow>
        </Card>

        {/* ── Message Handling ── */}
        <Card title="Message Handling">
          <SettingRow label="Debounce (ms)" description="Wait time before processing a message batch">
            <Input type="number" value={msgs.inbound?.debounceMs ?? 2500} onChange={(v) => updatePath(["messages", "inbound", "debounceMs"], v)} />
          </SettingRow>
          <SettingRow label="Ack Reaction Scope" description="When to add a tapback as acknowledgment">
            <Select value={msgs.ackReactionScope ?? "group-mentions"} options={["all", "group-all", "group-mentions", "direct", "never"]} onChange={(v) => updatePath(["messages", "ackReactionScope"], v)} />
          </SettingRow>
          <SettingRow label="Remove Ack After Reply" description="Remove the ack tapback once the reply is sent">
            <Toggle checked={msgs.removeAckAfterReply ?? false} onChange={(v) => updatePath(["messages", "removeAckAfterReply"], v)} />
          </SettingRow>
          <SettingRow label="Response Prefix" description="Prefix added to all replies (supports {model}, {think}, {identityName})">
            <Input value={msgs.responsePrefix ?? ""} onChange={(v) => updatePath(["messages", "responsePrefix"], v)} wide />
          </SettingRow>
          <SettingRow label="Group Mention History" description="Number of past messages for group mention context">
            <Input type="number" value={msgs.groupChat?.historyLimit ?? ""} onChange={(v) => updatePath(["messages", "groupChat", "historyLimit"], v)} />
          </SettingRow>
        </Card>

        {/* ── Session ── */}
        <Card title="Session Management">
          <SettingRow label="Scope" description="Session isolation level">
            <Select value={session.scope ?? "per-sender"} options={["per-sender", "global"]} onChange={(v) => updatePath(["session", "scope"], v)} />
          </SettingRow>
          <SettingRow label="DM Scope" description="How DM sessions are scoped">
            <Select value={session.dmScope ?? "main"} options={["main", "per-peer", "per-channel-peer", "per-account-channel-peer"]} onChange={(v) => updatePath(["session", "dmScope"], v)} />
          </SettingRow>
          <SettingRow label="Reset Mode" description="When sessions auto-reset">
            <Select value={session.reset?.mode ?? "idle"} options={["daily", "idle"]} onChange={(v) => updatePath(["session", "reset", "mode"], v)} />
          </SettingRow>
          <SettingRow label="Reset At Hour" description="Hour of day for daily reset (0-23)">
            <Input type="number" value={session.reset?.atHour ?? ""} onChange={(v) => updatePath(["session", "reset", "atHour"], v)} />
          </SettingRow>
          <SettingRow label="Idle Reset (min)" description="Minutes of inactivity before session resets">
            <Input type="number" value={session.reset?.idleMinutes ?? ""} onChange={(v) => updatePath(["session", "reset", "idleMinutes"], v)} />
          </SettingRow>
        </Card>

        {/* ── Context & Compaction ── */}
        <Card title="Context & Compaction">
          <SettingRow label="Pruning Mode" description="Context pruning strategy">
            <Select value={defaults.contextPruning?.mode ?? "off"} options={["off", "cache-ttl"]} onChange={(v) => updatePath(["agents", "defaults", "contextPruning", "mode"], v)} />
          </SettingRow>
          <SettingRow label="Pruning TTL" description="Cache TTL for context pruning (e.g. '5m', '1h')">
            <Input value={defaults.contextPruning?.ttl ?? ""} onChange={(v) => updatePath(["agents", "defaults", "contextPruning", "ttl"], v)} />
          </SettingRow>
          <SettingRow label="Keep Last Assistants" description="Number of recent assistant turns to always keep">
            <Input type="number" value={defaults.contextPruning?.keepLastAssistants ?? ""} onChange={(v) => updatePath(["agents", "defaults", "contextPruning", "keepLastAssistants"], v)} />
          </SettingRow>
          <SettingRow label="Compaction Mode" description="How context compaction works">
            <Select value={defaults.compaction?.mode ?? "default"} options={["default", "safeguard"]} onChange={(v) => updatePath(["agents", "defaults", "compaction", "mode"], v)} />
          </SettingRow>
          <SettingRow label="Max History Share" description="Maximum share of context window for history (0.1-0.9)">
            <Input type="number" value={defaults.compaction?.maxHistoryShare ?? 0.5} onChange={(v) => updatePath(["agents", "defaults", "compaction", "maxHistoryShare"], v)} />
          </SettingRow>
          <SettingRow label="Memory Flush" description="Enable memory flush on compaction">
            <Toggle checked={defaults.compaction?.memoryFlush?.enabled ?? false} onChange={(v) => updatePath(["agents", "defaults", "compaction", "memoryFlush", "enabled"], v)} />
          </SettingRow>
        </Card>

        {/* ── Web Tools ── */}
        <Card title="Web Search & Fetch">
          <SettingRow label="Search Enabled" description="Enable web search tool">
            <Toggle checked={webSearch.enabled ?? true} onChange={(v) => updatePath(["tools", "web", "search", "enabled"], v)} />
          </SettingRow>
          <SettingRow label="Search Provider" description="Web search backend">
            <Select value={webSearch.provider ?? "brave"} options={["brave", "perplexity"]} onChange={(v) => updatePath(["tools", "web", "search", "provider"], v)} />
          </SettingRow>
          <SettingRow label="Search Max Results" description="Maximum number of search results to return">
            <Input type="number" value={webSearch.maxResults ?? ""} onChange={(v) => updatePath(["tools", "web", "search", "maxResults"], v)} />
          </SettingRow>
          <SettingRow label="Search Timeout (sec)" description="Search request timeout in seconds">
            <Input type="number" value={webSearch.timeoutSeconds ?? ""} onChange={(v) => updatePath(["tools", "web", "search", "timeoutSeconds"], v)} />
          </SettingRow>
          <SettingRow label="Search Cache TTL (min)" description="Cache search results for N minutes">
            <Input type="number" value={webSearch.cacheTtlMinutes ?? ""} onChange={(v) => updatePath(["tools", "web", "search", "cacheTtlMinutes"], v)} />
          </SettingRow>
          <SettingRow label="Fetch Enabled" description="Enable web fetch tool">
            <Toggle checked={webFetch.enabled ?? true} onChange={(v) => updatePath(["tools", "web", "fetch", "enabled"], v)} />
          </SettingRow>
          <SettingRow label="Fetch Max Chars" description="Maximum characters to return from fetched pages">
            <Input type="number" value={webFetch.maxChars ?? ""} onChange={(v) => updatePath(["tools", "web", "fetch", "maxChars"], v)} />
          </SettingRow>
          <SettingRow label="Fetch Timeout (sec)" description="Fetch request timeout in seconds">
            <Input type="number" value={webFetch.timeoutSeconds ?? ""} onChange={(v) => updatePath(["tools", "web", "fetch", "timeoutSeconds"], v)} />
          </SettingRow>
          <SettingRow label="Readability" description="Use readability to extract article content">
            <Toggle checked={webFetch.readability ?? true} onChange={(v) => updatePath(["tools", "web", "fetch", "readability"], v)} />
          </SettingRow>
          <SettingRow label="Fetch Cache TTL (min)" description="Cache fetched pages for N minutes">
            <Input type="number" value={webFetch.cacheTtlMinutes ?? ""} onChange={(v) => updatePath(["tools", "web", "fetch", "cacheTtlMinutes"], v)} />
          </SettingRow>
          <SettingRow label="Max Redirects" description="Maximum number of HTTP redirects to follow">
            <Input type="number" value={webFetch.maxRedirects ?? ""} onChange={(v) => updatePath(["tools", "web", "fetch", "maxRedirects"], v)} />
          </SettingRow>
        </Card>

        {/* ── Commands ── */}
        <Card title="Commands">
          <SettingRow label="Native Commands" description="Register native slash commands">
            <Select value={String(commands.native ?? "auto")} options={["auto", "true", "false"]} onChange={(v) => updatePath(["commands", "native"], v === "auto" ? v : v === "true")} />
          </SettingRow>
          <SettingRow label="Native Skills" description="Register skills as native commands">
            <Select value={String(commands.nativeSkills ?? "auto")} options={["auto", "true", "false"]} onChange={(v) => updatePath(["commands", "nativeSkills"], v === "auto" ? v : v === "true")} />
          </SettingRow>
          <SettingRow label="Text Commands" description="Allow text-based commands">
            <Toggle checked={commands.text ?? true} onChange={(v) => updatePath(["commands", "text"], v)} />
          </SettingRow>
          <SettingRow label="Bash Commands" description="Allow bash command execution via commands">
            <Toggle checked={commands.bash ?? false} onChange={(v) => updatePath(["commands", "bash"], v)} />
          </SettingRow>
          <SettingRow label="Config Command" description="Allow /config command">
            <Toggle checked={commands.config ?? true} onChange={(v) => updatePath(["commands", "config"], v)} />
          </SettingRow>
          <SettingRow label="Debug Command" description="Allow /debug command">
            <Toggle checked={commands.debug ?? true} onChange={(v) => updatePath(["commands", "debug"], v)} />
          </SettingRow>
          <SettingRow label="Restart Command" description="Allow /restart command">
            <Toggle checked={commands.restart ?? true} onChange={(v) => updatePath(["commands", "restart"], v)} />
          </SettingRow>
        </Card>

        {/* ── Browser ── */}
        <Card title="Browser">
          <SettingRow label="Enabled" description="Enable browser tool for agents">
            <Toggle checked={browser.enabled ?? true} onChange={(v) => updatePath(["browser", "enabled"], v)} />
          </SettingRow>
          <SettingRow label="Evaluate Enabled" description="Allow browser JavaScript evaluation">
            <Toggle checked={browser.evaluateEnabled ?? true} onChange={(v) => updatePath(["browser", "evaluateEnabled"], v)} />
          </SettingRow>
          <SettingRow label="Headless" description="Run browser in headless mode">
            <Toggle checked={browser.headless ?? false} onChange={(v) => updatePath(["browser", "headless"], v)} />
          </SettingRow>
          <SettingRow label="Attach Only" description="Only attach to existing browser, don't launch">
            <Toggle checked={browser.attachOnly ?? false} onChange={(v) => updatePath(["browser", "attachOnly"], v)} />
          </SettingRow>
          <SettingRow label="Default Profile" description="Default browser profile to use">
            <Input value={browser.defaultProfile ?? "chrome"} onChange={(v) => updatePath(["browser", "defaultProfile"], v)} />
          </SettingRow>
          <SettingRow label="CDP URL" description="Remote Chrome DevTools Protocol endpoint">
            <Input value={browser.cdpUrl ?? ""} onChange={(v) => updatePath(["browser", "cdpUrl"], v)} wide />
          </SettingRow>
          <SettingRow label="Executable Path" description="Custom browser binary path">
            <Input value={browser.executablePath ?? ""} onChange={(v) => updatePath(["browser", "executablePath"], v)} wide />
          </SettingRow>
          <SettingRow label="Accent Color" description="Browser highlight color (hex)">
            <Input value={browser.color ?? "#FF4500"} onChange={(v) => updatePath(["browser", "color"], v)} />
          </SettingRow>
        </Card>

        {/* ── Gateway ── */}
        <Card title="Gateway">
          <SettingRow label="Mode" description="Gateway operating mode">
            <Select value={gateway.mode ?? "local"} options={["local", "remote"]} onChange={(v) => updatePath(["gateway", "mode"], v)} />
          </SettingRow>
          <SettingRow label="Port" description="Gateway server port">
            <Input type="number" value={gateway.port ?? 18789} onChange={(v) => updatePath(["gateway", "port"], v)} />
          </SettingRow>
          <SettingRow label="Bind" description="Network interface to bind to">
            <Select value={gateway.bind ?? "auto"} options={["auto", "lan", "loopback", "tailnet", "custom"]} onChange={(v) => updatePath(["gateway", "bind"], v)} />
          </SettingRow>
          <SettingRow label="Auth Mode" description="Authentication mode for gateway access">
            <Select value={gateway.auth?.mode ?? "token"} options={["token", "password"]} onChange={(v) => updatePath(["gateway", "auth", "mode"], v)} />
          </SettingRow>
          <SettingRow label="Control UI" description="Enable the built-in gateway control panel">
            <Toggle checked={gateway.controlUi?.enabled ?? true} onChange={(v) => updatePath(["gateway", "controlUi", "enabled"], v)} />
          </SettingRow>
          <SettingRow label="TLS Enabled" description="Enable HTTPS/TLS">
            <Toggle checked={gateway.tls?.enabled ?? false} onChange={(v) => updatePath(["gateway", "tls", "enabled"], v)} />
          </SettingRow>
          <SettingRow label="TLS Auto-Generate" description="Automatically generate self-signed certificates">
            <Toggle checked={gateway.tls?.autoGenerate ?? true} onChange={(v) => updatePath(["gateway", "tls", "autoGenerate"], v)} />
          </SettingRow>
          <SettingRow label="Reload Mode" description="How config reloads are handled">
            <Select value={gateway.reload?.mode ?? "hybrid"} options={["off", "restart", "hot", "hybrid"]} onChange={(v) => updatePath(["gateway", "reload", "mode"], v)} />
          </SettingRow>
          <SettingRow label="mDNS" description="Local network discovery mode">
            <Select value={gateway.discovery?.mdns?.mode ?? "off"} options={["off", "minimal", "full"]} onChange={(v) => updatePath(["gateway", "discovery", "mdns", "mode"], v)} />
          </SettingRow>
        </Card>

        {/* ── Cron ── */}
        <Card title="Cron System">
          <SettingRow label="Enabled" description="Enable the cron job scheduler">
            <Toggle checked={cron.enabled ?? true} onChange={(v) => updatePath(["cron", "enabled"], v)} />
          </SettingRow>
          <SettingRow label="Max Concurrent Runs" description="Maximum cron jobs running simultaneously">
            <Input type="number" value={cron.maxConcurrentRuns ?? ""} onChange={(v) => updatePath(["cron", "maxConcurrentRuns"], v)} />
          </SettingRow>
        </Card>

        {/* ── Skills ── */}
        <Card title="Skills">
          <SettingRow label="Watch for Changes" description="Auto-reload skills when files change">
            <Toggle checked={skills.load?.watch ?? false} onChange={(v) => updatePath(["skills", "load", "watch"], v)} />
          </SettingRow>
          <SettingRow label="Watch Debounce (ms)" description="Delay before reloading after a change">
            <Input type="number" value={skills.load?.watchDebounceMs ?? ""} onChange={(v) => updatePath(["skills", "load", "watchDebounceMs"], v)} />
          </SettingRow>
          <SettingRow label="Node Package Manager" description="Package manager for skill installation">
            <Select value={skills.install?.nodeManager ?? "npm"} options={["npm", "pnpm", "yarn", "bun"]} onChange={(v) => updatePath(["skills", "install", "nodeManager"], v)} />
          </SettingRow>
          <SettingRow label="Prefer Brew" description="Prefer Homebrew for CLI skill dependencies">
            <Toggle checked={skills.install?.preferBrew ?? false} onChange={(v) => updatePath(["skills", "install", "preferBrew"], v)} />
          </SettingRow>
        </Card>

        {/* ── Plugins ── */}
        <Card title="Plugins">
          <SettingRow label="Enabled" description="Master switch for the plugin system">
            <Toggle checked={plugins.enabled ?? true} onChange={(v) => updatePath(["plugins", "enabled"], v)} />
          </SettingRow>
          <SettingRow label="iMessage Plugin" description="Enable the iMessage plugin">
            <Toggle checked={plugins.entries?.imessage?.enabled ?? true} onChange={(v) => updatePath(["plugins", "entries", "imessage", "enabled"], v)} />
          </SettingRow>
        </Card>

        {/* ── Logging ── */}
        <Card title="Logging">
          <SettingRow label="Level" description="Minimum log level">
            <Select value={logging.level ?? "info"} options={["silent", "fatal", "error", "warn", "info", "debug", "trace"]} onChange={(v) => updatePath(["logging", "level"], v)} />
          </SettingRow>
          <SettingRow label="Console Level" description="Console-specific log level override">
            <Select value={logging.consoleLevel ?? ""} options={["", "silent", "fatal", "error", "warn", "info", "debug", "trace"]} onChange={(v) => updatePath(["logging", "consoleLevel"], v || undefined)} />
          </SettingRow>
          <SettingRow label="Console Style" description="Console output format">
            <Select value={logging.consoleStyle ?? "pretty"} options={["pretty", "compact", "json"]} onChange={(v) => updatePath(["logging", "consoleStyle"], v)} />
          </SettingRow>
          <SettingRow label="Redact Sensitive" description="Redact sensitive data in tool logs">
            <Select value={logging.redactSensitive ?? "tools"} options={["off", "tools"]} onChange={(v) => updatePath(["logging", "redactSensitive"], v)} />
          </SettingRow>
          <SettingRow label="Log File" description="Path to write logs to">
            <Input value={logging.file ?? ""} onChange={(v) => updatePath(["logging", "file"], v)} wide />
          </SettingRow>
        </Card>

        {/* ── UI ── */}
        <Card title="UI & Identity">
          <SettingRow label="Accent Color" description="Accent color for the control UI (hex)">
            <Input value={ui.seamColor ?? ""} onChange={(v) => updatePath(["ui", "seamColor"], v)} />
          </SettingRow>
          <SettingRow label="Assistant Name" description="Display name for the assistant">
            <Input value={ui.assistant?.name ?? ""} onChange={(v) => updatePath(["ui", "assistant", "name"], v)} />
          </SettingRow>
          <SettingRow label="Assistant Avatar" description="Emoji, text, or image URL for the avatar">
            <Input value={ui.assistant?.avatar ?? ""} onChange={(v) => updatePath(["ui", "assistant", "avatar"], v)} wide />
          </SettingRow>
        </Card>

        {/* ── Update ── */}
        <Card title="Updates">
          <SettingRow label="Channel" description="Release channel for auto-updates">
            <Select value={update.channel ?? "stable"} options={["stable", "beta", "dev"]} onChange={(v) => updatePath(["update", "channel"], v)} />
          </SettingRow>
          <SettingRow label="Check on Start" description="Check for updates when gateway starts">
            <Toggle checked={update.checkOnStart ?? true} onChange={(v) => updatePath(["update", "checkOnStart"], v)} />
          </SettingRow>
        </Card>

      </div>
    </div>
  );
}
