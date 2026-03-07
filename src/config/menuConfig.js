import {
    LayoutDashboard,
    Layers,
    Library,
    GraduationCap,
    CalendarCog,
    FileEdit,
    FileSpreadsheet,
    LayoutList,
    Settings,
  } from "lucide-react";
  
  export const MENU_CONFIG = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "TU_FAKULTAS", "TU_PRODI"],
    },
  
    {
      name: "Master Data",
      icon: Layers,
      roles: ["ADMIN", "TU_FAKULTAS", "TU_PRODI"],
      children: [
        { name: "Fakultas", path: "/master-data/fakultas", roles: ["ADMIN"] },
        { name: "Program Studi", path: "/master-data/program-studi", roles: ["ADMIN", "TU_FAKULTAS"] },
        { name: "Periode Akademik", path: "/master-data/periode-akademik", roles: ["ADMIN", "TU_FAKULTAS"] },
        { name: "Hari", path: "/master-data/hari", roles: ["ADMIN", "TU_FAKULTAS"] },
        { name: "Sesi Waktu", path: "/master-data/slot-waktu", roles: ["ADMIN", "TU_FAKULTAS"] },
        { name: "Ruang", path: "/master-data/ruang", roles: ["ADMIN", "TU_FAKULTAS"] },
        { name: "Dosen", path: "/master-data/dosen", roles: ["ADMIN", "TU_FAKULTAS", "TU_PRODI"] },
        { name: "Kelompok Kelas", path: "/master-data/kelompok-kelas", roles: ["ADMIN","TU_FAKULTAS", "TU_PRODI"] },
      ],
    },
  
    {
      name: "Kurikulum",
      icon: Library,
      roles: ["ADMIN", "TU_PRODI", "TU_FAKULTAS"],
      children: [
        { name: "Mata Kuliah", path: "/kurikulum/mata-kuliah", roles: ["ADMIN", "TU_PRODI", "TU_FAKULTAS"] },
        { name: "Kurikulum", path: "/kurikulum/kurikulum", roles: ["ADMIN", "TU_FAKULTAS", "TU_PRODI"] },
        { name: "Program Mata Kuliah", path: "/kurikulum/program-matkul", roles: ["ADMIN", "TU_PRODI", "TU_FAKULTAS"] },
      ],
    },
  
    {
      name: "Pengajaran",
      icon: GraduationCap,
      roles: ["ADMIN", "TU_PRODI","TU_FAKULTAS"],
      children: [
        { name: "Penugasan Mengajar", path: "/pengajaran/penugasan-mengajar", roles: ["ADMIN", "TU_PRODI","TU_FAKULTAS"] },
        // { name: "Preferensi Dosen", path: "/pengajaran/preferensi-dosen", roles: ["TU_PRODI","ADMIN", "TU_FAKULTAS"] },
        { name: "Aturan Mengajar Dosen", path: "/pengajaran/aturan-mengajar-dosen", roles: ["TU_PRODI","ADMIN", "TU_FAKULTAS"] },
      ],
    },
  
    {
      name: "Penjadwalan",
      icon: CalendarCog,
      roles: ["ADMIN", "TU_FAKULTAS",],
      children: [
        { name: "Generate Jadwal", path: "/scheduler/generate", roles: ["ADMIN","TU_FAKULTAS"] },
        { name: "Batch Jadwal", path: "/scheduler/batch", roles: ["ADMIN", "TU_FAKULTAS"] },
        // { name: "Export Jadwal ", path: "/scheduler/jadwal", roles: ["ADMIN", "TU_FAKULTAS", "TU_PRODI"] },
      ],
    },
    {
    name: "Jadwal",
    icon: LayoutList,
    roles: ["ADMIN", "TU_FAKULTAS","TU_PRODI"],
    children: [
      { name: "Jadwal Kuliah", path: "/jadwal-kuliah/jadwal", roles: ["ADMIN","TU_FAKULTAS", "TU_PRODI"] },
      { name: "Jadwal Prodi", path: "/jadwal-kuliah/jadwal-prodi", roles: [ "TU_PRODI"] },
      { name: "Jadwal Kelas", path: "/jadwal-kuliah/jadwal-kelas", roles: ["TU_PRODI"] },
      { name: "Jadwal Dosen", path: "/jadwal-kuliah/jadwal-dosen", roles: ["TU_PRODI"] },
      { name: "Jadwal Ruangan", path: "/jadwal-kuliah/jadwal-ruangan", roles: ["ADMIN", "TU_FAKULTAS", "TU_PRODI"] },
      { name: "Perubahan Jadwal", path: "/pengajuan-perubahan-jadwal", roles: ["ADMIN", "TU_FAKULTAS", "TU_PRODI"] },
      // { name: "Export Jadwal ", path: "/scheduler/jadwal", roles: ["ADMIN", "TU_FAKULTAS", "TU_PRODI"] },
    ],
  },
  
    {
      name: "Pengaturan",
      icon: Settings,
      roles: ["ADMIN"],
      children: [
        { name: "Manajemen Pengguna", path: "/pengaturan/pengguna", roles: ["ADMIN"] },
      ],
    },
  ];
  