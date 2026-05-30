import { useState, useEffect } from "react";
import MainLayout from "../../components/MainLayout";
import { Search, Plus, Edit, Trash2, X, Loader2, Eye } from "lucide-react";
import api from "../../api/api";
import { useAuth } from "../../hooks/useAuth";
import ConfirmModal from "../../components/ConfirmModal";
import PenugasanFormModal from "../../pages/pengajaran/PenugasanFormModal.jsx";
import PenugasanDetailModal from "../../pages/pengajaran/PenugasanDetailModal.jsx";

function PenugasanMengajar() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [filterKelas, setFilterKelas] = useState("");

  const { peran } = useAuth();

  const [formData, setFormData] = useState({
    dosenId: ""
  });
  const isFakultas =
  peran === "ADMIN" ||
  peran === "TU_FAKULTAS";

  const isProdi =
  peran === "TU_PRODI";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(50);
  const [totalData, setTotalData] = useState(0);
  const [loadingProgramMatkul, setLoadingProgramMatkul] = useState(false);
  const [filterProdi, setFilterProdi] = useState("");
  const [filterPeriode, setFilterPeriode] = useState("");

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
  });

  const fetchData = async (currentPage = page, currentPageSize = pageSize) => {
    try {
      setLoading(true);
  
      const res = await api.get("/api/pengajaran/penugasan-mengajar", {
        params: {
          status: "SIAP",
          page: currentPage,
          pageSize: currentPageSize,
          q: searchTerm || undefined,
          periodeId: filterPeriode || undefined,
          kelasId: filterKelas || undefined,
          prodiId: peran === "TU_Prodi" ? user?.prodiId : filterProdi || undefined
        }
      });
  
      const response = res.data?.data;
      setData(response?.items || []);
      setTotalData(response?.total || 0);
  
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData(page, pageSize);
  }, [page, pageSize, searchTerm, filterProdi, filterPeriode, filterKelas]);

  const totalPage = Math.ceil(totalData / pageSize);
  const resetForm = () => {
    setFormData({
      dosenId: "",
      programMatkulId: "",
      kelompokKelasId: [""],
      jumlahSesiPerMinggu: 1,
      preferensiRuangJenis: "TEORI",
      butuhLab: false,
      status: "SIAP",
      isKelasGabungan: false
    });
  
    setSelectedItem(null);
    setSelectedProgramMatkul(null);
    setKelasList([]);
  };
  const handleEdit = (row) => {
    setSelectedItem(row);
    setFormData({
      dosenId: row.dosenId,
      programMatkulId: row.programMatkulId,
      kelompokKelasId: row.kelompokKelasId || [],
      jumlahSesiPerMinggu: row.jumlahSesiPerMinggu,
      preferensiRuangJenis: row.preferensiRuangJenis,
      butuhLab: row.butuhLab,
      status: row.status,
      isKelasGabungan: row.isKelasGabungan ?? false
    });
    setShowModal(true);
    setSelectedProgramMatkul({
      id: row.programMatkul.id,
      mataKuliah: row.programMatkul.mataKuliah,
      periode: row.programMatkul.periode
    });
  };

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
  
    try {
      console.log("PAYLOAD KIRIM:", payload);
  
      if (selectedItem) {
        // EDIT
        await api.patch(
          `/api/pengajaran/penugasan-mengajar/${selectedItem.id}`,
          payload
        );
  
      } else {
        // TAMBAH
        await Promise.all(
          payload.map(item =>
            api.post("/api/pengajaran/penugasan-mengajar", item)
          )
        );
      }
  
      setConfirmModal({
        open: true,
        title: "Berhasil",
        message: selectedItem
          ? "Data penugasan berhasil diperbarui"
          : "Data penugasan berhasil ditambahkan",
        type: "success",
      });
  
      await fetchData();
      setShowModal(false);
  
    } catch (err) {
  
      console.log("ERROR RESPONSE:", err.response?.data);
      console.log("ERROR STATUS:", err.response?.status);
      console.log("ERROR FULL:", err);
  
      setConfirmModal({
        open: true,
        title: "Gagal",
        message:
          err.response?.data?.message ||
          "Gagal menyimpan, silahkan coba lagi",
        type: "error",
      });
  
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDelete = (row) => {
    setSelectedItem(row);
  
    setConfirmModal({
      open: true,
      title: "Hapus Penugasan Mengajar",
      message: `Yakin ingin menghapus penugasan mengajar dosen "${row.dosen?.nama}"?`,
      type: "delete",
    });
  };
  const confirmDelete = async () => {
    if (!selectedItem) return;
  
    try {
      setIsSubmitting(true);
  
      await api.delete(
        `/api/pengajaran/penugasan-mengajar/${selectedItem.id}`
      );
  
      await fetchData();
  
      setConfirmModal({
        open: true,
        title: "Berhasil",
        message: "Data penugasan berhasil dihapus",
        type: "success",
      });
  
      setSelectedItem(null);
  
    } catch (err) {
      console.error(err.response?.data || err);
  
      const status = err.response?.status;
      const message = err.response?.data?.message;
  
      setConfirmModal({
        open: true,
        title: "Gagal",
        message:
          status === 400 || status === 409
            ? message || "Penugasan tidak dapat dihapus karena sudah digunakan."
            : "Gagal menghapus data.",
        type: "error",
      });
  
    } finally {
      setIsSubmitting(false);
    }
  };
  const prodiList = [
    ...new Map(
      data
        .map(item => [
          item.programMatkul?.prodi?.id,
          item.programMatkul?.prodi
        ])
        .filter(([id]) => id)
    ).values()
  ];
  const periodeList = [
    ...new Map(
      data
        .map(item => [
          item.programMatkul?.periode?.id,
          item.programMatkul?.periode
        ])
        .filter(([id]) => id)
    ).values()
  ];
  const kelasListFilter = [
    ...new Map(
      data
        .flatMap(item =>
          item.kelasList?.map(k => [
            k.kelompokKelas?.id,
            k.kelompokKelas
          ])
        )
        .filter(Boolean)
    ).values()
  ];
  const [dosenDropdown, setDosenDropdown] = useState([]);
  const [loadingDosen, setLoadingDosen] = useState(false);
  //Buat Function Search Dosen

  const searchDosen = async (keyword) => {
    try {
      setLoadingDosen(true);
  
      const res = await api.get("/api/master-data/dosen", {
        params: { q: keyword, page: 1, pageSize: 10 }
      });
  
      setDosenDropdown(res.data?.data?.items || []);
    } catch (err) {
      console.error("Gagal search dosen:", err);
    } finally {
      setLoadingDosen(false);
    }
  };
  const [programMatkulDropdown, setProgramMatkulDropdown] = useState([]);
  const [selectedProgramMatkul, setSelectedProgramMatkul] = useState(null);
  const [kelasList, setKelasList] = useState([]);

  const searchProgramMatkul = async (keyword) => {
    try {
      setLoadingProgramMatkul(true);
  
      const res = await api.get("/api/kurikulum/program-matkul", {
        params: {
          q: keyword,
          page: 1,
          pageSize: 10,
          periodeId: "" // sesuaikan kalau dinamis
        }
      });
  
      setProgramMatkulDropdown(res.data?.data?.items || []);
  
    } catch (err) {
      console.error("Gagal search program matkul:", err);
    } finally {
      setLoadingProgramMatkul(false);
    }
  };
    //helper hitung semester + romawi
  //ubah angaktan ke romawi dan semester 
  const toRomawi = (num) => {
    const map = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
    return map[num] || num;
  };
  
  const hitungSemester = (angkatan, tahunMulai, paruh) => {
    return (tahunMulai - angkatan) * 2 + (paruh === "GENAP" ? 2 : 1);
  };

  const formatKelas = (kelas, periode) => {
    if (!periode) return `${kelas.kode} - ${kelas.angkatan}`;
  
    const semester = hitungSemester(
      kelas.angkatan,
      periode.tahunMulai,
      periode.paruh
    );
  
    const romawi = toRomawi(semester);
    const jenis = kelas.jenisKelas === "REGULER" ? "REG" : "KAR";
  
    return `${romawi}_${jenis}_${kelas.kode}`;
  };

  const [pengajaranList, setPengajaranList] = useState([
    {
      programMatkulId: "",
      kelompokKelasId: [""],
      jumlahSesiPerMinggu: 1,
      preferensiRuangJenis: "TEORI",
      status: "SIAP",
      isKelasGabungan: false
    }
  ]);
  return (
    <MainLayout>
      <div className=" bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Penugasan Mengajar</h1>
          <p className="text-gray-600 mt-2">
          Penetapan dosen pengampu pada mata kuliah dan kelas tertentu
          </p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border
         border-gray-200 p-6 mb-6 flex flex-col lg:flex-row justify-between gap-4">
       
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 bg-gradient-to-r
           from-green-500 to-green-600 text-white px-5 
           py-2.5 rounded-lg shadow-sm hover:from-green-600
            hover:to-green-700 transition"
        >
          <Plus size={18} /> Tambah Penugasan
        </button>
           <div className="flex sm:flex-row gap-3 w-full lg:w-auto ml-auto">
           {peran === "TU_PRODI" && (
               <select
          className="w-full pl-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
        >
          <option value="">Semua Kelas</option>

          {kelasListFilter.map((k) => (
            <option key={k.id} value={k.id}>
              {k.kode}
            </option>
          ))}
        </select>
        )}

         <select
          className="w-full pl-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
          value={filterPeriode}
          onChange={(e) => setFilterPeriode(e.target.value)}
        >
          <option value="">Semua Periode</option>

          {periodeList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </select>
          {peran !== "TU_PRODI" && (
          <select
          className="w-full pl-3  py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
            value={filterProdi}
            onChange={e => setFilterProdi(e.target.value)}
          >
            <option value="">Semua Prodi</option>
            {prodiList.map(p => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        )}
    
          <div className="relative w-full sm:max-w-sm">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
          />
        </div>

          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Daftar Penugasan Mengajar</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["Dosen", "Mata Kuliah", "Kelas", "Jumlah Sesi", "Jenis Ruang","Status Pengajuan", "Aksi"].map(h => (
                    <th key={h} className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center">
                      <Loader2 className="animate-spin mx-auto" />
                    </td>
                  </tr>
           ):   data.length ? (
                data.map(row => (
                    <tr key={row.id}>
                      <td className="py-2 px-6 text-left ">{row.dosen?.nama}</td>
                      <td className="py-2 px-2 text-left">{row.programMatkul?.mataKuliah?.nama}</td>
                      <td className="text-center">
                      {row.kelasList?.map(k => {
                      const periode = row.programMatkul?.periode;
                      if (!periode) return "-";

                      const smt = hitungSemester(
                        k.kelompokKelas.angkatan,
                        periode.tahunMulai,
                        periode.paruh
                      );

                      return `${toRomawi(smt)}_${k.kelompokKelas.jenisKelas === "REGULER" ? "REG" : "KAR"}_${k.kelompokKelas.kode}`;
                    }).join(" dan ")}
                    </td>
                      <td className="text-center">{row.jumlahSesiPerMinggu}</td>
                      <td className="text-center">                  
                      {row.preferensiRuangJenis ?? (row.butuhLab ? "LAB" : "TEORI")}
                    </td>


                      <td className="py-2 px-3 text-center">
                      <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                      ${row.status === 'SIAP'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-600'}`}
                    >
                      {row.status}
                    </span>

                    </td>
                      <td className="py-4 px-6 flex gap-2">
                        <button onClick={() => handleEdit(row)} title="Edit" className="text-blue-600">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => {  handleDelete(row); }} title="Hapus" className="text-red-600">
                          <Trash2 size={16} />
                        </button>
                        <button
                       onClick={() => {
                        setSelectedItem(row);
                        setShowDetail(true);
                      }}
                        className="text-green-600 hover:text-green-800"
                        title="Detail"
                        >
                        <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      Tidak ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-700">
            Menampilkan {(page - 1) * pageSize + 1} -
          {Math.min(page * pageSize, totalData)} dari {totalData} data penugasan
          </div>

          <div className="flex items-center gap-2">
            <button
               disabled={page === 1}
               onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Prev
            </button>

            <button
              disabled={page === totalPage}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Next
            </button>
          </div>
        </div>
        </div>
        </div>

        {/* Modal Tambah/Edit */}
        <PenugasanFormModal
        showModal={showModal}
        setShowModal={setShowModal}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        selectedItem={selectedItem}
        resetForm={resetForm}
        kelasList={kelasList}
        setKelasList={setKelasList}
        selectedProgramMatkul={selectedProgramMatkul}
        setSelectedProgramMatkul={setSelectedProgramMatkul}
        dataPenugasan={data}
        isEdit={!!selectedItem}
        
    
      />
      </div>
      <PenugasanDetailModal
        showDetail={showDetail}
        setShowDetail={setShowDetail}
        selectedItem={selectedItem}
        formatKelas={formatKelas}
        
      />
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        loading={isSubmitting}
        onClose={() =>
          setConfirmModal((prev) => ({
            ...prev,
            open: false,
          }))
        }
        onConfirm={
          confirmModal.type === "delete"
            ? confirmDelete
            : undefined
        }
      />

    </MainLayout>
  );
}

export default PenugasanMengajar;
