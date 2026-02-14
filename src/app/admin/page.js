'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { LogOut, Download, Users, Calendar } from 'lucide-react';

export default function AdminDashboard() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userFn = localStorage.getItem('user');

        if (!token || !userFn) {
            router.push('/login');
            return;
        }

        const user = JSON.parse(userFn);
        if (user.role !== 'ADMIN') {
            alert('Access Denied');
            router.push('/dashboard');
            return;
        }

        fetchData(token);
    }, []);

    const fetchData = async (token) => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/attendance/admin/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data.data);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                localStorage.clear();
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/attendance/admin/export`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `rekap_absensi_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
        } catch (err) {
            console.error('Export failed', err);
            alert('Gagal mengunduh laporan');
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-slate-800 px-6 py-6 text-white shadow-lg">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Users className="text-blue-400" />
                        <h1 className="text-xl font-bold">Admin Dashboard</h1>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Download size={18} /> Export CSV
                        </button>
                        <button onClick={handleLogout} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departemen</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.department}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(row.date).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                timeZone: 'Asia/Jakarta'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString('id-ID', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                timeZone: 'Asia/Jakarta'
                                            }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {row.check_out_time ? new Date(row.check_out_time).toLocaleTimeString('id-ID', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                timeZone: 'Asia/Jakarta'
                                            }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.status === 'HADIR' ? 'bg-green-100 text-green-800' :
                                                row.status === 'TELAT' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {data.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                Belum ada data absensi.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
