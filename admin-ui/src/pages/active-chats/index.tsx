import { useState, useEffect } from "react";
import { useTextProcessorWatchedChats, useExpireWatchedChat } from "../../hooks/use-api";
import { X } from "lucide-react";

function countdown(expiresAt: string): string {
  const remaining = Math.floor(
    (new Date(expiresAt).getTime() - Date.now()) / 1000
  );
  if (remaining <= 0) return "expired";
  const minutes = Math.floor(remaining / 60);
  if (minutes < 60) return `${minutes}m left`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m left` : `${hours}h left`;
}

export function ActiveChatsIndex() {
  const { data: watchedChats } = useTextProcessorWatchedChats();
  const expireMutation = useExpireWatchedChat();
  const [, setTick] = useState(0);

  // Refresh countdown every 30s
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pt-6">
      <h1 className="text-lg font-semibold mb-6">Active Chats</h1>

      <div className="space-y-1.5">
        {watchedChats?.map((chat: any) => (
          <div
            key={chat.chat_id}
            className="bg-card border rounded-lg px-4 py-2.5 flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                  chat.permanent ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              <span className="font-medium">
                {chat.context || `Chat ${chat.chat_id}`}
              </span>
              {!chat.permanent && (
                <span className="text-xs text-muted-foreground">
                  #{chat.chat_id}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {chat.permanent ? (
                <span className="text-xs font-medium text-green-500">
                  always
                </span>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground">
                    {chat.expires_at ? countdown(chat.expires_at) : ""}
                  </span>
                  <button
                    onClick={() => expireMutation.mutate(chat.chat_id)}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                    force expire
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
