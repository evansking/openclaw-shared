import { useFriends } from "../../hooks/use-api";
import { useNavigate } from "react-router-dom";

export function FriendsIndex() {
  const { data: friends, isLoading } = useFriends();
  const navigate = useNavigate();

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="pt-6">
      <h1 className="text-lg font-semibold mb-4">Friends</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {friends?.map((f: any) => (
          <button
            key={f.slug}
            onClick={() => navigate(`/friends/${f.slug}`)}
            className="bg-card border rounded-lg p-4 text-left hover:border-ring transition-colors"
          >
            <div className="font-medium text-sm">{f.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{f.files.length} file(s)</div>
          </button>
        ))}
      </div>
    </div>
  );
}
