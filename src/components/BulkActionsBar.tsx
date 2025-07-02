import { debug } from '../utils/debug';
import React from 'react';
import { Archive, RotateCcw, Trash2, Move, Tag, X } from 'lucide-react';
import { PulsingDotsLoader } from './LoadingSpinner';
interface BulkActionsBarProps {
    selectedCount: number;
    onArchive?: () => void;
    onRestore?: () => void;
    onDelete?: () => void;
    onMove?: () => void;
    onTag?: () => void;
    onClearSelection: () => void;
    loading?: boolean;
    showArchiveActions?: boolean;
    className?: string;
}
export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({ selectedCount, onArchive, onRestore, onDelete, onMove, onTag, onClearSelection, loading = false, showArchiveActions = true, className = '' }) => {
    return (<div className={`bg-devsuite-primary-subtle border border-devsuite-primary rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-devsuite-primary rounded-full flex items-center justify-center text-text-inverse text-sm font-bold">
              {selectedCount}
            </div>
            <span className="font-medium text-devsuite-primary">
              {selectedCount} {selectedCount === 1 ? 'story' : 'stories'} selected
            </span>
          </div>

          {loading && <PulsingDotsLoader size="sm"/>}
        </div>

        <div className="flex items-center gap-2">
          {/* Archive Actions */}
          {showArchiveActions && onArchive && (<button onClick={onArchive} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-devsuite-primary bg-bg-primary border border-border-default rounded-md transition-all hover:border-devsuite-primary disabled:opacity-50">
              <Archive className="w-4 h-4"/>
              Archive
            </button>)}

          {/* Restore Action */}
          {onRestore && (<button onClick={onRestore} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-success bg-bg-primary border border-border-default rounded-md transition-all hover:border-success disabled:opacity-50">
              <RotateCcw className="w-4 h-4"/>
              Restore
            </button>)}

          {/* Move Action */}
          {onMove && (<button onClick={onMove} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-devsuite-primary bg-bg-primary border border-border-default rounded-md transition-all hover:border-devsuite-primary disabled:opacity-50">
              <Move className="w-4 h-4"/>
              Move
            </button>)}

          {/* Tag Action */}
          {onTag && (<button onClick={onTag} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-devsuite-primary bg-bg-primary border border-border-default rounded-md transition-all hover:border-devsuite-primary disabled:opacity-50">
              <Tag className="w-4 h-4"/>
              Tag
            </button>)}

          {/* Delete Action */}
          {onDelete && (<button onClick={onDelete} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-error bg-bg-primary border border-border-default rounded-md transition-all hover:border-error disabled:opacity-50">
              <Trash2 className="w-4 h-4"/>
              Delete
            </button>)}

          {/* Clear Selection */}
          <button onClick={onClearSelection} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-primary border border-border-default rounded-md transition-all disabled:opacity-50">
            <X className="w-4 h-4"/>
            Clear
          </button>
        </div>
      </div>
    </div>);
};
