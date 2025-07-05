import React from 'react';
import { Modal } from '../ui/modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string; // e.g., 'red', 'blue', etc.
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message = 'Please confirm this action.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'red',
  loading = false,
}) => {
  const confirmBtnClass =
    confirmColor === 'red'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-brand-500 hover:bg-brand-600 text-white';

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm">
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">{title}</h3>
        <div className="mb-6 text-gray-700 dark:text-gray-200">{message}</div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded ${confirmBtnClass} disabled:opacity-60`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal; 