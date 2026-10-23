import React, { useState } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  Download,
  Search,
  ExternalLink,
  Code2,
  Layers,
  Sparkles,
  Tag
} from 'lucide-react';
import { PROJECT_FILES, ProjectFileItem } from '../data/projectFiles';
import JSZip from 'jszip';

export const CodeExplorer: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem('code_explorer_selected_file');
      if (saved && PROJECT_FILES.some(f => f.id === saved)) return saved;
    } catch {}
    return 'app-build-gradle';
  });

  const [copied, setCopied] = useState<boolean>(false);
  
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    try {
      return sessionStorage.getItem('code_explorer_search_query') || '';
    } catch {
      return '';
    }
  });
  
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // Sync state to sessionStorage whenever changed
  React.useEffect(() => {
    try {
      sessionStorage.setItem('code_explorer_selected_file', selectedFileId);
    } catch {}
  }, [selectedFileId]);

  React.useEffect(() => {
    try {
      sessionStorage.setItem('code_explorer_search_query', searchQuery);
    } catch {}
  }, [searchQuery]);

  const selectedFile = PROJECT_FILES.find((f) => f.id === selectedFileId) || PROJECT_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name.split('/').pop() || 'file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Populate complete Android Studio Project hierarchy
      PROJECT_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });

      // Also add standard root AndroidManifest.xml and Gradle wrapper properties
      const manifestFile = PROJECT_FILES.find((f) => f.id === 'android-manifest');
      if (manifestFile) {
        zip.file('AndroidManifest.xml', manifestFile.content);
      }

      zip.file('gradle/wrapper/gradle-wrapper.properties', `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`);

      zip.file('README.md', `# MusicBetaWrapper (Android 14+)

High-performance native Android wrapper around \`https://beta.music.apple.com\`.

## Features
- **120 Hz+ Refresh Rate**: Forced peak display refresh rate.
- **Background Playback**: Ongoing MediaPlayback ForegroundService with wake & Wi-Fi locks.
- **500 MB Dedicated Cache**: Fast offline buffer.
- **iOS Safari User-Agent**: Renders native Apple Music mobile interface.
- **Automated CI/CD**: \`.github/workflows/release.yml\` builds and publishes APKs on tag push.

## How to Build in Android Studio
1. Open this folder in Android Studio Iguana / Jellyfish (API 34+ SDK installed).
2. Sync Gradle files.
3. Run on a device or emulator with Android 14+ (minSdk 26).
4. For release build: \`./gradlew assembleRelease\`.
`);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MusicBetaWrapper-Android-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Filter files by query
  const filteredFiles = PROJECT_FILES.filter(
    (file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.requirementTags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const lines = selectedFile.content.split('\n');

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <FileCode2 className="w-5 h-5 text-rose-500" />
            <span>Android Studio Project Source Explorer</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Production-ready Kotlin, AndroidManifest, Gradle, XML layouts, and GitHub Actions workflow
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isZipping ? 'Generating Zip...' : 'Download Project (.zip)'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: File List & Code Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* File Navigator Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter project files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500/50 transition"
            />
          </div>

          {/* File Items List */}
          <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredFiles.map((file) => {
              const isSelected = file.id === selectedFileId;
              return (
                <button
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`w-full text-left p-3 rounded-xl border transition flex flex-col space-y-1.5 ${
                    isSelected
                      ? 'bg-rose-500/15 border-rose-500/40 text-white shadow-sm'
                      : 'bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-800/60 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono truncate">{file.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-semibold ${
                        file.language === 'kotlin'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : file.language === 'xml'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : file.language === 'yaml'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {file.language}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-1">{file.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {file.requirementTags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-neutral-400 border border-white/5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Content Viewer */}
        <div className="lg:col-span-8 rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden shadow-xl flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 bg-neutral-900/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-white">{selectedFile.path}</span>
                <span className="text-[10px] font-mono text-neutral-500">
                  {lines.length} lines • {Math.round(selectedFile.content.length / 1024 * 10) / 10} KB
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">{selectedFile.description}</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 transition active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
              <button
                onClick={handleDownloadSingle}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
                title="Download this file"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Syntax Code Container with Line Numbers */}
          <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto font-mono text-xs leading-relaxed select-text bg-neutral-950 text-neutral-200">
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-neutral-900/40">
                    <td className="w-10 pr-4 text-right text-neutral-600 select-none text-[11px]">{idx + 1}</td>
                    <td className="whitespace-pre">
                      <span className={highlightSyntax(line, selectedFile.language)}>{line || ' '}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

function highlightSyntax(line: string, lang: string): string {
  if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('<!--')) {
    return 'text-neutral-500 italic';
  }
  if (line.includes('class ') || line.includes('override fun ') || line.includes('private fun ')) {
    return 'text-purple-300 font-semibold';
  }
  if (line.includes('import ') || line.includes('package ') || line.includes('plugins {')) {
    return 'text-rose-400';
  }
  if (line.includes('val ') || line.includes('var ') || line.includes('const val ')) {
    return 'text-cyan-300';
  }
  if (line.includes('<activity') || line.includes('<service') || line.includes('<uses-permission')) {
    return 'text-amber-300 font-semibold';
  }
  return 'text-neutral-200';
}
