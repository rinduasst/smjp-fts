import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import {ArrowLeft  } from "lucide-react";
import MainLayout from "../../components/MainLayout";

export default function AssignMatkul() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kurikulum, setKurikulum] = useState(null);
  const [matkulList, setMatkulList] = useState([]); // sudah di-assign
  const [allMatkul, setAllMatkul] = useState([]);   // semua matkul
  const [selectedMatkul, setSelectedMatkul] = useState([]);

 
  const getKurikulum = async () => {
    const res = await api.get(`/api/kurikulum/kurikulum/${id}`);
    const data = res.data.data;
  
    setKurikulum(data);
    setMatkulList(data.matkul || []);
  
    // ambil matkul sesuai prodi kurikulum
    getAllMatkul(data.prodi?.id);
  };

  const getAllMatkul = async (prodiId) => {
    let page = 1;
    let totalPages = 1;
    let allData = [];
  
    do {
      const res = await api.get(
        `/api/kurikulum/mata-kuliah?page=${page}&pageSize=100&prodiId=${prodiId}`
      );
  
      allData = [...allData, ...res.data.data.items];
      totalPages = res.data.data.totalPages;
      page++;
    } while (page <= totalPages);
  
    setAllMatkul(allData);
  };
  const getSelected = (id) => {
    return selectedMatkul.find((s) => s.id === id);
  };
  useEffect(() => {
    getKurikulum();
  }, [id]);
  const handleAssign = async () => {
    if (selectedMatkul.length === 0) {
      alert("Pilih minimal 1 mata kuliah!");
      return;
    }

    const payload = {
      items: selectedMatkul.map((s) => ({
        mataKuliahId: s.id,
        semester: s.semester
      })),
    };

    try {
      await api.post(
        `/api/kurikulum/kurikulum/${id}/assignMatkul`,
        payload
      );
      alert("Mata kuliah berhasil di-assign");
     await  getKurikulum();
      setSelectedMatkul([]);
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan perubahan");
    }
  };
  //Filter Matkul yang Sudah Di-Assign
  const availableMatkul = allMatkul.filter(
    (mk) =>
      !matkulList.some(
        (m) => m.mataKuliah?.id === mk.id
      )
  );
  console.log("ASSIGNED:", matkulList);
  return (
    <MainLayout>
      <h1 className="text-2xl font-bold mb-1">Penugasan Mata Kuliah</h1>
      <p className="text-sm text-gray-600 mb-6">
        Pilih dan atur mata kuliah yang akan digunakan dalam kurikulum.
      </p>

      {kurikulum && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <p><b>Nama Kurikulum:</b> {kurikulum.nama}</p>
          <p>
            <b>Tahun:</b> {kurikulum.angkatanMulai} –  
            {kurikulum.angkatanSelesai?? "Sekarang"}
          </p>
          <p>
            <b>Program Studi:</b> {kurikulum.prodi?.nama} (
            {kurikulum.prodi?.jenjang})
          </p>
        </div>
      )}

      <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
        <b>Petunjuk Penggunaan:</b>
        <ul className="list-disc ml-4 mt-1 space-y-1">
          <li>Centang mata kuliah untuk menambahkan ke kurikulum.</li>
          <li>Isi semester dan minimal semester sesuai ketentuan.</li>
          <li>Perubahan disimpan setelah klik <b>Simpan Perubahan</b>.</li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow border overflow-x-auto">
     
      <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr className="text-gray-700 uppercase text-xs tracking-wide">
            <th className="border-b px-3 py-2 w-10 text-center"></th>
            <th className="border-b px-3 py-2">Kode</th>
            <th className="border-b px-3 py-2">Nama Mata Kuliah</th>
            <th className="border-b px-3 py-2 text-center">SKS</th>
            <th className="border-b px-3 py-2 text-center">Semester</th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {availableMatkul.length === 0 ? (
            <tr>
              <td
                colSpan="6"
                className="text-center py-10 text-gray-500 font-normal"
              >
                Semua mata kuliah sudah di-assign ke kurikulum ini.
              </td>
            </tr>
          ) : (
            availableMatkul.map((mk, index) => {
              const selected = getSelected(mk.id);
              const isAssigned = matkulList.some(
                (m) => m.mataKuliah?.id === mk.id
              );
              const isSelected = selectedMatkul.some((s) => s.id === mk.id);
              const checked = isAssigned || isSelected;

              return (
                <tr
                  key={mk.id}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50 transition-colors`}
                >
                <td className="px-3 py-2 text-center">
                <input
                type="checkbox"
                checked={checked}
                disabled={isAssigned}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedMatkul((prev) => [
                      ...prev,
                      { id: mk.id, semester: 1 },
                    ]);
                  } else {
                    setSelectedMatkul((prev) =>
                      prev.filter((s) => s.id !== mk.id)
                    );
                  }
                }}
              />
                </td>
            
                <td className="px-3 py-2 font-mono text-gray-700">{mk.kode}</td>
                <td className="px-3 py-2 text-gray-800">{mk.nama}</td>
                <td className="px-3 py-2 text-center">{mk.sks}</td>
                <td className="px-3 py-2 text-center">
                {checked ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={selected?.semester ?? ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ""); // hanya angka

                      setSelectedMatkul((prev) =>
                        prev.map((s) =>
                          s.id === mk.id
                            ? { ...s, semester: Number(val ||0) }
                            : s
                        )
                      );
                    }}
                    className="
                      w-16 text-center
                      border border-gray-300 rounded-md
                      px-1 py-0.5
                      focus:outline-none focus:ring-1 focus:ring-blue-400
                    "
                  />
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>     
              </tr>
            );
          })
        )}

        </tbody>
      </table>
      </div>
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => navigate("/kurikulum/kurikulum")}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium"
          >
            <ArrowLeft size={18} />
            Kembali
        </button>
        <button
          onClick={handleAssign}
          disabled={availableMatkul.length === 0}
          className="
            flex items-center gap-2
            bg-green-600 text-white
            px-5 py-2 rounded-lg
            text-sm font-medium
            hover:bg-green-700
            transition-colors
            disabled:bg-gray-400 disabled:cursor-not-allowed
          "
        >
          Simpan Perubahan
        </button>
       
        </div>
    </MainLayout>
  );
}
