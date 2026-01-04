import React from "react";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  width?: number | string;
};

export default function Modal({
  open,
  title,
  onClose,
  footer,
  children,
  width = 560,
}: Props) {
  if (!open) return null;
  return (
    <div className="ui-modal__backdrop" onClick={onClose}>
      <div
        className="ui-modal__panel"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-modal__header">
          <div className="ui-modal__title">{title}</div>
          <button className="ui-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="ui-modal__body">{children}</div>
        {footer && <div className="ui-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
