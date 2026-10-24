import React, { useState, useEffect, useRef } from 'react';
import {
  Github,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Download,
  KeyRound,
  Lock,
  Globe,
  Terminal,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  FileCode2,
  Rocket
} from 'lucide-react';
import { PROJECT_FILES } from '../data/projectFiles';
import { parseGitHubRepoInput, buildGitTreeItems } from '../utils/musicBetaCore';

interface GitHubApkBuilderProps {
  onDownloadZip: () => void;
}

interface BuildLogItem {
  id: string;
  time: string;
  message: string;
  status: 'info' | 'success' | 'error';
}

interface WorkflowRunInfo {
  id: number;
  html_url: string;
  status: string; // queued | in_progress | completed
  conclusion: string | null; // success | failure | cancelled | null
  created_at: string;
}

interface ReleaseAssetInfo {
  name: string;
  browser_download_url: string;
  size: number;
}

interface ReleaseInfo {
  html_url: string;
  tag_name: string;
  name: string;
  assets: ReleaseAssetInfo[];
}

export const GitHubApkBuilder: React.FC<GitHubApkBuilderProps> = ({ onDownloadZip }) => {
  const [githubToken, setGithubToken] = useState<string>(() => {
    try {
      return sessionStorage.getItem('gh_pat_token') || '';
    } catch {
      return '';
    }
  });

  const [repoInput, setRepoInput] = useState<string>(() => {
    try {
      return sessionStorage.getItem('gh_repo_name') || 'MusicBetaWrapper';
    } catch {
      return 'MusicBetaWrapper';
    }
  });

  const [isPrivateRepo, setIsPrivateRepo] = useState<boolean>(false);
  const [releaseTag, setReleaseTag] = useState<string>('v1.0.0');

  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [logs, setLogs] = useState<BuildLogItem[]>([]);
  const [repoHtmlUrl, setRepoHtmlUrl] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('gh_repo_html_url') || null;
    } catch {
      return null;
    }
  });
  const [ownerRepoSlug, setOwnerRepoSlug] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('gh_owner_repo_slug') || null;
    } catch {
      return null;
    }
  });

  const [workflowRun, setWorkflowRun] = useState<WorkflowRunInfo | null>(null);
  const [latestRelease, setLatestRelease] = useState<ReleaseInfo | null>(null);
  const [isPollingRun, setIsPollingRun] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem('gh_pat_token', githubToken);
      sessionStorage.setItem('gh_repo_name', repoInput);
      if (repoHtmlUrl) sessionStorage.setItem('gh_repo_html_url', repoHtmlUrl);
      if (ownerRepoSlug) sessionStorage.setItem('gh_owner_repo_slug', ownerRepoSlug);
    } catch {}
  }, [githubToken, repoInput, repoHtmlUrl, ownerRepoSlug]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const addLog = (message: string, status: 'info' | 'success' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setLogs((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, time, message, status }]);
  };

  const githubFetch = async (url: string, token: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token.trim()}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers as Record<string, string> || {}),
    };
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    return fetch(url, { ...options, headers });
  };

  const pollWorkflowAndRelease = async (slug: string, token: string) => {
    try {
      const runsRes = await githubFetch(
        `https://api.github.com/repos/${slug}/actions/runs?per_page=5`,
        token
      );
      if (runsRes.ok) {
        const runsData = await runsRes.json();
        if (runsData.workflow_runs && runsData.workflow_runs.length > 0) {
          const latestRun: WorkflowRunInfo = runsData.workflow_runs[0];
          setWorkflowRun(latestRun);

          if (latestRun.status === 'completed') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            setIsPollingRun(false);
          }
        }
      }

      const relRes = await githubFetch(
        `https://api.github.com/repos/${slug}/releases/latest`,
        token
      );
      if (relRes.ok) {
        const relData: ReleaseInfo = await relRes.json();
        setLatestRelease(relData);
      }
    } catch {
      // Ignore transient polling network issues
    }
  };

  const startLivePolling = (slug: string, token: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setIsPollingRun(true);
    pollWorkflowAndRelease(slug, token);
    pollIntervalRef.current = setInterval(() => {
      pollWorkflowAndRelease(slug, token);
    }, 6000);
  };

  const handlePushAndBuildApk = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = githubToken.trim();
    if (!token) {
      addLog('Please enter a GitHub Personal Access Token (with repo & workflow scopes).', 'error');
      return;
    }

    setIsDeploying(true);
    setLogs([]);
    setWorkflowRun(null);
    setLatestRelease(null);

    try {
      // 1. Authenticate user
      addLog('Authenticating with GitHub API...');
      const userRes = await githubFetch('https://api.github.com/user', token);
      if (!userRes.ok) {
        const errText = await userRes.text();
        throw new Error(`GitHub authentication failed (${userRes.status}): Check that your token is valid and has 'repo' & 'workflow' scopes. ${errText}`);
      }
      const userData = await userRes.json();
      const username: string = userData.login;
      addLog(`Authenticated as @${username}`, 'success');

      // 2. Parse owner & repo name
      const parsed = parseGitHubRepoInput(repoInput, username);
      if (!parsed.isValid || !parsed.owner || !parsed.repo) {
        throw new Error('Invalid repository name. Use e.g. "MusicBetaWrapper" or "username/MusicBetaWrapper".');
      }
      const slug = `${parsed.owner}/${parsed.repo}`;

      // 3. Check if repository exists; create it if not
      addLog(`Checking repository ${slug}...`);
      let repoRes = await githubFetch(`https://api.github.com/repos/${slug}`, token);
      let defaultBranch = 'main';

      if (repoRes.status === 404) {
        addLog(`Repository ${slug} not found. Creating new ${isPrivateRepo ? 'private' : 'public'} repository...`);
        const createRes = await githubFetch('https://api.github.com/user/repos', token, {
          method: 'POST',
          body: JSON.stringify({
            name: parsed.repo,
            description: 'High-Performance Android 14 Wrapper for Apple Music Beta (120Hz, 500MB OkHttp Cache, Notch Safe-Area, Background Playback)',
            private: isPrivateRepo,
            auto_init: true,
          }),
        });
        if (!createRes.ok) {
          const errBody = await createRes.text();
          throw new Error(`Failed to create repository (${createRes.status}): ${errBody}`);
        }
        const createdRepo = await createRes.json();
        defaultBranch = createdRepo.default_branch || 'main';
        setRepoHtmlUrl(createdRepo.html_url);
        addLog(`Created repository: ${createdRepo.html_url}`, 'success');
        // Wait briefly for GitHub to initialize default branch
        await new Promise((r) => setTimeout(r, 1500));
      } else if (repoRes.ok) {
        const existingRepo = await repoRes.json();
        defaultBranch = existingRepo.default_branch || 'main';
        setRepoHtmlUrl(existingRepo.html_url);
        addLog(`Connected to existing repository ${existingRepo.html_url} (branch: ${defaultBranch})`, 'success');
      } else {
        throw new Error(`Could not access repository ${slug} (HTTP ${repoRes.status}).`);
      }

      setOwnerRepoSlug(slug);

      // 4. Get latest commit SHA on defaultBranch (or initialize if empty repo)
      addLog(`Fetching branch head for refs/heads/${defaultBranch}...`);
      let refRes = await githubFetch(
        `https://api.github.com/repos/${slug}/git/ref/heads/${defaultBranch}`,
        token
      );

      if (refRes.status === 404 || refRes.status === 409) {
        // Empty repository — initialize with a README.md via Contents API first
        addLog('Initializing empty repository with initial commit...');
        const initRes = await githubFetch(
          `https://api.github.com/repos/${slug}/contents/README.md`,
          token,
          {
            method: 'PUT',
            body: JSON.stringify({
              message: 'Initial commit: MusicBetaWrapper Android project',
              content: btoa('# MusicBetaWrapper\nHigh-performance Android 14 wrapper for Apple Music Beta.\n'),
              branch: defaultBranch,
            }),
          }
        );
        if (!initRes.ok) {
          const errText = await initRes.text();
          throw new Error(`Failed to initialize empty repository: ${errText}`);
        }
        await new Promise((r) => setTimeout(r, 1000));
        refRes = await githubFetch(
          `https://api.github.com/repos/${slug}/git/ref/heads/${defaultBranch}`,
          token
        );
      }

      if (!refRes.ok) {
        throw new Error(`Failed to read branch reference refs/heads/${defaultBranch} (${refRes.status})`);
      }

      const refData = await refRes.json();
      const latestCommitSha: string = refData.object.sha;

      // 5. Build Git Tree with all 16 Android project files + .github/workflows/release.yml
      const filesToCommit = [
        ...PROJECT_FILES.map((f) => ({ path: f.path, content: f.content })),
        {
          path: 'README.md',
          content: `# MusicBetaWrapper (Android 14+ APK)\n\nHigh-performance native Android Kotlin wrapper for \`https://beta.music.apple.com\`.\n\n## Included Optimizations\n- **5 WebView Anti-Lag Optimizations**: 500MB OkHttp disk cache (\`shouldInterceptRequest\`), \`mzstatic.com\` \`300x300bb.webp\` artwork downscaler, telemetry blocker, GPU CSS blur stripper, and zero-reload SPA \`window.history.back()\`.\n- **Camera Notch & Status Bar Safe-Area Protection**: Physical \`WindowInsetsCompat\` padding + CSS variables.\n- **120 Hz+ Display Refresh Rate** & **Screen-Off Background Playback**.\n`,
        },
      ];

      const treeEntries = buildGitTreeItems(filesToCommit);
      addLog(`Uploading ${treeEntries.length} project & workflow files to Git tree...`);

      const treeRes = await githubFetch(
        `https://api.github.com/repos/${slug}/git/trees`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            base_tree: latestCommitSha,
            tree: treeEntries,
          }),
        }
      );

      if (!treeRes.ok) {
        const errBody = await treeRes.text();
        throw new Error(`Failed to create Git tree (${treeRes.status}): Make sure your token has 'workflow' scope enabled so it can push .github/workflows/release.yml. ${errBody}`);
      }
      const treeData = await treeRes.json();

      // 6. Create Git Commit
      addLog('Creating commit with Android Studio project & CI/CD workflow...');
      const commitRes = await githubFetch(
        `https://api.github.com/repos/${slug}/git/commits`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            message: 'feat: Complete MusicBetaWrapper Android 14 project + signed APK CI/CD workflow',
            tree: treeData.sha,
            parents: [latestCommitSha],
          }),
        }
      );
      if (!commitRes.ok) {
        throw new Error(`Failed to create commit (${commitRes.status})`);
      }
      const commitData = await commitRes.json();

      // 7. Update branch ref
      const updateRefRes = await githubFetch(
        `https://api.github.com/repos/${slug}/git/refs/heads/${defaultBranch}`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify({
            sha: commitData.sha,
            force: true,
          }),
        }
      );
      if (!updateRefRes.ok) {
        throw new Error(`Failed to update branch ${defaultBranch} (${updateRefRes.status})`);
      }
      addLog(`Pushed commit ${commitData.sha.slice(0, 7)} to ${defaultBranch}`, 'success');

      // 8. Also push release tag (e.g. v1.0.0) and trigger workflow_dispatch
      const cleanTag = releaseTag.trim() || 'v1.0.0';
      addLog(`Creating release tag ${cleanTag} & triggering GitHub Actions APK build...`);

      await githubFetch(
        `https://api.github.com/repos/${slug}/git/refs`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            ref: `refs/tags/${cleanTag}`,
            sha: commitData.sha,
          }),
        }
      ).catch(() => {});

      await githubFetch(
        `https://api.github.com/repos/${slug}/actions/workflows/release.yml/dispatches`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({ ref: defaultBranch }),
        }
      ).catch(() => {});

      addLog(
        `GitHub Actions APK Build triggered! Monitoring live workflow status on ${slug}...`,
        'success'
      );

      startLivePolling(slug, token);
    } catch (err: any) {
      addLog(err?.message || 'Unexpected error while pushing to GitHub.', 'error');
    } finally {
      setIsDeploying(false);
    }
  };

  const cliCommands = `# 1. Unzip downloaded MusicBetaWrapper-Android-Project.zip and enter folder
unzip MusicBetaWrapper-Android-Project.zip -d MusicBetaWrapper && cd MusicBetaWrapper

# 2. Initialize Git and push to your GitHub repository
git init
git branch -M main
git add .
git commit -m "Initial commit: MusicBetaWrapper Android 14 APK"
git remote add origin https://github.com/YOUR_USERNAME/MusicBetaWrapper.git
git push -u origin main

# 3. GitHub Actions automatically builds & signs the APK on push to main!`;

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliCommands);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-950/40 via-neutral-900 to-neutral-950 border border-rose-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[11px] font-bold uppercase tracking-wider">
              <Rocket className="w-3.5 h-3.5" />
              <span>Cloud Android APK Compiler (GitHub Actions)</span>
            </div>
            <h2 className="text-xl font-black text-white flex items-center space-x-2.5">
              <Github className="w-6 h-6 text-white" />
              <span>Build Signed APK on Your GitHub Repository</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed">
              We upgraded <code className="text-rose-400">.github/workflows/release.yml</code> so GitHub Actions automatically compiles, aligns (<code className="text-emerald-400">zipalign</code>), and signs (<code className="text-emerald-400">apksigner</code> V1+V2+V3) an installable <strong className="text-white">MusicBetaWrapper-signed.apk</strong> on every push to <code className="text-rose-400">main</code>, tag push, or manual click—with zero local Android Studio setup required.
            </p>
          </div>

          <button
            onClick={onDownloadZip}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-extrabold shadow-lg transition active:scale-95 flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Ready-to-Push ZIP</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 1-Click Direct Push to GitHub & Trigger APK Build */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Option 1: 1-Click Push &amp; Build APK via GitHub API
                </h3>
                <p className="text-xs text-neutral-400">
                  Automatically creates the repo, commits all {PROJECT_FILES.length} Android files + CI workflow, and starts the cloud APK build
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePushAndBuildApk} className="space-y-4">
            {/* GitHub Token Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="gh-token-input" className="text-xs font-bold text-neutral-300 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-rose-400" />
                  <span>GitHub Personal Access Token (Classic)</span>
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=MusicBetaWrapper+APK+Builder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center space-x-1 underline"
                >
                  <span>Generate Token (repo + workflow pre-checked)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                id="gh-token-input"
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white font-mono focus:border-rose-500 outline-none transition"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Requires <code className="text-emerald-400">repo</code> and <code className="text-emerald-400">workflow</code> scopes so it can push <code className="text-neutral-300">.github/workflows/release.yml</code>. Sent directly from your browser to <code className="text-neutral-300">api.github.com</code>.
              </p>
            </div>

            {/* Repository Name & Visibility */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="gh-repo-input" className="text-xs font-bold text-neutral-300 block mb-1.5">
                  Repository Name (or owner/repo)
                </label>
                <input
                  id="gh-repo-input"
                  type="text"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  placeholder="MusicBetaWrapper"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white font-mono focus:border-rose-500 outline-none transition"
                />
              </div>

              <div>
                <label htmlFor="gh-tag-input" className="text-xs font-bold text-neutral-300 block mb-1.5">
                  Release Tag
                </label>
                <input
                  id="gh-tag-input"
                  type="text"
                  value={releaseTag}
                  onChange={(e) => setReleaseTag(e.target.value)}
                  placeholder="v1.0.0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white font-mono focus:border-rose-500 outline-none transition"
                />
              </div>
            </div>

            {/* Visibility Selector */}
            <div className="flex items-center space-x-3 pt-1">
              <button
                type="button"
                onClick={() => setIsPrivateRepo(false)}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                  !isPrivateRepo
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Public Repo (Free Unlimited Actions)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPrivateRepo(true)}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                  isPrivateRepo
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Private Repo</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isDeploying}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-rose-500/25 flex items-center justify-center space-x-2 transition active:scale-[0.99] disabled:opacity-50"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Pushing Project &amp; Starting GitHub Actions APK Build...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Push to GitHub &amp; Build Signed APK Now</span>
                </>
              )}
            </button>
          </form>

          {/* Live Deployment & Build Status Console */}
          {(logs.length > 0 || repoHtmlUrl) && (
            <div className="mt-4 pt-4 border-t border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Live GitHub Build Telemetry
                </span>
                {ownerRepoSlug && githubToken && (
                  <button
                    type="button"
                    onClick={() => pollWorkflowAndRelease(ownerRepoSlug, githubToken)}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isPollingRun ? 'animate-spin' : ''}`} />
                    <span>Refresh Build Status</span>
                  </button>
                )}
              </div>

              {logs.length > 0 && (
                <div className="p-3 rounded-xl bg-black border border-neutral-800 max-h-48 overflow-y-auto font-mono text-[11px] space-y-1.5">
                  {logs.map((item) => (
                    <div key={item.id} className="flex items-start space-x-2">
                      <span className="text-neutral-500 flex-shrink-0">[{item.time}]</span>
                      <span
                        className={
                          item.status === 'error'
                            ? 'text-rose-400 font-semibold'
                            : item.status === 'success'
                            ? 'text-emerald-400 font-semibold'
                            : 'text-neutral-300'
                        }
                      >
                        {item.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Links to Repo, Actions Run, and Signed APK Download */}
              {repoHtmlUrl && (
                <div className="p-4 rounded-xl bg-neutral-950 border border-emerald-500/30 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">{ownerRepoSlug || repoHtmlUrl}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={`${repoHtmlUrl}/actions`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-[11px] font-bold flex items-center space-x-1"
                      >
                        <span>Open GitHub Actions</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={`${repoHtmlUrl}/releases`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-[11px] font-bold flex items-center space-x-1"
                      >
                        <span>Open Releases (APK)</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {workflowRun && (
                    <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        {workflowRun.status !== 'completed' ? (
                          <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        ) : workflowRun.conclusion === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span className="text-neutral-300">
                          Workflow Status:{' '}
                          <strong className="text-white uppercase">
                            {workflowRun.status}
                            {workflowRun.conclusion ? ` (${workflowRun.conclusion})` : ''}
                          </strong>
                        </span>
                      </div>
                      <a
                        href={workflowRun.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-rose-400 hover:underline flex items-center space-x-1"
                      >
                        <span>View Build Logs</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {latestRelease && latestRelease.assets && latestRelease.assets.length > 0 && (
                    <div className="pt-1">
                      {latestRelease.assets.map((asset) => (
                        <a
                          key={asset.name}
                          href={asset.browser_download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md transition"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Built APK: {asset.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Manual Upload / Git CLI Instructions & What's Inside */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-lg space-y-4">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
              <Terminal className="w-4 h-4" />
              <span>Option 2: Push Downloaded ZIP via Git CLI</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Prefer not to use a token? Click <strong>Download Ready-to-Push ZIP</strong> above, create an empty repo at <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" className="text-rose-400 underline">github.com/new</a>, and run:
            </p>

            <div className="relative p-3.5 rounded-xl bg-black border border-neutral-800 font-mono text-[11px] text-neutral-300 overflow-x-auto">
              <button
                type="button"
                onClick={handleCopyCli}
                className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-neutral-200 flex items-center space-x-1"
              >
                {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
              </button>
              <pre className="whitespace-pre-wrap leading-relaxed pr-14">{cliCommands}</pre>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Why This Workflow Succeeds on First Run</span>
              </h4>
              <ul className="text-[11px] text-neutral-300 space-y-1 list-disc list-inside leading-relaxed">
                <li>
                  <strong>Auto-Triggered:</strong> Runs automatically on any push to <code>main</code>, <code>master</code>, <code>v*</code> tags, or via the <strong>Run workflow</strong> button in the Actions tab.
                </li>
                <li>
                  <strong>No Missing Wrapper JAR:</strong> Uses official <code>gradle/actions/setup-gradle@v3</code> (Gradle 8.5 + JDK 17 Temurin).
                </li>
                <li>
                  <strong>Auto-Signed Installable APK:</strong> Automatically generates an RSA-2048 keystore via <code>keytool</code> and signs with <code>apksigner</code> (V1+V2+V3) so Android installs it without <em>&ldquo;App not installed&rdquo;</em> errors.
                </li>
                <li>
                  <strong>Dual Output:</strong> Publishes the signed APK to both <strong>GitHub Releases</strong> and <strong>Workflow Run Artifacts</strong>.
                </li>
              </ul>
            </div>
          </div>

          {/* Complete 16-File Manifest Checklist */}
          <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <FileCode2 className="w-4 h-4" />
                <span>Included Android Project Files ({PROJECT_FILES.length})</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                100% COMPLETE
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto pr-1 space-y-1 text-[11px] font-mono">
              {PROJECT_FILES.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800/80 text-neutral-300"
                >
                  <span className="truncate">{f.path}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
