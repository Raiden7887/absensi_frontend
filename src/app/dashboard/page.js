'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { LogOut, MapPin, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [todayStatus, setTodayStatus] = useState(null); // null, 'CHECKED_IN', 'CHECKED_OUT'
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        setUser(JSON.parse(userData));
        fetchHistory(token);
    }, []);

    const fetchHistory = async (token) => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/attendance/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const history = res.data.data;
            setAttendance(history);

            // Check today's status
            const today = new Date().toISOString().slice(0, 10);
            const todayEntry = history.find(a => a.date.startsWith(today));

            if (todayEntry) {
                if (todayEntry.check_out_time) {
                    setTodayStatus('CHECKED_OUT');
                } else {
                    setTodayStatus('CHECKED_IN');
                }
            } else {
                setTodayStatus(null);
            }
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

    const handleAction = async (action) => { // 'check-in' or 'check-out'
        const token = localStorage.getItem('token');
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/attendance/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh data
            fetchHistory(token);
            alert(`${action === 'check-in' ? 'Check In' : 'Check Out'} Berhasil!`);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Action failed');
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
            <div className="bg-blue-600 px-4 py-8 pb-16 text-white text-center rounded-b-3xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <div className="text-left">
                        <h1 className="text-xl font-bold">Halo, {user?.name}</h1>
                        <p className="text-blue-100 text-sm">{user?.department}</p>
                    </div>
                    <button onClick={handleLogout} className="p-2 bg-blue-700 rounded-full hover:bg-blue-800">
                        <LogOut size={20} />
                    </button>
                </div>
                <div className="text-4xl font-bold mb-2">
                    {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-blue-100 text-sm">
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            </div>

            {/* Main Action Card */}
            <div className="px-4 -mt-10">
                <div className="bg-white rounded-2xl shadow-md p-6 text-center">
                    {todayStatus === 'CHECKED_OUT' ? (
                        <div className="py-4">
                            <CheckCircle className="mx-auto text-green-500 mb-2" size={48} />
                            <h3 className="text-lg font-semibold text-gray-800">Anda sudah selesai hari ini</h3>
                            <p className="text-gray-500 text-sm">Sampai jumpa besok!</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${todayStatus === 'CHECKED_IN' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    Status: {todayStatus === 'CHECKED_IN' ? 'Sedang Bekerja' : 'Belum Absen'}
                                </span>
                            </div>

                            {todayStatus === 'CHECKED_IN' ? (
                                <button
                                    onClick={() => handleAction('check-out')}
                                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <LogOut size={24} />
                                    Check Out
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleAction('check-in')}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <MapPin size={24} />
                                    Check In Sekarang
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* History List */}
            <div className="px-4 mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock size={20} /> Riwayat Absensi
                </h3>
                <div className="space-y-3">
                    {attendance.length === 0 ? (
                        <p className="text-center text-gray-400 py-4">Belum ada riwayat absensi</p>
                    ) : (
                        attendance.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                <div>
                                    <div className="text-sm font-semibold text-gray-800">
                                        {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </div>
                                    <div className={`text-xs mt-1 ${item.status === 'TELAT' ? 'text-red-500' : 'text-green-600'
                                        }`}>
                                        {item.status}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-800">
                                        {new Date(item.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {item.check_out_time ?
                                            new Date(item.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) :
                                            '--:--'
                                        }
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
