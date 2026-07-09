import { useState, useEffect, type SyntheticEvent } from 'react';
import api from '../api/axios';
import axios from 'axios';
import { Trash2, Plus, Pencil, X } from 'lucide-react';
import type { Category } from '../types/store';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const AdminCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [name, setName] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    // Estado para controlar la edición
    const [editingId, setEditingId] = useState<number | null>(null);

    const [isDeleteModalOpen, setIsModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<number | null>(null);

    useEffect(() => {
        const fetchCats = async () => {
            try {
                const res = await api.get<Category[]>('categories/');
                setCategories(res.data);
            } catch (err) { console.error(err); }
        };
        fetchCats();
    }, [refreshTrigger]);

    // Cargar categoría en el formulario para editar
    const startEdit = (cat: Category) => {
        setEditingId(cat.id);
        setName(cat.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setName('');
    };

    const handleSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                // ACTUALIZAR (PATCH)
                await api.patch(`categories/${editingId}/`, { name });
                toast.success('Categoría actualizada');
            } else {
                // CREAR (POST)
                await api.post('categories/', { name });
                toast.success('Categoría creada');
            }
            cancelEdit();
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            let msg = "Error al procesar la categoría";
            if (axios.isAxiosError(err)) msg = err.response?.data?.name?.[0] || err.message;
            toast.error(msg);
        }
    };

    const openDeleteModal = (id: number) => {
        setIdToDelete(id);
        setIsModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!idToDelete) return;
        try {
            await api.delete(`categories/${idToDelete}/`);
            setRefreshTrigger(prev => prev + 1);
            toast.success('Categoría eliminada');
        } catch (err) {
            let msg = "No se pudo eliminar la categoría";
            if (axios.isAxiosError(err)) {
                msg = err.response?.data?.error || err.message;
            }
            toast.error(msg);
        } finally {
            setIsModalOpen(false);
            setIdToDelete(null);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario Dinámico (Crear/Editar) */}
            <div className="card bg-base-100 shadow-xl h-fit">
                <div className="card-body">
                    <h2 className="card-title mb-4">
                        {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
                    </h2>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <input 
                            type="text" 
                            className="input input-bordered w-full" 
                            placeholder="Nombre de la categoría" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required 
                        />
                        <div className="flex flex-col gap-2">
                            <button type="submit" className="btn btn-primary w-full">
                                {editingId ? <><Pencil size={18} className="mr-2" /> Actualizar</> : <><Plus size={18} className="mr-2" /> Añadir</>}
                            </button>
                            {editingId && (
                                <button type="button" onClick={cancelEdit} className="btn btn-ghost btn-sm">
                                    <X size={16} className="mr-2" /> Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Listado con botones de Editar y Borrar */}
            <div className="lg:col-span-2 card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title mb-4">Categorías Existentes</h2>
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th className="text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map(cat => (
                                    <tr key={cat.id} className="hover">
                                        <td>{cat.id}</td>
                                        <td className="font-bold">{cat.name}</td>
                                        <td className="text-right flex justify-end gap-2">
                                            <button 
                                                onClick={() => startEdit(cat)}
                                                className="btn btn-ghost btn-sm text-info"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button 
                                                onClick={() => openDeleteModal(cat.id)}
                                                className="btn btn-ghost btn-sm text-error"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <ConfirmModal 
                isOpen={isDeleteModalOpen}
                title="¿Eliminar categoría?"
                message="Los productos asociados no se borrarán, pero se quedarán sin categoría asignada."
                onConfirm={confirmDelete}
                onCancel={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default AdminCategories;