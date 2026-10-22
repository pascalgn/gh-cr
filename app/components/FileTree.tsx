import type { ChangedFile, FileChangeStatus } from "../types";

import "./FileTree.css";

interface FileTreeProps {
  files: ChangedFile[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

const STATUS_LABEL: Record<FileChangeStatus, string> = {
  added: "A",
  modified: "M",
  removed: "D",
  renamed: "R",
};

/** Flat list of the changed files, with an added/modified/removed/renamed marker. */
export function FileTree({ files, selectedPath, onSelect }: FileTreeProps) {
  return (
    <nav className="fileTree" aria-label="Changed files">
      {files.length === 0 ? (
        <p className="fileTree-empty">No changed files.</p>
      ) : (
        <ul className="fileTree-list">
          {files.map((file) => (
            <li key={file.path}>
              <button
                type="button"
                className={
                  file.path === selectedPath
                    ? "fileTree-item fileTree-item--selected"
                    : "fileTree-item"
                }
                onClick={() => onSelect(file.path)}
                title={
                  file.previousPath === null
                    ? file.path
                    : `${file.previousPath} → ${file.path}`
                }
              >
                <span
                  className={`fileTree-status fileTree-status--${file.status}`}
                >
                  {STATUS_LABEL[file.status]}
                </span>
                <span className="fileTree-path">{file.path}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
