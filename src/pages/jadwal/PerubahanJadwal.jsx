import React, { useEffect, useState } from "react";
import { Plus,Check,Trash2, Search, Loader2, Eye, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { useAuth } from "../../hooks/useAuth";
import ConfirmModal from "../../components/ConfirmModal";
const PerubahanJadwal = () => {
  const navigate = useNavigate();
  const { user, peran } = useAuth();
  const prodiId = user?.prodiId;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [periodeId, setPeriodeId] = useState([]);

  const [hariList, setHariList] = useState([]);
  const [slotList, setSlotList] = useState([]);
  const [ruangList, setRuangList] = useState([]);
  const [jadwalList, setJadwalList] = useState([]);

  const [activeBatchId, setActiveBatchId] = useState(null);

  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [showRejectModal, setShowRejectModal] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);

  const [alasanReject, setAlasanReject] = useState("");
  const [loadingReject, setLoadingReject] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
  });

   const fetchData = async () => {
      try {
        setLoading(true);
        const params = { prodiId, page: 1, pageSize: 100 };
        // status opsional
        if (filterStatus) params.status = filterStatus;
        if (periodeId?.length > 0) {
          params.periodeId = periodeId.join(","); 
        } else {
          params.periodeId = ""; 
        }
        const res = await api.get("/api/pengajuan-perubahan-jadwal", { params });
        setData(res.data?.data?.items || []);
      } catch (err) {
        console.error("Fetch error:", err.response?.data || err);
        if(err.response?.data?.errors) {
          console.log("Detail validation errors:", err.response.data.errors);
        }
      } finally {
        setLoading(false);
      }
    };
   //inget ya rindu ini buat nampilin jadwal terget 
   const fetchFinalBatch = async () => {
    try {
      const res = await api.get("/api/scheduler/batch", {
        params: {
          status: "FINAL",
          page: 1,
          pageSize: 10,
        },
      });
      const finalBatch = res.data?.data?.items.find(
        (b) => b.status === "FINAL"
      );
  
      if (finalBatch) {
        setActiveBatchId(finalBatch.periodeId);
      }
    } catch (err) {
      console.error("Gagal ambil batch:", err);
    }
  };
      const fetchJadwal = async () => {
      if (!activeBatchId) return;
    
      try {
        const res = await api.get("/api/view-jadwal/all", {
          params: {
            periodeAkademikId: activeBatchId,
            statusBatch: "FINAL",
            page: 1,
            pageSize: 200,
          },
        });
    
        console.log("jadwalList:", res.data?.data?.items);
    
        setJadwalList(res.data?.data?.items || []);
      } catch (err) {
        console.error("Gagal ambil jadwal:", err);
      }
    };
    const fetchHari = async () => {
      const res = await api.get("/api/master-data/hari");
      setHariList(res.data?.data?.data || []);
    };
    const fetchSlot = async () => {
      const res = await api.get("/api/master-data/slot-waktu");
      setSlotList(res.data?.data?.items || []);
    };
    const fetchRuang = async () => {
      const res = await api.get("/api/master-data/ruang");
      setRuangList(res.data?.data?.items || []);
    };

    const filteredData = data.filter((item) => {
      const matchSearch = searchTerm
        ? item.alasanPengaju.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
    
      const matchStatus = filterStatus
        ? item.status === filterStatus
        : true;
    
      return matchSearch && matchStatus;
    });
    const formatJam = (jam) => {
      if (!jam) return "-";
    
      // kalau ISO (ada T)
      if (jam.includes("T")) {
        return jam.substring(11, 16); // ambil HH:mm
      }
    
      // kalau format 21.00
      return jam.replace(".", ":");
    };
    const getHariNama = (id) => {
      return hariList.find(h => h.id === id)?.nama || "-";
    };
      
    const getSlotRangeLabel = (slotId, row) => {
     const sortedSlotList = [...slotList].sort((a, b) =>
          a.jamMulai.localeCompare(b.jamMulai)
        );
      
        const index = sortedSlotList.findIndex(s => s.id === slotId);
        if (index === -1) return "-";
      
        const sks =
          row.jadwalKuliah?.penugasanMengajar?.programMatkul?.mataKuliah?.sks || 1;
      
        const start = sortedSlotList[index];
        const end = sortedSlotList[index + sks - 1];
      
        if (!start || !end) return "-";
      
        return `${formatJam(start.jamMulai)} - ${formatJam(end.jamSelesai)}`;
    };
    const getSlotRange = (slotId, sks) => {
        const sortedSlotList = [...slotList].sort((a, b) =>
          a.jamMulai.localeCompare(b.jamMulai)
        );
      
        const index = sortedSlotList.findIndex((s) => s.id === slotId);
      
        if (index === -1) return "-";
      
        const start = sortedSlotList[index];
        const end = sortedSlotList[index + sks - 1];
      
        if (!start || !end) return "-";
      
        return `${formatJam(start.jamMulai)} - ${formatJam(end.jamSelesai)}`;
    };
    const getRuangNama = (id) => {      
    return ruangList.find(r => r.id === id)?.nama || "-";
      };
    const handleApprove = (id) => {
        setSelectedId(id);
        setSelectedAction("approve");
      
        setConfirmModal({
          open: true,
          title: "Setujui Pengajuan",
          message: "Yakin ingin menyetujui pengajuan perubahan jadwal ini?",
          type: "confirm", // ubah
        });
    
     }; 
    const submitReject = async () => {
        if (!alasanReject || alasanReject.length < 5) {
          setConfirmModal({
            open: true,
            title: "Peringatan",
            message: "Alasan Minimal 5 karakter",
            type: "error",
          });
          return;
        }
        try {
          setLoadingReject(true);
          await api.post(
            `/api/pengajuan-perubahan-jadwal/${selectedId}/reject`,
            {
              alasanRespon: alasanReject,
            }
          );
          setConfirmModal({
            open: true,
            title: "Berhasil",
            message: "Pengajuan berhasil ditolak",
            type: "success",
          });
          setShowRejectModal(false);
          setSelectedId(null);
          setAlasanReject("");
          fetchData();
        } catch (error) {
          console.error(error);
          setConfirmModal({
            open: true,
            title: error.response?.data?.message ||"Gagal",
            message: "Gagal menolak pengajuan",
            type: "error",
          });
        } finally {
          setLoadingReject(false);
        }
     };
         
    const handleDelete = (id) => {
        setSelectedId(id);
        setSelectedAction("delete");
      
        setConfirmModal({
          open: true,
          title: "Hapus Pengajuan",
          message: "Yakin ingin menghapus pengajuan ini?",
          type: "delete",
        });
     };
    const handleConfirm = async () => {
        try {
          if (selectedAction === "approve") {
            await api.post(
              `/api/pengajuan-perubahan-jadwal/${selectedId}/approve`
            );
      
            setConfirmModal({
              open: true,
              title: "Berhasil",
              message: "Pengajuan berhasil disetujui",
              type: "success",
            });
          }
      
          if (selectedAction === "delete") {
            await api.delete(
              `/api/pengajuan-perubahan-jadwal/${selectedId}`
            );
      
            setConfirmModal({
              open: true,
              title: "Berhasil",
              message: "Pengajuan berhasil dihapus",
              type: "success",
            });
          }
      
          fetchData();
        } catch (error) {
          setConfirmModal({
            open: true,
            title: "Gagal",
            message:
              error.response?.data?.message || "Terjadi kesalahan",
            type: "error",
          });
        }
     };
      useEffect(() => {
        if (activeBatchId) {
          fetchJadwal();
        }
      }, [activeBatchId]);
      useEffect(() => {
        fetchFinalBatch();
        fetchData();
        fetchHari();
        fetchSlot();
        fetchRuang();
  
      }, [filterStatus, periodeId]);
    return (
        <MainLayout>
          <div className="bg-gray-50 min-h-screen">

            {/* HEADER */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Pengajuan Perubahan Jadwal
              </h1>
              <p className="text-gray-600 mt-2">
                Daftar pengajuan perubahan jadwal perkuliahan
              </p>
            </div>

            {/* ACTION BAR */}
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6
              flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
            >
              {peran === "TU_PRODI" && (
              <button
              onClick={() => navigate("/perubahan-jadwal/ajukan")}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600
                text-white px-5 py-2.5 rounded-lg shadow-sm
                hover:from-green-600 hover:to-green-700 transition-all font-medium"
              >
                <Plus size={18} />
                Ajukan Perubahan
              </button>
              )}
             

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto ml-auto">

                {/* Filter Status */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300
                  rounded-lg bg-white text-gray-900 focus:outline-none
                  focus:ring-2 focus:ring-green-500 transition"
                >
                <option value="">Semua Status</option>
                <option value="DIAJUKAN">Diajukan</option>
                <option value="DISETUJUI">Disetujui</option>
                <option value="DITOLAK">Ditolak</option>
                </select>

                {/* Search */}
                <div className="relative w-full">
                  <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari Mata Kuliah..."
                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-300
                    rounded-lg bg-white placeholder-gray-500 text-gray-900
                    focus:border-green-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold">
                  Daftar Pengajuan Perubahan Jadwal
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                        Dosen
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                        Mata Kuliah 
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                        Jadwal Lama
                      </th>
                      <th className="w-[280px] px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                        Jadwal Baru
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                        Alasan Pengajuan
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 ">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center">
                        <Loader2 className="animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredData.length ? (
                    filteredData.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 align-top">

                        {/* DOSEN */}
                        <td className="px-3 py-3 w-[200px]">
                            {row.jadwalKuliah?.penugasanMengajar?.dosen?.nama || "-"}
                        </td>

                        {/* MATA KULIAH */}
                        <td className="px-3 py-3 w-[200px]">
                            {row.jadwalKuliah?.penugasanMengajar?.programMatkul?.mataKuliah?.nama || "-"}
                        </td>

                        {/* JADWAL LAMA */}
                        <td className="px-3 py-3 w-[180px]">
                          <div className="bg-gray-50 p-2 rounded-md text-xs border border-gray-200 space-y-1">
                            <div>
                              <span className="text-gray-400">Hari:</span>{" "}
                              <span className="font-medium">
                                {getHariNama(row.hariLamaId)}
                              </span>
                            </div>

                            <div>
                              <span className="text-gray-400">Waktu:</span>{" "}
                              <span>
                                {getSlotRangeLabel(row.slotWaktuLamaId, row)}
                              </span>
                            </div>

                            <div>
                              <span className="text-gray-400">Ruangan:</span>{" "}
                              <span className="text-blue-600 font-medium">
                                {getRuangNama(row.ruangLamaId)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* JADWAL BARU */}
                        <td className="px-3 py-3 w-[200px]">
                          {row.jadwalTargetId ? (
                            <div className="bg-blue-50 p-2 rounded-md text-xs border border-blue-200 space-y-1">

                              <div className="text-[10px] font-semibold text-blue-700 uppercase">
                                Tukar Jadwal
                              </div>

                              {(() => {
                                const target = jadwalList.find(
                                  j => j.id === row.jadwalTargetId
                                );

                                return target ? (
                                  <>
                                    <div className="font-semibold text-blue-900 leading-snug">
                                      {target.mataKuliah}
                                    </div>

                                    <div className="text-[10px] text-blue-700">
                                      {target.dosen}
                                    </div>

                                    <div className="border-t border-blue-200 pt-1"></div>
                                  </>
                                ) : null;
                              })()}

                              <div>
                                <span className="text-gray-400">Hari:</span>{" "}
                                <span className="font-medium text-blue-700">
                                  {getHariNama(row.hariBaruId)}
                                </span>
                              </div>

                              <div>
                                <span className="text-gray-400">Waktu:</span>{" "}
                                <span>
                                  {getSlotRangeLabel(row.slotWaktuBaruId, row)}
                                </span>
                              </div>

                              <div>
                                <span className="text-gray-400">Ruangan:</span>{" "}
                                <span className="text-blue-700 font-medium">
                                  {getRuangNama(row.ruangBaruId)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-green-50 p-2 rounded-md text-xs border border-green-200 space-y-1">

                              <div>
                                <span className="text-gray-400">Hari:</span>{" "}
                                <span className="font-medium text-green-700">
                                  {getHariNama(row.hariBaruId)}
                                </span>
                              </div>

                              <div>
                                <span className="text-gray-400">Waktu:</span>{" "}
                                <span>
                                  {getSlotRangeLabel(row.slotWaktuBaruId, row)}
                                </span>
                              </div>

                              <div>
                                <span className="text-gray-400">Ruangan:</span>{" "}
                                <span className="text-green-700 font-medium">
                                  {getRuangNama(row.ruangBaruId)}
                                </span>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* ALASAN */}
                        <td className="px-3 py-3 w-[220px]">
                          <p className="text-sm text-gray-700 leading-relaxed break-words">
                            {row.alasanPengaju}
                          </p>
                        </td>

                        {/* STATUS */}
                        <td className="px-3 py-3 w-[120px]">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                            ${
                              row.status === "DISETUJUI"
                                ? "bg-green-100 text-green-800"
                                : row.status === "DITOLAK"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full mr-2
                              ${
                                row.status === "DISETUJUI"
                                  ? "bg-green-500"
                                  : row.status === "DITOLAK"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                              }`}
                            />

                            {
                              row.status === "DISETUJUI"
                                ? "Disetujui"
                                : row.status === "DITOLAK"
                                ? "Ditolak"
                                : "Diajukan"
                            }
                          </span>
                        </td>

                        {/* AKSI */}
                     <td className="px-3 py-3 whitespace-nowrap align-top">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedItem(row);
                                setShowDetail(true);
                              }}
                              className="p-1.5 rounded-md text-blue-700 hover:bg-blue-100 transition"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              onClick={() => handleDelete(row.id)}
                              className="p-1.5 rounded-md text-red-700 hover:bg-red-100 transition"
                            >
                              <Trash2 size={16} />
                            </button>

                            {(peran === "TU_FAKULTAS" || peran === "ADMIN") && (
                              <>
                                <button
                                  onClick={() => handleApprove(row.id)}
                                  className="px-2 py-1 text-xs rounded-md bg-green-700 text-white hover:bg-green-800"
                                >
                                  Setujui
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedId(row.id);
                                    setAlasanReject("");
                                    setShowRejectModal(true);
                                  }}
                                  className="px-2 py-1 text-xs rounded-md bg-red-700 text-white hover:bg-red-800"
                                >
                                  Tolak
                                </button>
                              </>
                            )}
                          </div>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500">
                        Tidak ada data pengajuan
                      </td>
                    </tr>
                  )}
                </tbody>
                </table>
              </div>
              {/* FOOTER */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-700">
                  Menampilkan{" "}
                  <span className="font-semibold">{filteredData.length}</span> dari{" "}
                  <span className="font-semibold">{data.length}</span> pengajuan
                </div>
              </div>
            </div>
      </div>
        
     {showDetail && selectedItem && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">

            {/* HEADER */}
            <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900">
                Detail Pengajuan Perubahan Jadwal
              </h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18}/>
              </button>
            </div>

            {/* BODY */}
            <div className="px-5 py-4 text-sm">

              <div className="space-y-3">

               {/* Dosen */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-gray-500">Dosen</div>
                <div className="col-span-2 font-medium">
                  {selectedItem.jadwalKuliah?.penugasanMengajar?.dosen?.nama || "-"}
                </div>
              </div>

              {/* Mata Kuliah */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-gray-500">Mata Kuliah</div>
                <div className="col-span-2 font-medium">
                  {selectedItem.jadwalKuliah?.penugasanMengajar?.programMatkul?.mataKuliah?.nama || "-"}
                </div>
              </div>

           {/* Jadwal Lama */}
           <div className="grid grid-cols-3 gap-2">
  <div className="text-gray-500">Jadwal Lama</div>

  <div className="col-span-2 font-medium">
    {getHariNama(selectedItem?.hariLamaId)}{" "}

    (
    {selectedItem?.slotWaktuLamaId
      ? getSlotRange(
          selectedItem.slotWaktuLamaId,
          selectedItem?.jadwalKuliah?.penugasanMengajar?.programMatkul?.mataKuliah?.sks || 1
        )
      : "-"}
    ){" "}

    - {getRuangNama(selectedItem?.ruangLamaId)}
  </div>
</div>

              {/* Jadwal Baru */}
              <div className="grid grid-cols-3 gap-2">
            <div className="text-gray-500">Jadwal Baru</div>

            <div className="col-span-2 font-medium">
              {getHariNama(selectedItem.hariBaruId)}{" "}
              (
              {selectedItem.slotWaktuBaruId
                ? getSlotRange(
                    selectedItem.slotWaktuBaruId,
                    selectedItem.jadwalKuliah?.penugasanMengajar?.programMatkul?.mataKuliah?.sks || 1
                  )
                : "-"}
              ){" "}
              {getRuangNama(selectedItem.ruangBaruId)}
            </div>
          </div>

                {/* Alasan */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-gray-500">Alasan Perubahan</div>
                  <div className="col-span-2">
                    {selectedItem.alasanPengaju}
                  </div>
                </div>

                {/* Status */}
               {/* Status */}
                <div className="grid grid-cols-3 gap-2 items-center">
                  <div className="text-gray-500">Status</div>
                  <div className="col-span-2">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold
                      ${
                        selectedItem.status === "DISETUJUI"
                          ? "bg-green-100 text-green-700"
                          : selectedItem.status === "DITOLAK"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                      {selectedItem.status}
                    </span>
                  </div>
                </div>
                {selectedItem.status === "DITOLAK" && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-gray-500">Alasan Penolakan</div>
                    <div className="col-span-2 font-medium text-red-600">
                      {selectedItem.alasanRespon || "-"}
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* FOOTER */}
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetail(false)}
                className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}
   {showRejectModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-md">

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-800">
        Tolak Pengajuan Perubahan Jadwal
      </div>

      {/* Body */}
      <div className="p-4">
        <label className="block text-sm font-medium mb-1">
          Alasan Penolakan
        </label>

        <textarea
          value={alasanReject}
          onChange={(e) => setAlasanReject(e.target.value)}
          rows={3}
          className="w-full border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-red-200"
          placeholder="Masukkan alasan penolakan..."
        />
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 ">
        <button
          onClick={() => setShowRejectModal(false)}
          className="px-4 py-2  rounded bg-gray-300 hover:bg-gray-500"
        >
          Batal
        </button>

        <button
          onClick={submitReject}
          disabled={loadingReject}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {loadingReject ? "Mengirim..." : "Tolak"}
        </button>
      </div>

    </div>
  </div>
)}
   <ConfirmModal
  open={confirmModal.open}
  title={confirmModal.title}
  message={confirmModal.message}
  type={confirmModal.type}
  onClose={() =>
    setConfirmModal((prev) => ({
      ...prev,
      open: false,
    }))
  }
  onConfirm={handleConfirm}
/>
    </MainLayout>
      );
    };
  export default PerubahanJadwal;