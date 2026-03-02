import { useEffect, useState } from "react";
import MainLayout from "../../components/MainLayout";
import { Search, Loader2 } from "lucide-react";
import api from "../../api/api";

function HariKuliah() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchHari = async () => {
    try {
      const res = await api.get("/api/master-data/hari");
      setData(res.data?.data || []);
    } catch (err) {
      console.error("Gagal fetch hari kuliah:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHari();
  }, []);

  const filteredData = data.filter(item =>
    item.nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <MainLayout>
        {/* Header */}
        <div className=" bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold mb-2">Hari Kuliah</h1>
        <p className="text-gray-600 mt-1 mb-6">
        Daftar hari aktif yang digunakan dalam sistem penjadwalan perkuliahan
      </p>



        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Daftar Hari Perkuliahan</h3>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-16 py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase">
                No
              </th>
              <th className="py-3 px-10 text-left text-xs font-semibold text-gray-500 uppercase">
                Nama Hari
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="2" className="py-8 text-center">
                  <Loader2 className="animate-spin mx-auto" />
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData
                .sort((a, b) => a.urutan - b.urutan)
                .map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-center">
                      {index + 1}
                    </td>
                    <td className="py-3 px-10">
                      {item.nama}
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="2" className="py-6 text-center text-gray-500">
                  Tidak ada data hari kuliah
                </td>
              </tr>
            )}
          </tbody>
        </table>

        </div>
       

          {/* Table Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Menampilkan <span className="font-semibold">{filteredData.length}</span> dari <span className="font-semibold">{data.length}</span> hari perkuliahan
              </div>
            </div>
          </div>
      </div>
      </div>
    </MainLayout>
  );
}

export default HariKuliah;
