import React, { useRef, useState } from 'react';
import { ImagePlus, Loader } from 'lucide-react';

interface LogoUrlFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  getToken: () => string | null;
  placeholder?: string;
  uploadTitle?: string;
}

export const LogoUrlField = ({ label, value, onChange, getToken, placeholder, uploadTitle }: LogoUrlFieldProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const token = getToken();
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      if (res.ok) { const { url } = await res.json(); onChange(url); }
    } catch (e) { console.error('Logo upload failed:', e); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</label>
      <div className="flex items-center gap-2">
        {value && (
          <img src={value} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 bg-surface-container-highest" />
        )}
        <input type="url" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="flex-1 min-w-0 bg-surface-container-low border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} title={uploadTitle}
          className="shrink-0 w-[46px] h-[46px] flex items-center justify-center rounded-2xl bg-surface-container-high hover:bg-surface-container-highest transition-colors disabled:opacity-50">
          {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      </div>
    </div>
  );
};
