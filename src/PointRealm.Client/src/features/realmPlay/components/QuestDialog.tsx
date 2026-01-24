import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';

const questSchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    description: z.string().max(500).optional(),
});

type QuestFormValues = z.infer<typeof questSchema>;

interface QuestDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string, description: string) => Promise<void>;
    initialValues?: { title: string; description: string };
    mode: 'add' | 'edit';
}

export function QuestDialog({ isOpen, onClose, onSubmit, initialValues, mode }: QuestDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // We can use a simple state or react-hook-form
    // Since I don't know if I have the full UI library for Dialog, I'll build a custom modal overlay
    const { register, handleSubmit, reset, formState: { errors } } = useForm<QuestFormValues>({
        resolver: zodResolver(questSchema),
        defaultValues: initialValues || { title: '', description: '' }
    });

    useEffect(() => {
        if (isOpen && initialValues) {
            reset(initialValues);
        } else if (isOpen) {
            reset({ title: '', description: '' });
        }
    }, [isOpen, initialValues, reset]);

    if (!isOpen) return null;

    const handleFormSubmit = async (data: QuestFormValues) => {
        setIsSubmitting(true);
        try {
            await onSubmit(data.title, data.description || '');
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[var(--pr-surface)] border border-[var(--pr-border)] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <header className="px-6 py-4 flex items-center justify-between border-b border-[var(--pr-border)] bg-[var(--pr-surface-dim)]">
                    <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--pr-heading-font)' }}>
                        {mode === 'add' ? 'New Quest' : 'Edit Quest'}
                    </h2>
                    <button onClick={onClose} className="text-[var(--pr-text-muted)] hover:text-[var(--pr-text)]">
                        <X className="w-5 h-5" />
                    </button>
                </header>
                
                <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--pr-text-dim)]">Quest Title</label>
                        <input 
                            {...register('title')}
                            className="w-full px-3 py-2 bg-[var(--pr-bg)] border border-[var(--pr-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--pr-primary)] text-[var(--pr-text)] placeholder-[var(--pr-text-muted)]"
                            placeholder="e.g. The Caverns of Time"
                            autoFocus
                        />
                        {errors.title && <p className="text-xs text-[var(--pr-destructive)]">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--pr-text-dim)]">Description (Optional)</label>
                        <textarea 
                            {...register('description')}
                            className="w-full px-3 py-2 bg-[var(--pr-bg)] border border-[var(--pr-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--pr-primary)] text-[var(--pr-text)] min-h-[100px] resize-none"
                            placeholder="Briefly describe the challenge..."
                        />
                        {errors.description && <p className="text-xs text-[var(--pr-destructive)]">{errors.description.message}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 rounded-md hover:bg-[var(--pr-surface-hover)] text-[var(--pr-text-dim)] text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-md bg-[var(--pr-primary)] text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : (mode === 'add' ? 'Add Quest' : 'Save Changes')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
