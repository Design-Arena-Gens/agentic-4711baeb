"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Folder,
  File,
  FileText,
  FileCode,
  FileImage,
  FileVideo,
  FileArchive,
  ChevronRight,
  ChevronDown,
  Search,
  Grid3x3,
  List,
  Upload,
  Download,
  Trash2,
  Edit3,
  Copy,
  Scissors,
  FolderPlus,
  FilePlus,
  RefreshCw,
  Star,
  Clock,
  ArrowLeft,
  Home,
  Settings,
  Archive,
  Menu,
  X,
  Eye,
  Code2,
  Save,
  MoreVertical,
  FileJson,
  FileSpreadsheet,
  Music,
  CheckSquare,
  LayoutGrid,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-400">Loading editor...</div>
    </div>
  ),
});

interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  modified: Date;
  content?: string;
  children?: FileItem[];
  starred?: boolean;
  tags?: string[];
  parent?: string;
}

type ViewMode = "grid" | "list" | "details";
type SortBy = "name" | "date" | "size" | "type";

const getFileIcon = (name: string, type: string) => {
  if (type === "folder") return Folder;
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
    case "py":
    case "java":
    case "cpp":
    case "c":
    case "go":
    case "rs":
      return FileCode;
    case "json":
    case "xml":
      return FileJson;
    case "txt":
    case "md":
      return FileText;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "svg":
      return FileImage;
    case "mp4":
    case "avi":
    case "mov":
      return FileVideo;
    case "zip":
    case "rar":
    case "7z":
      return FileArchive;
    case "mp3":
    case "wav":
    case "ogg":
      return Music;
    case "csv":
    case "xlsx":
      return FileSpreadsheet;
    default:
      return File;
  }
};

const getLanguage = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    go: "go",
    rs: "rust",
    json: "json",
    xml: "xml",
    html: "html",
    css: "css",
    scss: "scss",
    md: "markdown",
    sql: "sql",
    sh: "shell",
    yaml: "yaml",
    yml: "yaml",
  };
  return languageMap[ext || ""] || "plaintext";
};

