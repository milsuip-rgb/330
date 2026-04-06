import React, { useState, useEffect } from 'react';
import { auth, loginWithGoogle, logout, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { LogOut, Plus, Trash2, Edit2, Upload, X, Check, AlertCircle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

function ConfirmModal({ isOpen, message, onConfirm, onCancel }: { isOpen: boolean, message: string, onConfirm: () => void, onCancel: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1E293B] rounded-xl p-6 max-w-sm w-full border border-white/10 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">확인</h3>
        <p className="text-[#CBD5E1] mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-[#94A3B8] hover:bg-[#334155] transition-colors">취소</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">삭제</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('cases');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#0A0F1C] text-white flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    const handleLogin = async () => {
      try {
        await loginWithGoogle();
      } catch (error: any) {
        console.error(error);
        if (error.code === 'auth/unauthorized-domain') {
          alert(`승인되지 않은 도메인입니다. Firebase 콘솔의 Authentication > Settings > Authorized domains에 현재 접속하신 도메인(${window.location.hostname})을 정확히 추가해주세요. (www 포함 여부 확인)`);
        } else {
          alert(`로그인 실패: ${error.message}`);
        }
      }
    };

    return (
      <div className="min-h-screen bg-[#0A0F1C] text-white flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-8 text-[#E2C792]">관리자 로그인</h1>
        <button 
          onClick={handleLogin}
          className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
        >
          Google 계정으로 로그인
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#1E293B] border-r border-[#334155] p-6 flex flex-col">
        <h2 className="text-xl font-bold text-[#E2C792] mb-8">관리자 페이지</h2>
        
        <nav className="flex-1 flex flex-col gap-2">
          {[
            { id: 'cases', label: '성공사례 관리' },
            { id: 'lawyers', label: '변호사 관리' },
            { id: 'certificates', label: '위촉장 관리' },
            { id: 'consultations', label: '상담 신청 내역' },
            { id: 'popups', label: '팝업 관리' },
            { id: 'settings', label: '설정 관리' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-left px-4 py-3 rounded-lg transition-colors ${
                activeTab === tab.id ? 'bg-[#334155] text-white font-bold' : 'text-[#94A3B8] hover:bg-[#334155]/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-[#334155]">
          <div className="text-sm text-[#94A3B8] mb-4 truncate">{user.email}</div>
          <div className="flex flex-col gap-4">
            <Link 
              to="/"
              className="flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors w-full"
            >
              <Home className="w-4 h-4" />
              <span>랜딩페이지로 돌아가기</span>
            </Link>
            <button 
              onClick={logout}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'cases' && <CasesManager />}
        {activeTab === 'lawyers' && <LawyersManager />}
        {activeTab === 'certificates' && <CertificatesManager />}
        {activeTab === 'consultations' && <ConsultationsManager />}
        {activeTab === 'popups' && <PopupsManager />}
        {activeTab === 'settings' && <SettingsManager />}
      </div>
    </div>
  );
}

// --- Helper Components ---

function ImageUpload({ onUpload, currentImg, folder }: { onUpload: (url: string) => void, currentImg?: string, folder: string }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImg || '');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const maxWidth = 800;
          const maxHeight = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setPreview(dataUrl);
          onUpload(dataUrl);
          setUploading(false);
        };
        img.onerror = () => {
          alert("이미지 처리 중 오류가 발생했습니다.");
          setUploading(false);
        };
      };
      reader.onerror = () => {
        alert("파일을 읽는 중 오류가 발생했습니다.");
        setUploading(false);
      };
    } catch (error) {
      console.error("Upload error", error);
      alert("이미지 업로드 중 오류가 발생했습니다.");
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#334155]">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-24 h-24 rounded-lg bg-[#0A0F1C] border border-dashed border-[#334155] flex items-center justify-center text-[#475569]">
            <Upload className="w-6 h-6" />
          </div>
        )}
        <label className="cursor-pointer bg-[#334155] hover:bg-[#475569] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          {uploading ? '업로드 중...' : '이미지 선택'}
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}

// --- Subcomponents for each tab ---

