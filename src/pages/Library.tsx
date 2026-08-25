import React, { useState } from 'react';
import { BookOpen, Search, FileText, ChevronRight, HelpCircle } from 'lucide-react';
import { Role, LibraryDocument } from '../types/clinical';
import { mockLibrary } from '../data/mockData';
import { auditLogService } from '../services/auditLogService';

interface LibraryProps {
  userRole: Role;
  userName: string;
}

export const Library: React.FC<LibraryProps> = ({ userRole, userName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'manual' | 'protocolo'>('all');
  const [selectedDoc, setSelectedDoc] = useState<LibraryDocument | null>(null);

  const filteredDocs = mockLibrary.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.code && doc.code.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = activeTab === 'all' || doc.category === activeTab;
    
    return matchesSearch && matchesCategory;
  });

  const handleOpenDoc = (doc: LibraryDocument) => {
    setSelectedDoc(doc);
    
    // Registrar en auditoría
    auditLogService.addLog(
      'Uso de Biblioteca',
      `Consultó el documento: "${doc.title}" (Código: ${doc.code || 'N/A'})`,
      'ia',
      { id: 'user-current', name: userName, role: userRole }
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-clinical-dark">Biblioteca Digital Clínica</h2>
          <p className="text-xs text-clinical-textMuted">
            Corpus científico, manuales de tratamiento estratégico Arezzo y protocolos clínicos oficiales.
          </p>
        </div>
      </div>

      {/* Buscador y Categorías */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold w-full md:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-md transition-all ${activeTab === 'all' ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-md transition-all ${activeTab === 'manual' ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Manuales TBE
          </button>
          <button
            onClick={() => setActiveTab('protocolo')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-md transition-all ${activeTab === 'protocolo' ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Protocolos Clínicos
          </button>
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título, código o contenido..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-clinical-accent focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Listado de Documentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => (
          <div 
            key={doc.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-slate-350 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="bg-blue-50 p-2.5 rounded-lg text-clinical-accent shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                {doc.code && (
                  <span className="text-[9px] px-2 py-0.5 border rounded-full font-bold uppercase bg-slate-50 border-slate-200 text-slate-500">
                    {doc.code}
                  </span>
                )}
              </div>
              
              <div>
                <h3 className="text-xs font-bold text-clinical-dark block line-clamp-1">{doc.title}</h3>
                <span className="text-[10px] text-clinical-teal font-semibold uppercase tracking-wider block mt-0.5">
                  {doc.category === 'manual' ? 'Manual Técnico' : 'Protocolo Clínico'}
                </span>
                <p className="text-slate-500 text-xs mt-2 line-clamp-3 leading-relaxed">
                  {doc.summary}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between">
              <span className="text-[9px] text-slate-400 font-bold uppercase">
                Acceso Clínico Autorizado
              </span>
              <button
                onClick={() => handleOpenDoc(doc)}
                className="flex items-center gap-0.5 px-3 py-1.5 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Consultar
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filteredDocs.length === 0 && (
          <div className="col-span-2 text-center py-10 text-slate-400 text-xs">
            No se encontraron documentos clínicos con los filtros actuales.
          </div>
        )}
      </div>

      {/* Modal Visor Documento */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-clinical-dark text-white rounded-t-xl shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-clinical-accent" />
                <h3 className="text-sm font-bold">{selectedDoc.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-600">
              <div className="bg-blue-50 border-l-4 border-clinical-accent p-3.5 rounded-r-lg font-medium text-clinical-accent">
                Resumen Técnico: {selectedDoc.summary}
              </div>

              <div className="space-y-3">
                <span className="font-bold text-clinical-dark text-xs block">Contenido del Corpus de Referencia:</span>
                <p className="whitespace-pre-line text-slate-700 bg-slate-50 p-4 border border-slate-100 rounded-lg font-mono">
                  {selectedDoc.content}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                Documento de propiedad intelectual de BreveMente. Prohibida su distribución.
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50 rounded-b-xl">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-clinical-accent text-white rounded-lg text-xs font-semibold hover:bg-clinical-accentHover transition-colors shadow-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
