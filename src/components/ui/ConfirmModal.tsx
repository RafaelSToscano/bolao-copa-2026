"use client";

import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-500 text-white"
      : "bg-yellow-500 hover:bg-yellow-400 text-slate-950";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 text-center shadow-2xl space-y-4">
        <div className="text-4xl">{variant === "danger" ? "⚠️" : "🎲"}</div>

        <div className="space-y-1">
          <h3 className="text-xl font-black text-white">{title}</h3>
          <p className="text-slate-300 text-sm">{message}</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="flex-1 h-11 border-slate-700 bg-slate-800 text-white hover:bg-slate-700 font-bold"
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            className={`flex-1 h-11 font-bold ${confirmClass}`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