export default function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [clipboard, setClipboard] = useState<{
    items: FileItem[];
    operation: "copy" | "cut" | null;
  }>({ items: [], operation: null });
  const [showEditor, setShowEditor] = useState(false);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: FileItem | null;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const demoFiles: FileItem[] = [
      {
        id: "1",
        name: "Documents",
        type: "folder",
        modified: new Date("2024-01-15"),
        children: [
          {
            id: "1-1",
            name: "Report.txt",
            type: "file",
            size: 2048,
            modified: new Date("2024-01-10"),
            content: "This is a sample report document.\n\nSection 1: Overview\nLorem ipsum dolor sit amet...",
          },
          {
            id: "1-2",
            name: "Notes.md",
            type: "file",
            size: 1024,
            modified: new Date("2024-01-12"),
            content:
              "# My Notes\n\n## Todo List\n- [x] Task 1\n- [ ] Task 2\n- [ ] Task 3\n\n## Ideas\n- Idea A\n- Idea B",
            starred: true,
          },
        ],
      },
      {
        id: "2",
        name: "Projects",
        type: "folder",
        modified: new Date("2024-02-20"),
        starred: true,
        children: [
          {
            id: "2-1",
            name: "app.js",
            type: "file",
            size: 4096,
            modified: new Date("2024-02-18"),
            content: `// Sample JavaScript Application
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`,
          },
          {
            id: "2-2",
            name: "config.json",
            type: "file",
            size: 512,
            modified: new Date("2024-02-15"),
            content: `{
  "name": "my-app",
  "version": "1.0.0",
  "port": 3000,
  "database": {
    "host": "localhost",
    "port": 5432
  }
}`,
          },
          {
            id: "2-3",
            name: "styles.css",
            type: "file",
            size: 2048,
            modified: new Date("2024-02-19"),
            content: `body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}`,
          },
        ],
      },
      {
        id: "3",
        name: "Images",
        type: "folder",
        modified: new Date("2024-03-01"),
        children: [
          {
            id: "3-1",
            name: "photo.jpg",
            type: "file",
            size: 102400,
            modified: new Date("2024-03-01"),
          },
          {
            id: "3-2",
            name: "logo.svg",
            type: "file",
            size: 8192,
            modified: new Date("2024-02-28"),
          },
        ],
      },
      {
        id: "4",
        name: "README.md",
        type: "file",
        size: 1536,
        modified: new Date("2024-01-05"),
        content: `# Welcome to Advanced File Manager

This is a powerful file management system with the following features:

## Features
- 📁 Full folder hierarchy support
- ✂️ Cut, copy, paste operations
- 🔍 Advanced search
- ⭐ Starred files
- 📝 Built-in code editor with syntax highlighting
- 🎨 Multiple view modes (Grid, List, Details)
- 📦 Bulk operations
- 🏷️ File tagging
- 💾 Import/Export capabilities

## Keyboard Shortcuts
- Ctrl+C: Copy
- Ctrl+X: Cut
- Ctrl+V: Paste
- Delete: Remove files
- Ctrl+F: Search
- Ctrl+N: New file
`,
        starred: true,
      },
      {
        id: "5",
        name: "data.json",
        type: "file",
        size: 3072,
        modified: new Date("2024-02-10"),
        content: `{
  "users": [
    { "id": 1, "name": "Alice", "email": "alice@example.com" },
    { "id": 2, "name": "Bob", "email": "bob@example.com" }
  ],
  "settings": {
    "theme": "dark",
    "notifications": true
  }
}`,
      },
    ];
    setFiles(demoFiles);
  }, []);

  const getCurrentFiles = () => {
    let current = files;
    for (const pathPart of currentPath) {
      const folder = current.find((f) => f.name === pathPart && f.type === "folder");
      if (folder?.children) {
        current = folder.children;
      }
    }
    return current;
  };

  const getFilteredAndSortedFiles = () => {
    let result = getCurrentFiles();

    if (searchQuery) {
      result = result.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    result = [...result].sort((a, b) => {
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;

      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return b.modified.getTime() - a.modified.getTime();
        case "size":
          return (b.size || 0) - (a.size || 0);
        case "type":
          return a.name.split(".").pop()!.localeCompare(b.name.split(".").pop()!);
        default:
          return 0;
      }
    });

    return result;
  };

  const handleFileClick = (file: FileItem, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id);
      } else {
        newSelected.add(file.id);
      }
      setSelectedFiles(newSelected);
    } else {
      setSelectedFiles(new Set([file.id]));
    }
  };

  const handleFileDoubleClick = (file: FileItem) => {
    if (file.type === "folder") {
      setCurrentPath([...currentPath, file.name]);
      setSelectedFiles(new Set());
    } else {
      setCurrentFile(file);
      setEditorContent(file.content || "");
      setShowEditor(true);
    }
  };

  const handleBack = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
      setSelectedFiles(new Set());
    }
  };

  const handleHome = () => {
    setCurrentPath([]);
    setSelectedFiles(new Set());
  };

  const createNewFile = () => {
    const fileName = prompt("Enter file name:");
    if (!fileName) return;

    const newFile: FileItem = {
      id: Date.now().toString(),
      name: fileName,
      type: "file",
      size: 0,
      modified: new Date(),
      content: "",
    };

    const updateFiles = (items: FileItem[], path: string[]): FileItem[] => {
      if (path.length === 0) {
        return [...items, newFile];
      }

      return items.map((item) => {
        if (item.name === path[0] && item.type === "folder") {
          return {
            ...item,
            children: updateFiles(item.children || [], path.slice(1)),
          };
        }
        return item;
      });
    };

    setFiles(updateFiles(files, currentPath));
  };

  const createNewFolder = () => {
    const folderName = prompt("Enter folder name:");
    if (!folderName) return;

    const newFolder: FileItem = {
      id: Date.now().toString(),
      name: folderName,
      type: "folder",
      modified: new Date(),
      children: [],
    };

    const updateFiles = (items: FileItem[], path: string[]): FileItem[] => {
      if (path.length === 0) {
        return [...items, newFolder];
      }

      return items.map((item) => {
        if (item.name === path[0] && item.type === "folder") {
          return {
            ...item,
            children: updateFiles(item.children || [], path.slice(1)),
          };
        }
        return item;
      });
    };

    setFiles(updateFiles(files, currentPath));
  };

  const handleCopy = () => {
    const selected = getCurrentFiles().filter((f) => selectedFiles.has(f.id));
    setClipboard({ items: selected, operation: "copy" });
  };

  const handleCut = () => {
    const selected = getCurrentFiles().filter((f) => selectedFiles.has(f.id));
    setClipboard({ items: selected, operation: "cut" });
  };

  const handlePaste = () => {
    if (clipboard.items.length === 0) return;

    const updateFiles = (items: FileItem[], path: string[]): FileItem[] => {
      if (path.length === 0) {
        const newItems =
          clipboard.operation === "copy"
            ? clipboard.items.map((item) => ({
                ...item,
                id: Date.now().toString() + Math.random(),
              }))
            : clipboard.items;
        return [...items, ...newItems];
      }

      return items.map((item) => {
        if (item.name === path[0] && item.type === "folder") {
          return {
            ...item,
            children: updateFiles(item.children || [], path.slice(1)),
          };
        }
        return item;
      });
    };

    setFiles(updateFiles(files, currentPath));

    if (clipboard.operation === "cut") {
      setClipboard({ items: [], operation: null });
    }
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete selected items?")) return;

    const deleteFiles = (items: FileItem[], path: string[]): FileItem[] => {
      if (path.length === 0) {
        return items.filter((item) => !selectedFiles.has(item.id));
      }

      return items.map((item) => {
        if (item.name === path[0] && item.type === "folder") {
          return {
            ...item,
            children: deleteFiles(item.children || [], path.slice(1)),
          };
        }
        return item;
      });
    };

    setFiles(deleteFiles(files, currentPath));
    setSelectedFiles(new Set());
  };

  const handleRename = () => {
    if (selectedFiles.size !== 1) return;
    const fileId = Array.from(selectedFiles)[0];
    const file = getCurrentFiles().find((f) => f.id === fileId);
    if (!file) return;

    const newName = prompt("Enter new name:", file.name);
    if (!newName) return;

    const renameFile = (items: FileItem[], path: string[]): FileItem[] => {
      if (path.length === 0) {
        return items.map((item) => (item.id === fileId ? { ...item, name: newName } : item));
      }

      return items.map((item) => {
        if (item.name === path[0] && item.type === "folder") {
          return {
            ...item,
            children: renameFile(item.children || [], path.slice(1)),
          };
        }
        return item;
      });
    };

    setFiles(renameFile(files, currentPath));
  };

  const toggleStar = (fileId: string) => {
    const toggleStarRecursive = (items: FileItem[]): FileItem[] => {
      return items.map((item) => {
        if (item.id === fileId) {
          return { ...item, starred: !item.starred };
        }
        if (item.children) {
          return { ...item, children: toggleStarRecursive(item.children) };
        }
        return item;
      });
    };

    setFiles(toggleStarRecursive(files));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const newFiles: FileItem[] = Array.from(uploadedFiles).map((file) => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      type: "file",
      size: file.size,
      modified: new Date(file.lastModified),
      content: "",
    }));

    const updateFiles = (items: FileItem[], path: string[]): FileItem[] => {
      if (path.length === 0) {
        return [...items, ...newFiles];
      }

      return items.map((item) => {
        if (item.name === path[0] && item.type === "folder") {
          return {
            ...item,
            children: updateFiles(item.children || [], path.slice(1)),
          };
        }
        return item;
      });
    };

    setFiles(updateFiles(files, currentPath));
  };

  const exportAsZip = async () => {
    const zip = new JSZip();
    const selected = getCurrentFiles().filter((f) => selectedFiles.has(f.id));

    selected.forEach((file) => {
      if (file.type === "file") {
        zip.file(file.name, file.content || "");
      }
    });

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "files.zip");
  };

  const saveEditorContent = () => {
    if (!currentFile) return;

    const updateFileContent = (items: FileItem[]): FileItem[] => {
      return items.map((item) => {
        if (item.id === currentFile.id) {
          return { ...item, content: editorContent, modified: new Date() };
        }
        if (item.children) {
          return { ...item, children: updateFileContent(item.children) };
        }
        return item;
      });
    };

    setFiles(updateFileContent(files));
    setCurrentFile({ ...currentFile, content: editorContent });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showEditor) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "c") handleCopy();
      if ((e.ctrlKey || e.metaKey) && e.key === "x") handleCut();
      if ((e.ctrlKey || e.metaKey) && e.key === "v") handlePaste();
      if (e.key === "Delete") handleDelete();
      if (e.key === "F2") handleRename();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFiles, clipboard, showEditor]);

  const currentFiles = getFilteredAndSortedFiles();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="glass border-b border-gray-700 px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            disabled={currentPath.length === 0}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={handleHome}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Home size={20} />
          </button>
        </div>

        <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "grid" ? "bg-blue-600" : "hover:bg-white/10"
            }`}
          >
            <Grid3x3 size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "list" ? "bg-blue-600" : "hover:bg-white/10"
            }`}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode("details")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "details" ? "bg-blue-600" : "hover:bg-white/10"
            }`}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-64 glass border-r border-gray-700 p-4 flex flex-col gap-2 overflow-y-auto">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Quick Access
            </div>
            <button className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-left">
              <Home size={18} />
              <span>Home</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-left">
              <Star size={18} className="text-yellow-500" />
              <span>Starred</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-left">
              <Clock size={18} />
              <span>Recent</span>
            </button>

            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">
              Sort By
            </div>
            <button
              onClick={() => setSortBy("name")}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                sortBy === "name" ? "bg-blue-600" : "hover:bg-white/10"
              }`}
            >
              <span>Name</span>
            </button>
            <button
              onClick={() => setSortBy("date")}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                sortBy === "date" ? "bg-blue-600" : "hover:bg-white/10"
              }`}
            >
              <span>Date Modified</span>
            </button>
            <button
              onClick={() => setSortBy("size")}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                sortBy === "size" ? "bg-blue-600" : "hover:bg-white/10"
              }`}
            >
              <span>Size</span>
            </button>
            <button
              onClick={() => setSortBy("type")}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                sortBy === "type" ? "bg-blue-600" : "hover:bg-white/10"
              }`}
            >
              <span>Type</span>
            </button>

            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">
              Storage
            </div>
            <div className="px-3 py-2 text-sm text-gray-400">
              <div className="flex justify-between mb-1">
                <span>Used</span>
                <span>2.4 GB / 5 GB</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: "48%" }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumb & Actions */}
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Home size={16} className="text-gray-400" />
              {currentPath.map((path, index) => (
                <div key={index} className="flex items-center gap-2">
                  <ChevronRight size={16} className="text-gray-400" />
                  <button
                    onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                    className="hover:text-blue-400 transition-colors"
                  >
                    {path}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={createNewFolder}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
              >
                <FolderPlus size={16} />
                <span>New Folder</span>
              </button>
              <button
                onClick={createNewFile}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
              >
                <FilePlus size={16} />
                <span>New File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-sm"
              >
                <Upload size={16} />
                <span>Upload</span>
              </button>
              {selectedFiles.size > 0 && (
                <>
                  <button
                    onClick={handleCopy}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Copy (Ctrl+C)"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={handleCut}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Cut (Ctrl+X)"
                  >
                    <Scissors size={18} />
                  </button>
                  <button
                    onClick={handleRename}
                    disabled={selectedFiles.size !== 1}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
                    title="Rename (F2)"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 hover:bg-red-600 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={exportAsZip}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Export as ZIP"
                  >
                    <Archive size={18} />
                  </button>
                </>
              )}
              {clipboard.items.length > 0 && (
                <button
                  onClick={handlePaste}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
                  title="Paste (Ctrl+V)"
                >
                  <span>Paste {clipboard.items.length} item(s)</span>
                </button>
              )}
            </div>
          </div>

          {/* Files Display */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Folder size={64} className="mb-4 opacity-50" />
                <p className="text-lg">No files found</p>
                <p className="text-sm">Create a new file or folder to get started</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {currentFiles.map((file) => {
                  const Icon = getFileIcon(file.name, file.type);
                  const isSelected = selectedFiles.has(file.id);
                  return (
                    <div
                      key={file.id}
                      onClick={(e) => handleFileClick(file, e)}
                      onDoubleClick={() => handleFileDoubleClick(file)}
                      onContextMenu={(e) => handleContextMenu(e, file)}
                      className={`glass p-4 rounded-xl cursor-pointer hover-lift relative ${
                        isSelected ? "ring-2 ring-blue-500" : ""
                      }`}
                    >
                      {file.starred && (
                        <Star
                          size={16}
                          className="absolute top-2 right-2 text-yellow-500 fill-yellow-500"
                        />
                      )}
                      <div className="flex flex-col items-center gap-2">
                        <Icon
                          size={48}
                          className={file.type === "folder" ? "text-blue-400" : "text-gray-400"}
                        />
                        <span className="text-sm text-center break-all line-clamp-2">
                          {file.name}
                        </span>
                        {file.size && (
                          <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-1">
                {currentFiles.map((file) => {
                  const Icon = getFileIcon(file.name, file.type);
                  const isSelected = selectedFiles.has(file.id);
                  return (
                    <div
                      key={file.id}
                      onClick={(e) => handleFileClick(file, e)}
                      onDoubleClick={() => handleFileDoubleClick(file)}
                      onContextMenu={(e) => handleContextMenu(e, file)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors ${
                        isSelected ? "bg-blue-600/20" : ""
                      }`}
                    >
                      <Icon
                        size={20}
                        className={file.type === "folder" ? "text-blue-400" : "text-gray-400"}
                      />
                      <span className="flex-1">{file.name}</span>
                      {file.starred && <Star size={16} className="text-yellow-500 fill-yellow-500" />}
                      <span className="text-sm text-gray-500">{formatDate(file.modified)}</span>
                      {file.size && (
                        <span className="text-sm text-gray-500 w-20 text-right">
                          {formatFileSize(file.size)}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(file.id);
                        }}
                        className="p-1 hover:bg-white/10 rounded"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Size</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Modified</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentFiles.map((file) => {
                      const Icon = getFileIcon(file.name, file.type);
                      const isSelected = selectedFiles.has(file.id);
                      return (
                        <tr
                          key={file.id}
                          onClick={(e) => handleFileClick(file, e)}
                          onDoubleClick={() => handleFileDoubleClick(file)}
                          onContextMenu={(e) => handleContextMenu(e, file)}
                          className={`cursor-pointer hover:bg-white/5 transition-colors border-b border-gray-700/50 ${
                            isSelected ? "bg-blue-600/20" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Icon
                                size={20}
                                className={file.type === "folder" ? "text-blue-400" : "text-gray-400"}
                              />
                              <span>{file.name}</span>
                              {file.starred && (
                                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400 capitalize">{file.type}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {file.size ? formatFileSize(file.size) : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {formatDate(file.modified)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStar(file.id);
                              }}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              <Star
                                size={16}
                                className={file.starred ? "text-yellow-500 fill-yellow-500" : ""}
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed glass rounded-lg py-2 shadow-xl z-50 min-w-[200px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => {
              if (contextMenu.file) handleFileDoubleClick(contextMenu.file);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-3"
          >
            {contextMenu.file?.type === "folder" ? <Eye size={16} /> : <Code2 size={16} />}
            <span>Open</span>
          </button>
          <button
            onClick={() => {
              if (contextMenu.file) toggleStar(contextMenu.file.id);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-3"
          >
            <Star size={16} />
            <span>{contextMenu.file?.starred ? "Unstar" : "Star"}</span>
          </button>
          <div className="border-t border-gray-700 my-2"></div>
          <button
            onClick={() => {
              handleCopy();
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-3"
          >
            <Copy size={16} />
            <span>Copy</span>
          </button>
          <button
            onClick={() => {
              handleCut();
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-3"
          >
            <Scissors size={16} />
            <span>Cut</span>
          </button>
          <button
            onClick={() => {
              handleRename();
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-3"
          >
            <Edit3 size={16} />
            <span>Rename</span>
          </button>
          <div className="border-t border-gray-700 my-2"></div>
          <button
            onClick={() => {
              handleDelete();
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-3 text-red-400"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Code Editor Modal */}
      {showEditor && currentFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <Code2 size={24} className="text-blue-400" />
                <div>
                  <h2 className="text-lg font-semibold">{currentFile.name}</h2>
                  <p className="text-sm text-gray-400">
                    {formatFileSize(currentFile.size)} • Modified {formatDate(currentFile.modified)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveEditorContent}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <Save size={18} />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setShowEditor(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <MonacoEditor
                height="100%"
                language={getLanguage(currentFile.name)}
                theme="vs-dark"
                value={editorContent}
                onChange={(value) => setEditorContent(value || "")}
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: "on",
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
