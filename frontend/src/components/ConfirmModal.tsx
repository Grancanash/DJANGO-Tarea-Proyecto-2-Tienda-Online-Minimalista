import { AlertTriangle } from 'lucide-react';

interface Props {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, isLoading }: Props) => {
    if (!isOpen) return null;

    return (
        <div className="modal modal-open modal-bottom sm:modal-middle">
            <div className="modal-box border-t-4 border-error">
                <div className="flex items-center gap-4">
                    <div className="bg-error/10 p-3 rounded-full text-error">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{title}</h3>
                        <p className="py-2 text-sm opacity-70">{message}</p>
                    </div>
                </div>
                <div className="modal-action">
                    <button 
                        className="btn btn-ghost" 
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button 
                        className={`btn btn-error text-white ${isLoading ? 'loading' : ''}`}
                        onClick={onConfirm}
                    >
                        {isLoading ? 'Eliminando...' : 'Confirmar Eliminación'}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop bg-black/50" onClick={onCancel}></div>
        </div>
    );
};

export default ConfirmModal;