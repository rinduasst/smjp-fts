  import React, { useEffect, useState } from "react";
  import { Plus,Check,Trash2, Search, Loader2, Eye, X } from "lucide-react";
  import { useNavigate } from "react-router-dom";
  import MainLayout from "../../components/MainLayout";
  import api from "../../api/api";
  import { useAuth } from "../../hooks/useAuth";
  
  const PerubahanJadwal = () => {
    const navigate = useNavigate();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [showPilihJadwal, setShowPilihJadwal] = useState(false);
    const [selectedJadwalText, setSelectedJadwalText] = useState("");

    const [jadwalList, setJadwalList] = useState([]);
    const [selectedJadwal, setSelectedJadwal] = useState("");

    const [hariBaru, setHariBaru] = useState("");
    const [slotBaru, setSlotBaru] = useState("");
    const [ruangBaru, setRuangBaru] = useState("");
    const [alasan, setAlasan] = useState("");

    const [activeBatchId, setActiveBatchId] = useState(null);
    const { user, peran } = useAuth();
    const prodiId = user?.prodiId;
    
    const [hariList, setHariList] = useState([]);
    const [slotList, setSlotList] = useState([]);
    const [ruangList, setRuangList] = useState([]); 

    const [showDetail, setShowDetail] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);


    //alasan penolakan
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [alasanRespon, setAlasanRespon] = useState("");
    const [loadingReject, setLoadingReject] = useState(false);
    const [alasanReject, setAlasanReject] = useState("");
    
    const fetchData = async () => {
      try {
        setLoading(true);
    
        const res = await api.get(
          "/api/pengajuan-perubahan-jadwal?page=1&pageSize=200"
        );
    
        setData(res.data?.data?.items || []);
    
      } catch (err) {
        console.error(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
   

    const handleSubmit = async () => {
      console.log({
        jadwalKuliahId: selectedJadwal,
        hariBaruId: hariBaru,
        slotWaktuBaruId: slotBaru,
        ruangBaruId: ruangBaru,
        alasanPengaju: alasan,
      });
    
      //  Validasi kosong
      if (!selectedJadwal || !hariBaru || !slotBaru || !ruangBaru || !alasan) {
        alert("Lengkapi semua data dulu!");
        return;
      }
    
      // 2 Validasi jadwal baru ≠ jadwal lama
      if (selectedObj) {
        if (
          hariBaru === selectedObj.hariId &&
          slotBaru === selectedObj.slotWaktuId &&
          ruangBaru === selectedObj.ruangId
        ) {
          alert("Jadwal baru tidak boleh sama dengan jadwal lama");
          return;
        }
      }
    
      //  kirim ke API
      try {
        await api.post("api/pengajuan-perubahan-jadwal", {
          jadwalKuliahId: selectedJadwal,
          hariBaruId: hariBaru,
          slotWaktuBaruId: slotBaru,
          ruangBaruId: ruangBaru,
          alasanPengaju: alasan,
        });
    
        setShowModal(false);
        fetchData();
      } catch (err) {
        
        console.error("ERROR API:", err.response?.data || err);
      }
    };

    //Ambil batch FINAL
          //Ambil daftar jadwal FINAL untuk dropdown
          const fetchFinalBatch = async () => {
            try {
              const res = await api.get("/api/scheduler/batch", {
                params: { status: "FINAL", page: 1, pageSize: 10 },
              });
              const finalBatch = res.data?.data?.items.find(b => b.status === "FINAL");
              if (finalBatch) {
                setActiveBatchId(finalBatch.periodeId);
              }
            } catch (err) {
              console.error("Gagal mengambil batch FINAL", err);
            }
          };
        
          // fetch semua jadwal FINAL tanpa filter prodi
          const fetchJadwalFinal = async () => {
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

              setJadwalList(res.data?.data?.items || []);
            } catch (err) {
              console.error("Gagal ambil jadwal", err);
            }
          };
          useEffect(() => {
            const init = async () => {
              await fetchData();
              await fetchFinalBatch();
              await fetchMasterData();
            };
          
            init();
          }, []);
          
          useEffect(() => {
            if (activeBatchId) {
              fetchJadwalFinal();
            }
          }, [activeBatchId]);
    
        const fetchMasterData = async () => {
          try {
            const [hariRes, slotRes, ruangRes] = await Promise.all([
              api.get("/api/master-data/hari"),
              api.get("/api/master-data/slot-waktu"),
              api.get("/api/master-data/ruang"),
            ]);
        
            setHariList(hariRes.data?.data || []); 
            setSlotList(slotRes.data?.data?.items || []);
            setRuangList(ruangRes.data?.data?.items || []);
          } catch (err) {
            console.error("Gagal ambil master data", err);
          }
        };

      useEffect(() => {
        fetchMasterData();
      }, []);

      const filteredData = data.filter((item) => {

        const matchSearch = searchTerm
          ? item.alasanPengaju
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())
          : true;
      
        const matchStatus = filterStatus
          ? item.status === filterStatus
          : true;
      
        return matchSearch && matchStatus;
      });
      //untuk nampilin card
  //     const jadwalFiltered = peran === "TU_PRODI"
  // ? jadwalList.filter(j => j.prodi?.id === prodiId)
  // : jadwalList;
      const jadwalFiltered = jadwalList;
    const selectedObj = jadwalFiltered.find(
      j => j.id === selectedJadwal
      );

      const getHariNama = (id) => {
        return hariList.find(h => h.id === id)?.nama || "-";
      };
      
      const getSlotLabel = (id) => {
        const slot = slotList.find(s => s.id === id);
        if (!slot) return "-";
      
        const formatJam = (jam) =>
          new Date(jam).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Jakarta",
          });
      
        return `${formatJam(slot.jamMulai)} - ${formatJam(slot.jamSelesai)}`;
      };
      
      const getJadwalDetail = (jadwalKuliahId) => {
        return jadwalList.find(j => j.id === jadwalKuliahId);
      };
      const getNamaDosen = (jadwalKuliahId) => {
        const jadwal = getJadwalDetail(jadwalKuliahId);
        return jadwal?.dosen || "-";
      };
      
      const getNamaMatkul = (jadwalKuliahId) => {
        const jadwal = getJadwalDetail(jadwalKuliahId);
        return jadwal?.mataKuliah || "-";
      };
      
      const getRuangNama = (id) => {
        return ruangList.find(r => r.id === id)?.nama || "-";
      };
      


      const handleApprove = async (id) => {
        const confirmApprove = window.confirm(
          "Setujui pengajuan perubahan jadwal ini?"
        );
        if (!confirmApprove) return;
        try {
          await api.post(`/api/pengajuan-perubahan-jadwal/${id}/approve`);
          alert("Pengajuan berhasil disetujui");
          fetchData();
        } catch (error) {
          console.error(error);
          alert(
            error.response?.data?.message ||
            "Gagal menyetujui pengajuan"
          );
        }
      };
      console.log("Checking jadwal vs user prodi:");
      jadwalList.forEach(j => {
        console.log("Jadwal ID:", j.id, "Prodi Jadwal:", j.prodi?.id, "User Prodi:", prodiId);
      });
      const submitReject = async () => {
        if (!alasanReject || alasanReject.length < 5) {
          alert("Alasan minimal 5 karakter");
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
          alert("Pengajuan berhasil ditolak");
          setShowRejectModal(false);
          setSelectedId(null);
          setAlasanReject("");
          fetchData();
        } catch (error) {
          console.error(error);
          alert(
            error.response?.data?.message ||
            "Gagal menolak pengajuan"
          );
        } finally {
          setLoadingReject(false);
        }
      };
         
      const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
          "Apakah Anda yakin ingin menghapus pengajuan ini?"
        );
        if (!confirmDelete) return;
        try {
          await api.delete(`/api/pengajuan-perubahan-jadwal/${id}`);
          alert("Pengajuan berhasil dihapus");
          fetchData();
        } catch (error) {
          console.error(error);
          alert(
            error.response?.data?.message ||
            "Gagal menghapus pengajuan"
          );
        }
      };
      // Hitung rowSpan tiap hari
      const hariRowSpan = {};
      let prevHari = null;

      jadwalFiltered.forEach((jadwal, index) => {
        if (jadwal.hari !== prevHari) {
          // hitung berapa jadwal yang sama berturut-turut
          const count = jadwalFiltered.slice(index).filter(j => j.hari === jadwal.hari).length;
          hariRowSpan[index] = count; // simpan rowSpan di index
          prevHari = jadwal.hari;
        }
      });
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
                onClick={() =>   setShowModal(true) }
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600
                text-white px-5 py-2.5 rounded-lg shadow-sm
                hover:from-green-600 hover:to-green-700 transition-all font-medium"
              >
                <Plus size={18} />
                Ajukan Perubahan
              </button>
              )}

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                        Jadwal Lama
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                        Jadwal Baru
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                        Alasan Pengajuan
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center">
                          <Loader2 className="animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : filteredData.length ? (
                      filteredData.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">         
                                          
                        {/* dosen */}
                        <td className="px-6 py-4">
                          {getNamaDosen(row.jadwalKuliahId)}
                        </td>
                        {/* Matkul*/}
                        <td className="px-6 py-4">
                            {getNamaMatkul(row.jadwalKuliahId)}
                        </td>
                        {/* jdwl lama LAMA */}
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="text-gray-400">Hari:</span>
                              <span className="ml-2 font-medium">
                                {getHariNama(row.hariLamaId)}
                              </span>
                            </div>
                            <div>
                            <span className="text-gray-400">Jam:</span>
                              <span className="ml-2 whitespace-nowrap">
                                {getSlotLabel(row.slotWaktuLamaId)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400"></span>
                              <span className="ml-2 text-blue-600 whitespace-nowrap font-medium">
                                {getRuangNama(row.ruangLamaId)}
                              </span>
                            </div>
                          </div>
                        </td>
                        {/* jdwl baru  */}
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="text-gray-400">Hari:</span>
                              <span className="ml-2 font-medium">
                                {getHariNama(row.hariBaruId)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Jam:</span>
                              <span className="ml-2 whitespace-nowrap">
                                {getSlotLabel(row.slotWaktuBaruId)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400"></span>
                              <span className="ml-2 whitespace-nowrap text-blue-600 font-medium">
                                {getRuangNama(row.ruangBaruId)}
                              </span>
                            </div>
                          </div>
                        </td>
                        {/* alasan */}
                        <td className="px-6 py-4">
                          {row.alasanPengaju}
                        </td>
                        {/* statusny */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">

                          {/* Detail */}
                          <button
                            onClick={() => {
                              setSelectedItem(row);
                              setShowDetail(true);
                            }}
                            className="p-1.5 rounded-md  text-blue-700 hover:bg-blue-200 transition"
                            title="Lihat Detail"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                              onClick={() => handleDelete(row.id)}
                              title="Hapus"
                               className="p-1.5 rounded-md  text-red-700 hover:bg-blue-200 transition"
                            >
                              <Trash2 size={16} />
                            </button>

                          {/* Approve & Reject hanya untuk Fakultas/Admin */}
                          {(peran === "TU_FAKULTAS" || peran === "ADMIN") && (
                            <>
                              {/* Setujui */}
                              <button
                               onClick={() => handleApprove(row.id)}
                                className="px-3 py-1.5 text-xs font-medium rounded-md
                                bg-green-700 text-white
                                hover:bg-green-200 hover:text-green-800
                                transition"
                              >
                                Setujui
                              </button>

                              {/* Tolak */}
                              <button
                                onClick={() => {
                                  setSelectedId(row.id);
                                  setAlasanRespon("");
                                  setShowRejectModal(true);
                                }}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg
                                bg-red-700 text-white
                                hover:bg-red-200 hover:text-red-800
                                transition"
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
          {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl">

            {/* HEADER */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Ajukan Perubahan Jadwal
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500"
              >
                <X />
              </button>
            </div>

            {/* BODY */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">

              {/* Pilih Jadwal */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Jadwal Kuliah
                </label>
                <button
                type="button"
                onClick={() => setShowPilihJadwal(true)}
                className="w-full px-3 py-2 bg-gray-100 rounded text-left
                focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {selectedJadwalText || "Pilih Jadwal"}
              </button>
              
              </div>


              {/* Jadwal Lama Preview */}
              {selectedObj && (
                <>
                  <div className="bg-gray-50  rounded-lg p-3">
                    <h4 className="font-semibold text-gray-700 mb-1">Jadwal {selectedObj?.dosen}</h4>
                    <p className="text-sm">Hari: {selectedObj?.hari}</p>
                    <p className="text-sm">
                      Jam: {selectedObj?.jamMulai} - {selectedObj?.jamSelesai}
                    </p>
                    <p className="text-sm">{selectedObj?.ruangan}</p>
                    
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="font-semibold text-green-700 mb-1">
                      Jadwal Baru
                    </h4>
                    <p className="text-sm text-green-700">
                      Hari:  {getHariNama(hariBaru)}
                    </p>
                    <p className="text-sm text-green-700">
                      Jam:{getSlotLabel(slotBaru)}
                    </p>
                    <p className="text-sm text-green-700">
                      Ruang: {getRuangNama(ruangBaru)}
                    </p>
                  </div>
                </>
              )}

              {/* Form Baru */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={hariBaru}
                onChange={(e) => setHariBaru(e.target.value)}
                className="px-3 py-2 bg-gray-100 rounded
                focus:outline-none focus:ring-2 focus:ring-green-500"
                
              >
                <option value="">Pilih Hari Baru</option>
                {hariList.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.nama}
                  </option>
                ))}
              </select>
              <select
              value={slotBaru}
              onChange={(e) => setSlotBaru(e.target.value)}
              className="px-3 py-2 bg-gray-100 rounded
                  focus:outline-none focus:ring-2 focus:ring-green-500"
              
            >
              <option value="">Pilih Waktu Baru</option>
              {slotList.map(s => (
                <option key={s.id} value={s.id}>
                
                  {new Date(s.jamMulai).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Jakarta",
                  })}
                  {" - "}
                  {new Date(s.jamSelesai).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Jakarta",
                  })}
                
                </option>
              ))}
            </select>

            <select
            value={ruangBaru}
            onChange={(e) => setRuangBaru(e.target.value)}
            className="px-3 py-2 bg-gray-100 rounded
            focus:outline-none focus:ring-2 focus:ring-green-500"
            
          >
            <option value="">Pilih Ruang Baru</option>
            {ruangList.map(r => (
              <option key={r.id} value={r.id}>
                {r.nama}
              </option>
            ))}
          </select>
              </div>

              {/* Alasan */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Alasan Pengajuan
                </label>
                <textarea
                  rows="3"
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 rounded
                  focus:outline-none focus:ring-2 focus:ring-green-500"
                  
                />
              </div>

              {/* FOOTER */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Simpan Perubahan
              </button>
              </div>

            </form>
          </div>
        </div>
      )}
        {showPilihJadwal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-5xl">

              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Pilih Jadwal Perkuliahan
                </h3>
                <button onClick={() => setShowPilihJadwal(false)}>
                  <X />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
              <table className="w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-3 py-2">Hari</th>
                      <th className="border px-3 py-2">Jam</th>
                      <th className="border px-3 py-2">Mata Kuliah</th>
                      <th className="border px-3 py-2">Dosen</th>
                      <th className="border px-3 py-2">Ruang</th>
                      <th className="border px-3 py-2">Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                  {jadwalFiltered.map((j, idx) => (
                    <tr key={j.id}>
                      {/* Hari dengan rowSpan */}
                      {hariRowSpan[idx] ? (
                        <td className="border px-3 py-2" rowSpan={hariRowSpan[idx]}>
                          {j.hari}
                        </td>
                      ) : null}

                      <td className="border px-3 py-2 whitespace-nowrap">{j.jamMulai} - {j.jamSelesai}</td>
                      <td className="border px-3 py-2">{j.mataKuliah}</td>
                      <td className="border px-3 py-2">{j.dosen}</td>
                      <td className="border px-3 py-2"s>{j.ruangan}</td>
                      <td className="border px-3 py-2 text-center">
                        <button
                          onClick={() => {
                            setSelectedJadwal(j.id);
                            setSelectedJadwalText(`${j.mataKuliah} | ${j.hari} | ${j.jamMulai}-${j.jamSelesai}`);
                            setShowPilihJadwal(false);
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Pilih
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>

            </div>
          </div>
        )}
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
                    {getNamaDosen(selectedItem.jadwalKuliahId)}
                  </div>
                </div>

                {/* Matkul */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-gray-500">Mata Kuliah</div>
                  <div className="col-span-2 font-medium">
                    {getNamaMatkul(selectedItem.jadwalKuliahId)}
                  </div>
                </div>

                {/* Jadwal Lama */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-gray-500">Jadwal Lama</div>
                  <div className="col-span-2 font-medium">
                    {getHariNama(selectedItem.hariLamaId)}, {" "}
                    {getSlotLabel(selectedItem.slotWaktuLamaId)}, {" "}
                    {getRuangNama(selectedItem.ruangLamaId)}
                  </div>
                </div>

                {/* Jadwal Baru */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-gray-500">Jadwal Baru</div>
                  <div className="col-span-2 font-medium">
                    {getHariNama(selectedItem.hariBaruId)}, {" "}
                    {getSlotLabel(selectedItem.slotWaktuBaruId)}, {" "}
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
    </MainLayout>
      );
    };
  export default PerubahanJadwal;