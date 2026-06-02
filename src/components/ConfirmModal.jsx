import { useEffect } from "react";
import {
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

function ConfirmModal({
  open,
  title,
  message,
  type = "info", // success | error | delete
  loading = false,
  onClose,
  onConfirm,
  
}) {

  useEffect(() => {
    if (open && !["delete", "confirm"].includes(type)) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [open, type, onClose]);
  if (!open) return null;


  const config = {
    delete: {
      icon: <AlertTriangle size={60} />,
      iconColor: "text-red-600",
      button: "bg-red-600 hover:bg-red-700",
      buttonText: "Ya",
    },
    confirm: {
      icon: <AlertTriangle size={60} />,
      iconColor: "text-blue-600",
      button: "bg-green-600 hover:bg-green-700",
      buttonText: "Ya, Lanjutkan",
    },
    success: {
      icon: <CheckCircle2 size={60} />,
      iconColor: "text-green-600",
    },
    error: {
      icon: <AlertTriangle size={60} />,
      iconColor: "text-yellow-500",
    },
  };

  const current = config[type] || config.success;

  return (
    <div className="fixed inset-0 z-[999] bg-black/30 backdrop-blur-none flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        
    {/* Close buat delete + confirm */}
    {!loading && ["delete", "confirm"].includes(type) && (
      <button
        onClick={onClose}
        className="absolute mt-4 right-6 text-gray-400 hover:text-gray-600"
      >
        <X size={18} />
      </button>
    )}

        <div className="px-6 pt-8 pb-6 text-center">
          
          {/* Icon */}
          <div
          className={`mx-auto flex items-center justify-center ${current.iconColor}`}
        >
          <div className="scale-150">
            {current.icon}
          </div>
        </div>

        {/* Title */}
        <h2 className="mt-4 text-2xl font-bold text-gray-700">
          {title}
        </h2>

        {/* Message */}
        <p className="mt-1 text-gray-500 leading-relaxed">
          {message}
        </p>

          {/* Tombol cuma buat delete */}
          {["delete", "confirm"].includes(type) && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Batal
              </button>

              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-2.5 rounded-xl text-white transition ${current.button}`}
              >
                {loading ? (
                  <Loader2
                    size={18}
                    className="animate-spin mx-auto"
                  />
                ) : (
                  current.buttonText
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;