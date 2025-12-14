'use client';

import { Badge } from '@/components/ui/badge';
import { WifiOff, GitCommit, Calendar, User, Database, Shield, CloudOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface CommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export default function SplashFooter() {
  const repoUrl = 'https://github.com/gurkanfikretgunak/masterfabric-thermal-printer';
  const authorName = 'gurkanfikretgunak';
  const authorUrl = `https://github.com/${authorName}`;
  
  const [commitInfo, setCommitInfo] = useState<CommitInfo | null>(null);
  const [commitsHistory, setCommitsHistory] = useState<CommitInfo[]>([]);
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [offlineDialogOpen, setOfflineDialogOpen] = useState(false);
  
  useEffect(() => {
    // Try to get commit info from environment variable first (set at build time)
    const envHash = process.env.NEXT_PUBLIC_COMMIT_HASH;
    const envMessage = process.env.NEXT_PUBLIC_COMMIT_MESSAGE;
    const envAuthor = process.env.NEXT_PUBLIC_COMMIT_AUTHOR;
    const envDate = process.env.NEXT_PUBLIC_COMMIT_DATE;
    const envCommitsHistory = process.env.NEXT_PUBLIC_COMMITS_HISTORY;
    
    if (envHash && envHash !== 'main' && envHash.length >= 7) {
      const latestCommit: CommitInfo = {
        hash: envHash,
        shortHash: envHash.substring(0, 7),
        message: envMessage || 'Latest commit',
        author: envAuthor || authorName,
        date: envDate || new Date().toISOString(),
        url: `${repoUrl}/commit/${envHash}`,
      };
      
      setCommitInfo(latestCommit);
      
      // Parse commits history if available
      if (envCommitsHistory) {
        try {
          const parsedCommits = JSON.parse(envCommitsHistory.replace(/\\"/g, '"'));
          const commitsWithUrls = parsedCommits.map((commit: any) => ({
            hash: commit.hash,
            shortHash: commit.shortHash,
            message: commit.message,
            author: commit.author,
            date: commit.date,
            url: `${repoUrl}/commit/${commit.hash}`,
          }));
          setCommitsHistory(commitsWithUrls);
        } catch (e) {
          // If parsing fails, just use the latest commit
          setCommitsHistory([latestCommit]);
        }
      } else {
        setCommitsHistory([latestCommit]);
      }
    } else {
      // Fallback: show main branch info
      const fallbackCommit: CommitInfo = {
        hash: 'main',
        shortHash: 'main',
        message: 'Latest version',
        author: authorName,
        date: new Date().toISOString(),
        url: `${repoUrl}`,
      };
      setCommitInfo(fallbackCommit);
      setCommitsHistory([fallbackCommit]);
    }
  }, [authorName, repoUrl]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      // Show relative time like GitHub
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      
      // Otherwise show formatted date
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-md border-t border-border pt-4 pb-2">
      <div className="flex items-center justify-center flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {/* Commit Hash with Dialog */}
        {commitInfo && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                setCommitDialogOpen(true);
              }}
              className="hover:text-foreground transition-colors font-mono flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 text-xs text-muted-foreground"
            >
              <GitCommit className="h-3 w-3" />
              {commitInfo.shortHash}
            </button>
            
            {/* Commit History Dialog */}
            <AlertDialog open={commitDialogOpen} onOpenChange={setCommitDialogOpen}>
              <AlertDialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <GitCommit className="h-4 w-4" />
                    Recent Commits
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                      {commitsHistory.length > 0 ? `${commitsHistory.length} commits` : ''}
                    </span>
                  </AlertDialogTitle>
                </AlertDialogHeader>
                
                {/* Commits List */}
                <div className="px-0 py-3 space-y-0 overflow-y-auto flex-1">
                  {commitsHistory.length > 0 ? (
                    commitsHistory.map((commit, index) => (
                      <div
                        key={commit.hash}
                        className={`px-4 py-2.5 ${index !== commitsHistory.length - 1 ? 'border-b border-border' : ''}`}
                      >
                        <a
                          href={commit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group/item hover:bg-accent -mx-2 px-2 rounded transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Commit Hash and Message */}
                          <div className="flex items-start gap-2 mb-1.5">
                            <span className="text-xs font-mono text-primary group-hover/item:underline flex-shrink-0">
                              {commit.shortHash}
                            </span>
                            <p className="text-sm text-foreground leading-relaxed break-words flex-1">
                              {commit.message}
                            </p>
                          </div>
                          
                          {/* Commit Details */}
                          <div className="flex flex-wrap items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="font-medium">{commit.author}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(commit.date)}</span>
                            </div>
                          </div>
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 px-4">
                      <p className="text-sm text-muted-foreground">No commit history available</p>
                    </div>
                  )}
                </div>
                
                {/* Dialog Footer */}
                <div className="border-t border-border pt-3 mt-2">
                  <a
                    href={`${repoUrl}/commits/main`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View all commits on GitHub
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
        {commitInfo && <span>•</span>}
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
        {/* Offline Badge with Dialog */}
        <Badge 
          variant="outline" 
          className="cursor-pointer flex items-center gap-1.5 hover:bg-accent transition-colors"
          onClick={() => setOfflineDialogOpen(true)}
        >
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </Badge>
        
        {/* Offline Info Dialog */}
        <AlertDialog open={offlineDialogOpen} onOpenChange={setOfflineDialogOpen}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <CloudOff className="h-4 w-4" />
                Offline Project
              </AlertDialogTitle>
            </AlertDialogHeader>
            
            {/* Dialog Body */}
            <div className="space-y-4 py-2">
              {/* Main Description */}
              <div>
                <p className="text-sm text-foreground leading-relaxed">
                  This is a fully offline project. It does not connect to any external services, APIs, or servers.
                </p>
              </div>
              
              {/* Features List */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-start gap-2 text-sm text-foreground">
                  <Database className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>All data is stored locally on your device using IndexedDB</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-foreground">
                  <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>No network requests or external API calls</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-foreground">
                  <WifiOff className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>Works completely offline without internet connection</span>
                </div>
              </div>
            </div>
            
            {/* Dialog Footer */}
            <div className="border-t border-border pt-3 mt-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Privacy First:</span> Your data never leaves your device
              </p>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
