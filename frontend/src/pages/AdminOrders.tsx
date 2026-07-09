import { useState, useEffect } from 'react';
import api from '../api/axios';
import type { Order } from '../types/store';
import { Eye, CheckCircle2, Clock } from 'lucide-react';

const AdminOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get<Order[]>('orders/');
                setOrders(res.data);
            } catch (err) {
                console.error("Error cargando pedidos", err);
            }
        };
        fetchOrders();
    }, []);

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title text-2xl font-bold mb-6">Gestión de Pedidos</h2>
                
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Fecha</th>
                                <th>Total</th>
                                <th>Estado Pago</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-400">
                                        No hay pedidos registrados todavía.
                                    </td>
                                </tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order.id} className="hover">
                                        <td className="font-mono text-xs">#{order.id}</td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-bold">{order.user_username}</span>
                                                <span className="text-xs opacity-50">{order.user_email}</span>
                                            </div>
                                        </td>
                                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="font-bold text-primary">{order.total_price} €</td>
                                        <td>
                                            {order.is_paid ? (
                                                <div className="badge badge-success gap-1 text-white">
                                                    <CheckCircle2 size={14} /> Pagado
                                                </div>
                                            ) : (
                                                <div className="badge badge-warning gap-1">
                                                    <Clock size={14} /> Pendiente
                                                </div>
                                            )}
                                        </td>
                                        <td className="text-right">
                                            <button className="btn btn-ghost btn-sm text-info tooltip" data-tip="Ver detalles">
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminOrders;