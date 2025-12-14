'use client';

export default function SplashFooter() {
  // These would ideally come from environment variables or build-time data
  const repoUrl = 'https://github.com/gurkanfikretgunak/masterfabric-termal-printer';
  const authorName = 'gurkanfikretgunak';
  const authorUrl = `https://github.com/${authorName}`;
  const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH || 'main';
  const commitShort = commitHash.substring(0, 7);

  return (
    <div className="w-full max-w-md border-t border-border pt-4 pb-2">
      <div className="flex items-center justify-center flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          source
        </a>
        <span>•</span>
        <a
          href={authorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          {authorName}
        </a>
        <span>•</span>
        <a
          href={`${repoUrl}/commit/${commitHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors font-mono"
          title={`Commit: ${commitHash}`}
        >
          {commitShort}
        </a>
      </div>
    </div>
  );
}
