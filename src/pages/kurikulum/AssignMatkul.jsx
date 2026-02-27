import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import MainLayout from "../../components/MainLayout";

export default function AssignMatkul() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kurikulum, setKurikulum] = useState(null);
  const [matkulList, setMatkulList] = useState([]); // sudah di-assign
  const [allMatkul, setAllMatkul] = useState([]);   // semua matkul
  const [selectedMatkul, setSelectedMatkul] = useState([]);

  useEffect(() => {
    getKurikulum();
    getMatkulKurikulum();
    getAllMatkul();
  }, [id]);

  const getKurikulum = async () => {
    const res = await api.get(`/api/kurikulum/kurikulum/${id}`);
    setKurikulum(res.data.data);
  };

  const getMatkulKurikulum = async () => {
    const res = await api.get(
      `/api/kurikulum/mata-kuliah?kurikulumId=${id}`
    );
    setMatkulList(res.data.data.items);
  };

  const getAllMatkul = async () => {
    const res = await api.get("/api/kurikulum/mata-kuliah");
    setAllMatkul(res.data.data.items);
  };

  const getSelected = (id) => {
    return selectedMatkul.find((s) => s.id === id);
  };

  const handleAssign = async () => {
    if (selectedMatkul.length === 0) {
      alert("Pilih minimal 1 mata kuliah!");
      return;
    }

    const payload = {
      items: selectedMatkul.map((s) => ({
        mataKuliahId: s.id,
        semester: s.semester,
        minimalSemester: s.minimalSemester,
      })),
    };

    try {
      await api.post(
        `/api/kurikulum/kurikulum/${id}/assignMatkul`,
        payload
      );
      alert("Mata kuliah berhasil di-assign");
     await  getMatkulKurikulum();
      setSelectedMatkul([]);
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan perubahan");
    }
  };

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
            <b>Tahun:</b> {kurikulum.angkatanMulai} –{" "}
            {kurikulum.angkatanSelesai}
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
            <th className="border-b px-3 py-2 text-center">Min Semester</th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {allMatkul.map((mk, index) => {
            const selected = getSelected(mk.id);
            const isAssigned = matkulList.some((m) => m.mataKuliahId === mk.id);
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
                      { id: mk.id, semester: 1, minimalSemester: 1 },
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
                      type="number"
                      min={1}
                      value={selected.semester}
                      onChange={(e) =>
                        setSelectedMatkul((prev) =>
                          prev.map((s) =>
                            s.id === mk.id
                              ? { ...s, semester: +e.target.value }
                              : s
                          )
                        )
                      }
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

                <td className="px-3 py-2 text-center">
                  {checked ? (
                    <input
                      type="number"
                      min={1}
                      value={selected.minimalSemester}
                      onChange={(e) =>
                        setSelectedMatkul((prev) =>
                          prev.map((s) =>
                            s.id === mk.id
                              ? {
                                  ...s,
                                  minimalSemester: +e.target.value,
                                }
                              : s
                          )
                        )
                      }
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
          })}
        </tbody>
      </table>

      </div>

      <div className="mt-4 flex justify-between">
        <button
          onClick={() => navigate("/kurikulum/kurikulum")}
          className="
            flex items-center gap-2
            bg-gray-400 text-white
            px-5 py-2 rounded-lg
            text-sm font-medium
            hover:bg-gray-600
            transition-colors
          "
        >
          Kembali
        </button>
        <button
          onClick={handleAssign}
          className="
            flex items-center gap-2
            bg-green-600 text-white
            px-5 py-2 rounded-lg
            text-sm font-medium
            hover:bg-green-700
            transition-colors
          "
        >
          Simpan Perubahan
        </button>
       
        </div>
    </MainLayout>
  );
}
