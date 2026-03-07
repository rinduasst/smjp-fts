import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import MainLayout from "../../components/MainLayout";

export default function DetailKurikulum() {
  const { id } = useParams();
  const [kurikulum, setKurikulum] = useState([]);
  const [matkulList, setMatkulList] = useState([]);

  useEffect(() => {
    getKurikulum();
  }, [id]);
  

  const getKurikulum = async () => {
    try {
      const res = await api.get(`/api/kurikulum/kurikulum/${id}`);
  
      setKurikulum(res.data.data);
      setMatkulList(res.data.data.matkul); 
  
    } catch (err) {
      console.error("Gagal ambil kurikulum", err);
    }
  };
  


  return (
    <MainLayout>
      <h1 className="text-2xl font-bold mb-2">Detail Kurikulum</h1>
      <p className="mb-4 text-gray-600 mt-2">
        Detail mata kuliah yang digunakan dalam kurikulum
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

      {matkulList.length === 0 ? (
        <p className="text-sm text-gray-500 italic">
          Belum ada mata kuliah yang ditampilkan.
        </p>
      ) : (
        <div className="bg-white rounded-lg shadow border overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
        <tr className="text-gray-700 uppercase text-xs tracking-wide">
            <th className="border-b px-3 py-2 w-12 text-center">No</th>
            <th className="border-b px-3 py-2 text-left">Kode</th>
            <th className="border-b px-3 py-2">Nama Mata Kuliah</th>
            <th className="border-b px-3 py-2 text-center">SKS</th>
            <th className="border-b px-3 py-2 text-center">Semester</th>
          </tr>
        </thead>
      
        <tbody className="divide-y">
          {matkulList.map((mk, index) => (
            <tr
              key={mk.id}
              className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
            >
              <td className="px-3 py-2 text-center text-gray-500">
                {index + 1}
              </td>
      
              <td className="px-3 py-2 font-mono">
                {mk.mataKuliah?.kode}
              </td>
      
              <td className="px-3 py-2">
                {mk.mataKuliah?.nama}
              </td>
              <td className="px-3 py-2 text-center">
                {mk.mataKuliah?.sks ?? "-"}
              </td>
              <td className="px-3 py-2 text-center">
                {mk.semester ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      
      )}
    </MainLayout>
  );
}
