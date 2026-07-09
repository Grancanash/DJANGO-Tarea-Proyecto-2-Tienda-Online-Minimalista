import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImagePlus, X, Star } from 'lucide-react';

interface Props {
    images: (File | string | null)[];
    onImagesChange: (newImages: (File | null)[]) => void;
}

const ImageGalleryUploader = ({ images, onImagesChange }: Props) => {
    
    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Tomamos las imágenes actuales y las nuevas, máximo 4
        const updatedImages = [...images.filter(img => img !== null)];
        
        acceptedFiles.forEach(file => {
            if (updatedImages.length < 4) {
                updatedImages.push(file);
            }
        });

        // Rellenamos con null hasta llegar a 4 para mantener la estructura del backend
        const finalArray = [...updatedImages, null, null, null, null].slice(0, 4);
        onImagesChange(finalArray as (File | null)[]);
    }, [images, onImagesChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 4,
    });

    const removeImage = (index: number) => {
        const updated = [...images];
        updated[index] = null;
        // Compactamos el array para que no queden huecos
        const filtered = updated.filter(img => img !== null);
        const finalArray = [...filtered, null, null, null, null].slice(0, 4);
        onImagesChange(finalArray as (File | null)[]);
    };

    const getPreview = (img: File | string | null) => {
        if (!img) return null;
        if (typeof img === 'string') return img; // Es una URL del servidor
        return URL.createObjectURL(img); // Es un archivo nuevo recién soltado
    };

    return (
        <div className="space-y-4">
            {/* Zona de Drop */}
            <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer text-center
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-primary bg-base-100'}`}
            >
                <input {...getInputProps()} />
                <ImagePlus className="mx-auto mb-2 opacity-40" size={40} />
                <p className="text-sm font-medium">Arrastra tus fotos aquí o haz clic</p>
                <p className="text-xs opacity-50 mt-1">Máximo 4 imágenes. La primera será la principal.</p>
            </div>

            {/* Cuadrícula de Miniaturas */}
            <div className="grid grid-cols-4 gap-4">
                {images.map((img, index) => {
                    const preview = getPreview(img);
                    if (!preview) return <div key={index} className="aspect-square rounded-lg bg-base-200 border border-base-300 border-dashed" />;

                    return (
                        <div key={index} className="relative aspect-square group">
                            <img src={preview} className="w-full h-full object-cover rounded-lg border shadow-sm" alt="preview" />
                            
                            {/* Indicador de imagen principal */}
                            {index === 0 && (
                                <div className="absolute top-1 left-1 bg-yellow-400 text-white p-1 rounded-md shadow-sm" title="Principal">
                                    <Star size={12} fill="currentColor" />
                                </div>
                            )}

                            {/* Botón eliminar */}
                            <button 
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ImageGalleryUploader;