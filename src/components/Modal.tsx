// File: src/components/Modal.tsx
import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  sub?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "modal-lg" | "modal-xl" | "";
  footer?: ReactNode;
}

export const Modal = ({
  title,
  sub,
  onClose,
  children,
  size = "",
  footer,
}: ModalProps) => {
  return (
    // Background gelap (overlay)
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Kotak Modal */}
      <div className={`modal ${size}`}>
        <div className="mh">
          <div>
            <div className="mh-title">{title}</div>
            {sub && <div className="mh-sub">{sub}</div>}
          </div>
          <button className="mc" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="mb">{children}</div>

        {footer && <div className="mf">{footer}</div>}
      </div>
    </div>
  );
};
