import React, { useState, useState as useDropState, useRef } from 'react';
import { Upload, File, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { supabase } from '../supabaseClient';

const FileUpload = ({
  bucketName = 'lms-files',
  folderPath = 'general',
  allowedTypes = ['pdf', 'doc', 'docx', 'zip', 'png', 'jpg'],
  maxSizeBytes = 10 * 1024 * 1024,
  onUploadSuccess,
  onUploadError
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const validateFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return false;
    if (selectedFile.size > maxSizeBytes) {
      setError(`File too large. Max ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`);
      return false;
    }
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(ext)) {
      setError(`File type .${ext} not allowed. Supported: ${allowedTypes.join(', ')}`);
      return false;
    }
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const f = e.dataTransfer.files[0];
      if (validateFile(f)) setFile(f);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      if (validateFile(f)) setFile(f);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setProgress(20); setError('');
    try {
      const ext = file.name.split('.').pop();
      const uniqueName = `${folderPath}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const { data, error: uploadError } = await supabase.storage.from(bucketName).upload(uniqueName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      setProgress(80);
      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(uniqueName);
      setProgress(100);
      setUploaded(true);
      if (onUploadSuccess) onUploadSuccess(urlData.publicUrl, file.name, file.size);
      setFile(null);
    } catch (err) {
      const msg = err.message || 'File upload failed.';
      setError(msg);
      if (onUploadError) onUploadError(msg);
    } finally {
      setUploading(false);
      setTimeout(() => { setProgress(0); setUploaded(false); }, 2000);
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setError('');
  };

  const dropZoneStyle = {
    border: `2px dashed ${dragActive ? 'var(--accent)' : file ? 'var(--success)' : 'var(--border-2)'}`,
    borderRadius: 12,
    padding: '24px 16px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 10, cursor: 'pointer', transition: 'all 0.2s',
    background: dragActive ? 'var(--accent-bg)' : file ? 'var(--success-bg)' : 'var(--surface-2)',
    minHeight: 140,
    fontFamily: 'var(--font)',
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'var(--font)' }}>
      <div style={dropZoneStyle}
        onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}>
        <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />

        {file ? (
          <>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--success-bg)', border: '1px solid #6ee7b7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <File size={18} color="var(--success)" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: 'var(--text)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-2)' }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <button type="button" onClick={clearFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              <X size={12} /> Remove
            </button>
          </>
        ) : (
          <>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={18} color="var(--text-2)" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Drag & drop or <span style={{ color: 'var(--accent)' }}>click to browse</span></p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-2)' }}>Supported: {allowedTypes.join(', ')} · Max {(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB</p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'var(--danger-bg)', border: '1px solid #fca5a5', borderRadius: 8 }}>
          <AlertCircle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 12, color: '#991b1b' }}>{error}</p>
        </div>
      )}

      {file && !uploading && (
        <button type="button" onClick={e => { e.stopPropagation(); handleUpload(); }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 38, borderRadius: 8, fontWeight: 600, fontSize: 13, background: 'var(--success)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <CheckCircle2 size={15} /> Upload File
        </button>
      )}

      {uploading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-2)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...
            </span>
            <span>{progress}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.3s ease' }} />
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
