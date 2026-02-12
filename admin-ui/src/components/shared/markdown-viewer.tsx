export function MarkdownViewer({ content }: { content: string }) {
  return (
    <pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed p-4 bg-secondary rounded-md overflow-auto">
      {content}
    </pre>
  );
}
