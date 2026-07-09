import { useState, useEffect, type SyntheticEvent } from 'react';
import api from '../api/axios';
import type { Product, Category, PaginatedResponse } from '../types/store';
import axios from 'axios';
import ImageGalleryUploader from '../components/ImageGalleryUploader';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import { Star } from 'lucide-react';

const AdminProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [form, setForm] = useState({
        name: '', summary: '', description: '', price: '', stock: '',
        category: '', featured: false,
    });
    const [images, setImages] = useState<(File | string | null)[]>([null, null, null, null]);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [isDeleteModalOpen, setIsModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<number | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [p, c] = await Promise.all([
                    api.get<PaginatedResponse<Product>>(`products/?page=${currentPage}&search=${searchTerm}`),
                    api.get<Category[]>('categories/')
                ]);
                setProducts(p.data.results);
                setTotalProducts(p.data.count);
                setCategories(c.data);
            } catch (e) { console.error(e); }
        };
        loadData();
    }, [currentPage, searchTerm, refreshTrigger]);

    const startEdit = (p: Product) => {
        setEditingId(p.id);
        setForm({
            name: p.name,
            summary: p.summary || '',
            description: p.description,
            price: p.price.toString(),
            stock: p.stock.toString(),
            category: p.category ? p.category.toString() : '',
            featured: p.featured || false,
        });
        setImages([p.image, p.image2, p.image3, p.image4]);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ name: '', summary: '', description: '', price: '', stock: '', category: '', featured: false });
        setImages([null, null, null, null]);
    };

    const openDeleteModal = (id: number) => {
        setIdToDelete(id);
        setIsModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!idToDelete) return;
        try {
            await api.delete(`products/${idToDelete}/`);
            setRefreshTrigger(prev => prev + 1);
            toast.success('Producto eliminado correctamente');
        } catch (err) {
            let msg = "No se pudo eliminar el producto";
            if (axios.isAxiosError(err)) {
                msg = err.response?.data?.error || err.message;
            }
            toast.error(msg);
        } finally {
            setIsModalOpen(false);
            setIdToDelete(null);
        }
    };

    const toggleFeatured = async (product: Product) => {
        try {
            await api.patch(`products/${product.id}/`, { featured: !product.featured });
            setRefreshTrigger(prev => prev + 1);
            toast.success(product.featured ? 'Producto no destacado' : 'Producto destacado');
        } catch {
            toast.error('Error al cambiar destacado');
        }
    };

    const handleSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        const formData = new FormData();

        Object.entries(form).forEach(([key, val]) => {
            if (key === 'category' && val === '') return;
            if (key === 'featured') {
                formData.append(key, val ? 'true' : 'false');
                return;
            }
            formData.append(key, String(val));
        });

        const fieldNames = ['image', 'image2', 'image3', 'image4'];
        images.forEach((img, index) => {
            if (img instanceof File) {
                formData.append(fieldNames[index], img);
            } else if (img === null && editingId) {
                formData.append(fieldNames[index], "");
            }
        });

        try {
            if (editingId) {
                await api.patch(`products/${editingId}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Producto actualizado');
            } else {
                await api.post('products/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Producto creado con éxito');
            }
            cancelEdit();
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            let msg = "Error al guardar el producto";
            if (axios.isAxiosError(err)) {
                msg = err.response?.data?.error || err.message;
            }
            toast.error(msg);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario */}
            <div className="card bg-base-100 shadow-xl h-fit sticky top-8">
                <form onSubmit={handleSubmit} className="card-body gap-4">
                    <h2 className="card-title text-2xl font-bold">
                        {editingId ? 'Editar Producto' : 'Nuevo Producto'}
                    </h2>

                    <div className="form-control">
                        <label className="label-text mb-1">Nombre</label>
                        <input type="text" className="input input-bordered" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                    </div>

                    <div className="form-control">
                        <label className="label-text mb-1">Categoría</label>
                        <select className="select select-bordered" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                            <option value="">Seleccionar...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="form-control">
                            <label className="label-text mb-1">Precio (€)</label>
                            <input type="number" step="0.01" className="input input-bordered" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                        </div>
                        <div className="form-control">
                            <label className="label-text mb-1">Stock</label>
                            <input type="number" className="input input-bordered" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required />
                        </div>
                    </div>

                    {/* ── Toggle Destacado en el formulario ── */}
                    <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-3 py-2">
                            <input
                                type="checkbox"
                                className="toggle toggle-warning"
                                checked={form.featured}
                                onChange={e => setForm({...form, featured: e.target.checked})}
                            />
                            <span className="label-text flex items-center gap-1 font-bold">
                                <Star size={16} className={form.featured ? 'text-warning fill-warning' : 'opacity-30'} />
                                Producto destacado
                            </span>
                        </label>
                    </div>

                    <div className="form-control">
                        <label className="label-text mb-1">Extracto</label>
                        <input
                            type="text"
                            placeholder="Breve extracto del producto..."
                            className="input input-bordered"
                            value={form.summary}
                            onChange={e => setForm({...form, summary: e.target.value})}
                            maxLength={255}
                        />
                    </div>

                    <div className="form-control">
                        <label className="label-text mb-1">Descripción</label>
                        <textarea className="textarea textarea-bordered h-24" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    </div>

                    <div className="md:col-span-2 pt-4">
                        <label className="label-text font-bold mb-4 block text-primary">
                            Galería de Imágenes
                        </label>
                        <ImageGalleryUploader
                            images={images}
                            onImagesChange={(newImages) => setImages(newImages)}
                        />
                    </div>

                    <div className="flex flex-col gap-2 mt-4">
                        <button type="submit" className="btn btn-primary">
                            {editingId ? 'Actualizar Producto' : 'Guardar Producto'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={cancelEdit} className="btn btn-ghost">Cancelar</button>
                        )}
                    </div>
                </form>
            </div>

            {/* Tabla de Inventario */}
            <div className="lg:col-span-2 card bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-4 mb-6">
                        <h2 className="card-title text-2xl font-bold">Inventario</h2>
                        <p>Total: ({totalProducts})</p>
                        <div className="form-control w-full max-w-xs">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o descripción..."
                                    className="input input-bordered input-sm w-full pl-10"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Producto</th>
                                    <th className="text-center">⭐</th>
                                    <th>Precio</th>
                                    <th>Stock</th>
                                    <th className="text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id}>
                                        <td className="flex items-end">
                                            {p.image && <img src={p.image} className='w-12' alt={p.name} />}
                                            {p.image2 && <img src={p.image2} className='w-6' alt={p.name} />}
                                            {p.image3 && <img src={p.image3} className='w-6' alt={p.name} />}
                                            {p.image4 && <img src={p.image4} className='w-6' alt={p.name} />}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <div className="font-bold">{p.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* ── Columna estrella toggle ── */}
                                        <td className="text-center">
                                            <button
                                                onClick={() => toggleFeatured(p)}
                                                className="btn btn-ghost btn-xs btn-square"
                                                title={p.featured ? 'Quitar destacado' : 'Marcar destacado'}
                                            >
                                                <Star
                                                    size={20}
                                                    className={p.featured ? 'text-warning fill-warning' : 'opacity-25'}
                                                />
                                            </button>
                                        </td>
                                        <td>{p.price} €</td>
                                        <td>
                                            <span className={`badge ${p.stock > 0 ? 'badge-success' : 'badge-error'} badge-sm`}>
                                                {p.stock}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => startEdit(p)} className="btn btn-square btn-sm btn-ghost text-info">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button onClick={() => openDeleteModal(p.id)} className="btn btn-square btn-sm btn-ghost text-error">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-between items-center mt-6 p-4 rounded-lg">
                        <div className="text-sm opacity-60">
                            Mostrando productos {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, totalProducts)} de {totalProducts}
                        </div>
                        <div className="join">
                            <button
                                className="join-item btn btn-sm btn-outline border-base-300"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                « Anterior
                            </button>
                            <button className="join-item btn btn-sm btn-active border-base-300 no-animation cursor-default">
                                Página {currentPage}
                            </button>
                            <button
                                className="join-item btn btn-sm btn-outline border-base-300"
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={currentPage >= Math.ceil(totalProducts / 10)}
                            >
                                Siguiente »
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title="¿Eliminar producto?"
                message="Esta acción no se puede deshacer. El archivo de imagen también se borrará del servidor."
                onConfirm={confirmDelete}
                onCancel={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default AdminProducts;
