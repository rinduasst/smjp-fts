import { useState, useEffect } from "react";
import MainLayout from "../components/MainLayout";
import ConfirmModal from "../components/ConfirmModal";

function Log() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("activity_logs")) || [];
    setLogs(data);
  }, []);
  

  const filteredLogs = logs.filter((log) =>
    log.user.toLowerCase().includes(search.toLowerCase()) ||
    log.description.toLowerCase().includes(search.toLowerCase())
  );

  const actionColor = {
    CREATE: "bg-green-100 text-green-600",
    UPDATE: "bg-yellow-100 text-yellow-600",
    DELETE: "bg-red-100 text-red-600",
  };
  const handleClearLogs = () => {
    localStorage.removeItem("activity_logs");
    setLogs([]);
    setShowClearModal(false);
  };
  return (
    <MainLayout>
      <div className=" bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Log Aktivitas
        </h1>

        <button
          onClick={() => setShowClearModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Hapus Semua Log
        </button>

      </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Daftar Log Aktivitas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">No</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Modul</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deskripsi</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500">
                    Belum ada aktivitas
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={log.id} className="border-t border-gray-400">
                    <td className="px-4 py-2">{index + 1}</td>

                    <td className="px-4 py-2">{log.user}</td>

                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${actionColor[log.action]}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2">{log.module}</td>
                    <td className="px-4 py-2">{log.description}</td>

                    <td className="px-4 py-2">
                      {new Date(log.time).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
      <ConfirmModal
        open={showClearModal}
        type="delete"
        title="Hapus Semua Log"
        message="Apakah Anda yakin ingin menghapus seluruh log aktivitas?"
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearLogs}
      />
    </MainLayout>
  );
}

export default Log;