function CasesManager() {
  const [cases, setCases] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ type: '', result: '', desc: '', docImg: '', order: 0 });

  useEffect(() => {
    const q = query(collection(db, 'cases'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Cases fetch error:", error);
      if (error.message.includes('permission')) {
        alert("권한이 없습니다. 관리자 계정으로 로그인해주세요.");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.docImg) {
      alert("이미지를 업로드해주세요.");
      return;
    }
    try {
      if (editId) {
        await updateDoc(doc(db, 'cases', editId), formData);
      } else {
        await addDoc(collection(db, 'cases'), { ...formData, createdAt: new Date().toISOString() });
      }
      setIsEditing(false);
      setEditId(null);
      setFormData({ type: '', result: '', desc: '', docImg: '', order: 0 });
    } catch (error) {
      console.error("Error saving case", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteDoc(doc(db, 'cases', deleteId));
        setDeleteId(null);
      } catch (error) {
        console.error("Error deleting case", error);
      }
    }
  };

  return (
    <div>
      <ConfirmModal 
        isOpen={!!deleteId} 
        message="정말 삭제하시겠습니까?" 
        onConfirm={handleDelete} 
        onCancel={() => setDeleteId(null)} 
      />
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">성공사례 관리</h3>
        <button 
          onClick={() => { setIsEditing(true); setEditId(null); setFormData({ type: '', result: '', desc: '', docImg: '', order: cases.length }); }}
          className="bg-[#E2C792] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#C5A880] transition-colors"
        >
          <Plus className="w-4 h-4" /> 추가하기
        </button>
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-[#1E293B] p-6 rounded-xl mb-8 border border-[#334155]">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">사건 종류</label>
              <input type="text" required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-[#0A0F1C] border border-[#334155] rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">결과</label>
              <input type="text" required value={formData.result} onChange={e => setFormData({...formData, result: e.target.value})} className="w-full bg-[#0A0F1C] border border-[#334155] rounded-lg px-4 py-2 text-white" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-[#94A3B8] mb-1">설명</label>
              <input type="text" required value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} className="w-full bg-[#0A0F1C] border border-[#334155] rounded-lg px-4 py-2 text-white" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-[#94A3B8] mb-2">판결문 이미지</label>
              <ImageUpload folder="cases" currentImg={formData.docImg} onUpload={(url) => setFormData({...formData, docImg: url})} />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">순서</label>
              <input type="number" required value={formData.order} onChange={e => setFormData({...formData, order: Number(e.target.value)})} className="w-full bg-[#0A0F1C] border border-[#334155] rounded-lg px-4 py-2 text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-[#94A3B8] hover:text-white">취소</button>
            <button type="submit" className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-600">저장</button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {cases.map((c) => (
          <div key={c.id} className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src={c.docImg} alt={c.type} className="w-12 h-16 object-cover rounded border border-[#334155]" />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="bg-[#334155] px-2 py-1 rounded text-xs text-[#94A3B8]">순서: {c.order}</span>
                  <span className="font-bold text-[#E2C792]">{c.type}</span>
                  <span className="text-emerald-400 font-bold">{c.result}</span>
                </div>
                <p className="text-[#94A3B8] text-sm">{c.desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setFormData(c); setEditId(c.id); setIsEditing(true); }} className="p-2 text-[#94A3B8] hover:text-white bg-[#0A0F1C] rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => setDeleteId(c.id)} className="p-2 text-red-400 hover:text-red-300 bg-[#0A0F1C] rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {cases.length === 0 && <div className="text-center text-[#94A3B8] py-8">등록된 성공사례가 없습니다.</div>}
      </div>
    </div>
  );
}

function LawyersManager() {
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', role: '', img: '', order: 0 });

  useEffect(() => {
    const q = query(collection(db, 'lawyers'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLawyers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Lawyers fetch error:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.img) {
      alert("이미지를 업로드해주세요.");
      return;
    }
    try {
      if (editId) {
        await updateDoc(doc(db, 'lawyers', editId), formData);
      } else {
        await addDoc(collection(db, 'lawyers'), { ...formData, createdAt: new Date().toISOString() });
      }
      setIsEditing(false);
      setEditId(null);
      setFormData({ name: '', role: '', img: '', order: 0 });
    } catch (error) {
      console.error("Error saving lawyer", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteDoc(doc(db, 'lawyers', deleteId));
        setDeleteId(null);
      } catch (error) {
        console.error("Error deleting lawyer", error);
      }
    }
  };

  return (
    <div>
      <ConfirmModal 
        isOpen={!!deleteId} 
        message="정말 삭제하시겠습니까?" 
        onConfirm={handleDelete} 
        onCancel={() => setDeleteId(null)} 
      />
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">변호사 관리</h3>
        <button 
          onClick={() => { setIsEditing(true); setEditId(null); setFormData({ name: '', role: '', img: '', order: lawyers.length }); }}
          className="bg-[#E2C792] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#C5A880] transition-colors"
        >
          <Plus className="w-4 h-4" /> 추가하기
        </button>
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-[#1E293B] p-6 rounded-xl mb-8 border border-[#334155]">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">이름</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0A0F1C] border border-[#334155] rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">직책</label>
              <input type="text" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-[#0A0F1C] border border-[#334155] rounded-lg px-4 py-2 text-white" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-[#94A3B8] mb-2">변호사 사진</label>
              <ImageUpload folder="lawyers" currentImg={formData.img} onUpload={(url) => setFormData({...formData, img: url})} />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">순서</label>
              <input type="number" required value={formData.order} onChange={e => setFormData({...formData, order: Number(e.target.value)})} className="w-full bg-[#0A0F1C] border border-[#334155] rounded-lg px-4 py-2 text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-[#94A3B8] hover:text-white">취소</button>
            <button type="submit" className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-600">저장</button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {lawyers.map((l) => (
          <div key={l.id} className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src={l.img} alt={l.name} className="w-12 h-12 rounded-full object-cover border border-[#334155]" />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="bg-[#334155] px-2 py-1 rounded text-xs text-[#94A3B8]">순서: {l.order}</span>
                  <span className="font-bold text-white">{l.name}</span>
                  <span className="text-[#E2C792] text-sm">{l.role}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setFormData(l); setEditId(l.id); setIsEditing(true); }} className="p-2 text-[#94A3B8] hover:text-white bg-[#0A0F1C] rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => setDeleteId(l.id)} className="p-2 text-red-400 hover:text-red-300 bg-[#0A0F1C] rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {lawyers.length === 0 && <div className="text-center text-[#94A3B8] py-8">등록된 변호사가 없습니다.</div>}
      </div>
    </div>
  );
}

function CertificatesManager() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', img: '', order: 0 });

  useEffect(() => {
    const q = query(collection(db, 'certificates'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCertificates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Certificates fetch error:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.img) {
      alert("이미지를 업로드해주세요.");
      return;
    }
    try {
      if (editId) {
        await updateDoc(doc(db, 'certificates', editId), formData);
      } else {
        await addDoc(collection(db, 'certificates'), { ...formData, createdAt: new Date().toISOString() });
      }
      setIsEditing(false);
      setEditId(null);
      setFormData({ title: '', img: '', order: 0 });
    } catch (error) {
      console.error("Error saving certificate", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteDoc(doc(db, 'certificates', deleteId));
        setDeleteId(null);
      } catch (error) {
        console.error("Error deleting certificate", error);
      }
    }
  };

  return (
    <div>
      <ConfirmModal 
        isOpen={!!deleteId} 
        message="정말 삭제하시겠습니까?" 
        onConfirm={handleDelete} 
        onCancel={() => setDeleteId(null)} 
      />
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">위촉장 관리</h3>
        <button 
          onClick={() => { setIsEditing(true); setEditId(null); setFormData({ title: '', img: '', order: certificates.length }); }}
          className="bg-[#E2C792] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#C5A880] transition-colors"
        >
          <Plus className="w-4 h-4" /> 추가하기
        </button>
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-[#1E293B] p-6 rounded-xl mb-8 border border-[#334155]">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="col-span-2">
              <label className="block text-sm text-[#94A3B8] mb-1">제목</label>
              <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[#0A0F1C] border border-[#334155] rounded-lg px-4 py-2 text-white" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-[#94A3B8] mb-2">위촉장 이미지</label>
              <ImageUpload folder="certificates" currentImg={formData.img} onUpload={(url) => setFormData({...formData, img: url})} />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">순서</label>
              <input type="number" required value={formData.order} onChange={e => setFormData({...formData, order: Number(e.target.value)})} className="w-full bg-[#0A0F1C] border border-[#334155] rounded-lg px-4 py-2 text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-[#94A3B8] hover:text-white">취소</button>
            <button type="submit" className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-600">저장</button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {certificates.map((c) => (
          <div key={c.id} className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src={c.img} alt={c.title} className="w-16 h-12 object-cover border border-[#334155] rounded" />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="bg-[#334155] px-2 py-1 rounded text-xs text-[#94A3B8]">순서: {c.order}</span>
                  <span className="font-bold text-white">{c.title}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setFormData(c); setEditId(c.id); setIsEditing(true); }} className="p-2 text-[#94A3B8] hover:text-white bg-[#0A0F1C] rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => setDeleteId(c.id)} className="p-2 text-red-400 hover:text-red-300 bg-[#0A0F1C] rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {certificates.length === 0 && <div className="text-center text-[#94A3B8] py-8">등록된 위촉장이 없습니다.</div>}
      </div>
    </div>
  );
}

function ConsultationsManager() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'consultations'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setConsultations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Consultations fetch error:", error);
      if (error.message.includes('permission')) {
        alert("상담 내역을 볼 권한이 없습니다. 관리자 계정인지 확인해주세요.");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'consultations', id), { status: newStatus });
    } catch (error) {
      console.error("Error updating status", error);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteDoc(doc(db, 'consultations', deleteId));
        setDeleteId(null);
      } catch (error) {
        console.error("Error deleting consultation", error);
      }
    }
  };

  return (
    <div>
      <ConfirmModal 
        isOpen={!!deleteId} 
        message="정말 삭제하시겠습니까?" 
        onConfirm={handleDelete} 
        onCancel={() => setDeleteId(null)} 
      />
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">상담 신청 내역</h3>
      </div>

      <div className="grid gap-4">
        {consultations.map((c) => (
          <div key={c.id} className="bg-[#1E293B] p-6 rounded-xl border border-[#334155]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-lg">{c.name}</span>
                  <span className="text-[#94A3B8]">{c.phone}</span>
                  <span className="bg-[#334155] px-2 py-1 rounded text-xs text-[#E2C792]">농도: {c.alcoholLevel || '미기재'}</span>
                  <span className="bg-[#334155] px-2 py-1 rounded text-xs text-[#E2C792]">전력: {c.duiHistory || '미기재'}</span>
                </div>
                <div className="text-sm text-[#94A3B8]">
                  신청일시: {new Date(c.createdAt).toLocaleString('ko-KR')}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  value={c.status}
                  onChange={(e) => handleStatusChange(c.id, e.target.value)}
                  className={`bg-[#0A0F1C] border border-[#334155] rounded-lg px-3 py-1.5 text-sm font-medium outline-none
                    ${c.status === 'pending' ? 'text-yellow-400' : ''}
                    ${c.status === 'contacted' ? 'text-blue-400' : ''}
                    ${c.status === 'completed' ? 'text-emerald-400' : ''}
                  `}
                >
                  <option value="pending">대기중</option>
                  <option value="contacted">연락완료</option>
                  <option value="completed">상담완료</option>
                </select>
                <button onClick={() => setDeleteId(c.id)} className="p-2 text-red-400 hover:text-red-300 bg-[#0A0F1C] rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-[#0A0F1C] p-4 rounded-lg text-[#94A3B8] whitespace-pre-wrap">
              {c.details}
            </div>
          </div>
        ))}
        {consultations.length === 0 && <div className="text-center text-[#94A3B8] py-8">상담 신청 내역이 없습니다.</div>}
      </div>
    </div>
  );
}

function PopupsManager() {
  const [popups, setPopups] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', img: '', link: '', isActive: true });

  useEffect(() => {
    const q = query(collection(db, 'popups'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPopups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Popups fetch error:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert("팝업 제목을 입력해주세요.");
      return;
    }
    if (!formData.img) {
      alert("이미지를 업로드해주세요.");
      return;
    }
    try {
      if (editId) {
        await updateDoc(doc(db, 'popups', editId), formData);
      } else {
        await addDoc(collection(db, 'popups'), { ...formData, createdAt: new Date().toISOString() });
      }
      setIsEditing(false);
      setEditId(null);
      setFormData({ title: '', img: '', link: '', isActive: true });
    } catch (error) {
      console.error("Error saving popup", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteDoc(doc(db, 'popups', deleteId));
        setDeleteId(null);
      } catch (error) {
        console.error("Error deleting popup", error);
      }
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'popups', id), { isActive: !currentStatus });
    } catch (error) {
      console.error("Error toggling popup status", error);
    }
  };

  return (
    <div>
      <ConfirmModal 
        isOpen={!!deleteId} 
        message="정말 삭제하시겠습니까?" 
        onConfirm={handleDelete} 
        onCancel={() => setDeleteId(null)} 
      />
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">팝업 관리</h3>
        <button 
          onClick={() => { setIsEditing(true); setEditId(null); setFormData({ title: '', img: '', link: '', isActive: true }); }}
          className="bg-[#E2C792] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#C5A880] transition-colors"
        >
          <Plus className="w-4 h-4" /> 추가하기
        </button>
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-[#1E293B] p-6 rounded-xl mb-8 border border-[#334155]">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="col-span-2">
              <label className="block text-sm text-[#94A3B8] mb-1">팝업 제목 <span className="text-red-400">*</span></label>
              <input type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[#0A0F1C] border border-[#334155] rounded-lg px-4 py-2 text-white" placeholder="팝업 제목을 입력하세요" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-[#94A3B8] mb-2">팝업 이미지</label>
              <ImageUpload folder="popups" currentImg={formData.img} onUpload={(url) => setFormData({...formData, img: url})} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-[#94A3B8] mb-1">연결 링크 (선택사항)</label>
              <input type="text" value={formData.link || ''} onChange={e => setFormData({...formData, link: e.target.value})} className="w-full bg-[#0A0F1C] border border-[#334155] rounded-lg px-4 py-2 text-white" placeholder="https://..." />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={formData.isActive ?? true} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4" />
              <label htmlFor="isActive" className="text-sm text-[#94A3B8]">활성화 상태</label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-[#94A3B8] hover:text-white">취소</button>
            <button 
              type="submit" 
              disabled={!formData.title?.trim() || !formData.img}
              className={`px-6 py-2 rounded-lg font-bold transition-colors ${
                !formData.title?.trim() || !formData.img 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              저장
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {popups.map((p) => (
          <div key={p.id} className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src={p.img} alt={p.title} className="w-16 h-16 object-cover border border-[#334155] rounded" />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {p.isActive ? '활성' : '비활성'}
                  </span>
                  <span className="font-bold text-white">{p.title}</span>
                </div>
                <p className="text-[#94A3B8] text-xs truncate max-w-xs">{p.link || '링크 없음'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => toggleActive(p.id, p.isActive)} 
                className={`p-2 rounded-lg transition-colors ${p.isActive ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-[#94A3B8] hover:bg-[#334155]'}`}
              >
                {p.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              </button>
              <button onClick={() => { setFormData(p); setEditId(p.id); setIsEditing(true); }} className="p-2 text-[#94A3B8] hover:text-white bg-[#0A0F1C] rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => setDeleteId(p.id)} className="p-2 text-red-400 hover:text-red-300 bg-[#0A0F1C] rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {popups.length === 0 && <div className="text-center text-[#94A3B8] py-8">등록된 팝업이 없습니다.</div>}
      </div>
    </div>
  );
}

function SettingsManager() {
  const [settings, setSettings] = useState({ botToken: '', chatId: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'telegram'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as any);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Use setDoc to create or overwrite the document
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'settings', 'telegram'), settings);
      alert('설정이 저장되었습니다.');
    } catch (error) {
      console.error("Error saving settings", error);
      alert('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">설정 관리</h3>
      </div>

      <div className="bg-[#1E293B] p-6 rounded-xl border border-[#334155] max-w-2xl">
        <h4 className="text-lg font-bold text-white mb-4">텔레그램 알림 설정</h4>
        <p className="text-[#94A3B8] text-sm mb-6">
          웹페이지에서 상담 신청이 들어왔을 때 텔레그램으로 알림을 받기 위한 설정입니다.
          이곳에 봇 토큰과 챗 ID를 입력하시면, 기존 환경 변수 대신 이 설정값이 우선적으로 사용됩니다.
        </p>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">Bot Token (봇 토큰)</label>
            <input 
              type="text" 
              value={settings.botToken || ''} 
              onChange={e => setSettings({...settings, botToken: e.target.value})} 
              className="w-full bg-[#0A0F1C] border border-[#334155] rounded-lg px-4 py-2 text-white" 
              placeholder="예: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz" 
            />
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">Chat ID (챗 ID)</label>
            <input 
              type="text" 
              value={settings.chatId || ''} 
              onChange={e => setSettings({...settings, chatId: e.target.value})} 
              className="w-full bg-[#0A0F1C] border border-[#334155] rounded-lg px-4 py-2 text-white" 
              placeholder="예: 123456789" 
            />
          </div>
          <div className="flex justify-end mt-4">
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-600 disabled:opacity-50"
            >
              {isSaving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
