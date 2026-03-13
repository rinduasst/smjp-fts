import { X } from "lucide-react";

function PenugasanDetailModal({
  showDetail,
  setShowDetail,
  selectedItem
}) {

  if (!showDetail || !selectedItem) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-xl w-full max-w-2xl">

        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Detail Penugasan Mengajar
          </h3>

          <button onClick={() => setShowDetail(false)}>
            <X />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 grid grid-cols-2 gap-4 text-sm">

          {/* DOSEN */}
          <div>
            <p className="text-gray-500">Dosen</p>
            <p className="font-medium">
              {selectedItem.dosen?.nama || "-"}
            </p>
          </div>

          {/* MATA KULIAH */}
          <div>
            <p className="text-gray-500">Mata Kuliah</p>
            <p className="font-medium">
              {selectedItem.programMatkul?.mataKuliah?.kode} -{" "}
              {selectedItem.programMatkul?.mataKuliah?.nama}
            </p>
          </div>

          {/* SKS */}
          <div>
            <p className="text-gray-500">SKS</p>
            <p className="font-medium">
              {selectedItem.programMatkul?.mataKuliah?.sks || "-"}
            </p>
          </div>

          {/* PRODI */}
          <div>
            <p className="text-gray-500">Prodi</p>
            <p className="font-medium">
              {selectedItem.programMatkul?.prodi?.nama || "-"}
            </p>
          </div>

          {/* PERIODE */}
          <div>
            <p className="text-gray-500">Periode</p>
            <p className="font-medium">
              {selectedItem.programMatkul?.periode?.nama || "-"}
            </p>
          </div>

          {/* JENIS RUANG */}
          <div>
            <p className="text-gray-500">Preferensi Ruang</p>
            <p className="font-medium">
              {selectedItem.preferensiRuangJenis ??
                (selectedItem.butuhLab ? "LAB" : "TEORI")}
            </p>
          </div>

          {/* KELAS */}
          <div className="col-span-2">
            <p className="text-gray-500">Kelas</p>
            <p className="font-medium">
              {selectedItem.kelasList?.length
                ? selectedItem.kelasList
                    .map(
                      (k) =>
                        `${k.kelompokKelas.kode} - ${k.kelompokKelas.angkatan}`
                    )
                    .join(", ")
                : "-"}
            </p>
          </div>

          {/* JUMLAH SESI */}
          <div>
            <p className="text-gray-500">Jumlah Sesi / Minggu</p>
            <p className="font-medium">
              {selectedItem.jumlahSesiPerMinggu}
            </p>
          </div>

          {/* STATUS */}
          <div>
            <p className="text-gray-500">Status Mengajar</p>

            <span
              className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold
              ${
                selectedItem.status === "SIAP"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {selectedItem.status}
            </span>
          </div>

        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-white">

          <button
            onClick={() => setShowDetail(false)}
            className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition"
          >
            Tutup
          </button>

        </div>

      </div>
    </div>
  );
}

export default PenugasanDetailModal;